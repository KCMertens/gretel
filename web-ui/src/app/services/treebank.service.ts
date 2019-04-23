import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Treebank, TreebankComponent, TreebankMetadata, ComponentGroup, FuzzyNumber } from '../treebank';
import { ConfigurationService } from './configuration.service';
import { BehaviorSubject, Observable, ReplaySubject, merge } from 'rxjs';
import { take, filter } from 'rxjs/operators';


export interface TreebankInfo {
    treebank: Treebank;
    metadata: TreebankMetadata[];

    components: { [id: string]: TreebankComponent };
    componentGroups?: ComponentGroup[];
    variants?: string[];
}

export interface ConfiguredTreebanks {
    [provider: string]: {
        [corpus: string]: TreebankInfo;
    };
}

interface ConfiguredTreebanksResponse {
    [treebank: string]: {
        components: {
            [component: string]: {
                id: string,
                title: string,
                description: string,
                sentences: number | '?',
                words: number | '?',
                group?: string,
                variant?: string,
                disabled?: boolean
            }
        },
        groups?: {
            [component: string]: {
                description: string
            }
        },
        variants?: {
            [component: string]: {
                display: string
            }
        },
        description: string,
        title: string,
        metadata: {
            field: string,
            type: 'text' | 'int' | 'date',
            facet: 'checkbox' | 'slider' | 'range' | 'dropdown',
            show: boolean,
            minValue?: number | Date,
            maxValue?: number | Date,
        }[],
        multioption?: boolean
    };
}

export interface UploadedTreebankResponse {
    email: string;
    id: string;
    processed: string;
    public: '1'|'0';
    title: string;
    uploaded: string;
    user_id: string;
}

interface UploadedTreebankMetadataResponse {
    id: string;
    treebank_id: string;
    field: string;
    type: 'text' | 'int' | 'date';
    facet: 'checkbox' | 'slider' | 'date_range';
    min_value: string | null;
    max_value: string | null;
    show: '1' | '0';
}

// not quite sure what this is yet
interface UploadedTreebankShowResponse {
    basex_db: string;
    nr_sentences: string;
    nr_words: string;
    slug: string;
    title: string;
}

interface TreebankSelection {
    provider: string;
    corpus: string;
    components: string[];
}

function makeUploadedMetadata(item: UploadedTreebankMetadataResponse): TreebankMetadata {
    const metadata: TreebankMetadata = {
        field: item.field,
        type: item.type,
        facet: item.facet === 'date_range' ? 'range' : item.facet,
        show: item.show === '1'
    };

    if (['slider', 'range'].includes(metadata.facet)) {
        switch (metadata.type) {
            case 'int':
                metadata.minValue = parseInt(item.min_value, 10);
                metadata.maxValue = parseInt(item.max_value, 10);
                return metadata;
            case 'date':
                metadata.minValue = new Date(item.min_value);
                metadata.maxValue = new Date(item.max_value);
                return metadata;
        }
    }

    return metadata;
}

function makeComponent(comp: ConfiguredTreebanksResponse[string]['components'][string]): TreebankComponent {
    return {
        description: comp.description,
        disabled: !!comp.disabled,
        id: comp.id,
        selected: true,
        sentenceCount: comp.sentences,
        title: comp.title,
        wordCount: comp.words,

        group: comp.group || undefined,
        variant: comp.variant || undefined,
    };
}

function makeUploadedComponent(comp: UploadedTreebankShowResponse): TreebankComponent {
    return {
        description: '',
        disabled: false,
        id: comp.basex_db,
        selected: true,
        sentenceCount: parseInt(comp.nr_sentences, 10),
        title: comp.title,
        wordCount: parseInt(comp.nr_words, 10),

        group: undefined,
        variant: undefined,
    };
}

function makeTreebank(provider: string, id: string, bank: ConfiguredTreebanksResponse[string]): Treebank {
    return {
        id,
        displayName: bank.title || id,
        description: bank.description || undefined,
        isPublic: true,
        multiOption: bank.multioption != null ? bank.multioption : true,
        provider,
        selected: false,
    };
}

function makeUploadedTreebank(provider: string, bank: UploadedTreebankResponse): Treebank {
    return {
        id: bank.title,
        displayName: bank.title,
        description: bank.title,
        isPublic: bank.public === '1',
        multiOption: true,
        provider,
        selected: false,

        userId: parseInt(bank.user_id, 10),
        email: bank.email,
        uploaded: new Date(bank.uploaded),
        processed: new Date(bank.processed),
    };
}

function makeComponentGroup(id: string, description: string, components: TreebankComponent[]): ComponentGroup {
    const compsInGroup = components.filter(c => c.group === id && !!c.variant);

    return {
        components: compsInGroup.reduce<{[variant: string]: string}>((items, comp) => {
            items[comp.variant] = comp.id;
            return items;
        }, {}),
        description,
        key: id,
        sentenceCount: compsInGroup.reduce((count, comp) => { count.add(comp.sentenceCount); return count; }, new FuzzyNumber(0)),
        wordCount: compsInGroup.reduce((count, comp) => { count.add(comp.wordCount); return count; }, new FuzzyNumber(0)),
    };
}

function makeTreebankInfo(provider: string, corpusId: string, bank: ConfiguredTreebanksResponse[string]): TreebankInfo {
    const treebank = makeTreebank(provider, corpusId, bank);
    const components: TreebankComponent[] = Object.values(bank.components).map(makeComponent);
    const componentGroups: ComponentGroup[]|undefined = bank.groups
        ? Object.entries(bank.groups).map(([id, group]) => makeComponentGroup(id, group.description, components))
        : undefined;
    const variants: string[]|undefined = bank.variants ? Object.keys(bank.variants) : undefined;

    return {
        treebank,
        components: components.reduce<TreebankInfo['components']>((cs, c) => { cs[c.id] = c; return cs; }, {}),
        metadata: bank.metadata,
        variants,
        componentGroups,
    };
}

@Injectable()
export class TreebankService {
    public treebanks = new BehaviorSubject<{state: ConfiguredTreebanks, origin: 'init'|'url'|'user'}>({ state: {}, origin: 'init'});
    public loading = new ReplaySubject<boolean>(1);

    constructor(private configurationService: ConfigurationService, private http: HttpClient) {
        this.loading.next(true);

        merge(this.getAllConfiguredTreebanks(), this.getUploadedTreebanks())
        .subscribe(
            ({provider, result, error}) => {
                if (error) { console.warn(error.message); }
                if (result) {
                    this.treebanks.next({
                        origin: 'init',
                        state: {
                            ...this.treebanks.value.state,
                            [provider]: {
                                ...this.treebanks.value.state[provider],
                                [result.treebank.id]: result
                            }
                        }
                    });
                }
            },
            error => { /* Should never happen */ },
            () => this.loading.next(false)
        );
    }

    private getUploadedTreebanks(): Observable<{
        provider: string;
        result?: TreebankInfo;
        error?: HttpErrorResponse;
    }> {
        const ob = new ReplaySubject<{
            provider: string;
            result?: TreebankInfo;
            error?: HttpErrorResponse;
        }>();

        (async () => {
            const uploadProvider = await this.configurationService.getUploadProvider();
            const uploadUrl = await this.configurationService.getUploadApiUrl('treebank');

            let response: UploadedTreebankResponse[];
            try {
                response = await this.http.get<UploadedTreebankResponse[]>(uploadUrl).toPromise();
            } catch (error) {
                ob.next({
                    provider: uploadProvider,
                    error
                });
                ob.complete();
                return;
            }

            const completeDataRequests = response.map(bank => this.getUploadedTreebank(uploadProvider, bank));
            completeDataRequests.forEach(p => p.then(r => ob.next(r)));
            Promise.all(completeDataRequests).then(() => ob.complete());
        })();

        return ob;
    }

    private getUploadedTreebank(provider: string, bank: UploadedTreebankResponse): Promise<{
        provider: string;
        result?: TreebankInfo;
        error?: HttpErrorResponse;
    }> {
        return Promise.all([
            this.configurationService.getUploadApiUrl('treebank/show/' + bank.title)
            .then(url => this.http.get<UploadedTreebankShowResponse[]>(url).toPromise()),

            this.configurationService.getUploadApiUrl('treebank/metadata/' + bank.title)
            .then(url => this.http.get<UploadedTreebankMetadataResponse[]>(url).toPromise())
        ])
        .then(
            ([uploadedComponents, uploadedMetadata]) => {
                const components: TreebankComponent[] = uploadedComponents.map(makeUploadedComponent);
                return {
                    provider,
                    result: {
                        componentGroups: undefined,
                        components: components.reduce<TreebankInfo['components']>((cs, c) => { cs[c.id] = c; return cs; }, {}),
                        metadata: uploadedMetadata.map(makeUploadedMetadata),
                        treebank: makeUploadedTreebank(provider, bank),
                        variants: undefined
                    }
                };
            },
            ((error: HttpErrorResponse) => ({
                provider,
                error
            }))
        );
    }

    /**
     * Request treebanks for all providers (except the user-uploaded ones),
     * process them, and yield them one by one.
     */
    private getAllConfiguredTreebanks(): Observable<{
        provider: string;
        result?: TreebankInfo;
        error?: HttpErrorResponse;
    }> {
        const ob = new ReplaySubject<{
            provider: string;
            result?: TreebankInfo;
            error?: HttpErrorResponse;
        }>();

        (async () => {
            const providers = await this.configurationService.getProviders();

            const urls = await Promise.all(providers.map(async (provider) => ({
                provider,
                url: await this.configurationService.getApiUrl(provider, 'configured_treebanks')
            })));

            // Stop using await here, so requests run in parallel
            // store the requests so we know when they're all done and can close the stream
            const requests = urls.map(({provider, url}) => this.getConfiguredTreebanks(provider, url));

            // Push resulting banks into the observable, unpacking them into separate events
            requests.forEach(req => req.then(({provider, result, error}) => {
                if (result) {
                    result.forEach(tb => ob.next({provider, result: tb}));
                } else {
                    ob.next({provider, error});
                }
            }));
            // And close when all requests finished
            Promise.all(requests).then(() => ob.complete());
        })();

        return ob;
    }

    private async getConfiguredTreebanks(provider: string, url: string): Promise<{
        provider: string,
        result?: TreebankInfo[],
        error?: HttpErrorResponse
    }> {
        return this.http.get<ConfiguredTreebanksResponse>(url).toPromise()
        .then(r => Object.entries(r).map(([id, bank]) => makeTreebankInfo(provider, id, bank)))
        .then(
            (result: TreebankInfo[]) => ({
                provider,
                result
            }),
            (error: HttpErrorResponse) => ({
                provider,
                error
            })
        );
    }


    // -------------------------------------
    // SELECTION
    // -------------------------------------

    /**
     * Waits until all treebanks are loaded, then applies the selection settings
     * @param sel selections
     */
    public initSelections(sel: TreebankSelection[]) {
        // await initialization
        this.loading.pipe(
            filter(loading => !loading),
            take(1)
        )
        .subscribe(() => {
            const state = this.treebanks.value.state;

            sel.filter(s => state[s.provider] && state[s.provider][s.corpus])
            .forEach(s => {
                const corpusInfo = state[s.provider][s.corpus];
                const components = corpusInfo.treebank.multiOption
                    ? s.components
                    : s.components.filter((id, i) => i === 0);

                Object.values(corpusInfo.components)
                .forEach(component => component.selected = components.includes(component.id));
                corpusInfo.treebank.selected = true;
            });

            this.treebanks.next({
                origin: 'init',
                state
            });
        });
    }

    /**
     * Set the selected state for this bank, or toggle it if no new state is provided.
     *
     * @param provider
     * @param corpus
     * @param selected
     */
    toggleCorpus(provider: string, corpus: string, selected?: boolean) {
        const next = this.treebanks.value.state;
        const tb = next[provider] && next[provider][corpus] ? next[provider][corpus] : undefined;
        if (!tb) {
            return;
        }

        tb.treebank.selected = selected != null ? selected : !tb.treebank.selected;
        this.treebanks.next({state: next, origin: 'user'});
    }

    /**
     * Set the selected state for this component, or toggle it if no new state is provided.
     * Other components are untouched, unless the bank does not support multiOption.
     * If components are selected after toggling, the bank itself is also deselected.
     *
     * @param provider
     * @param corpus
     * @param selected
     */
    toggleComponent(provider: string, corpus: string, componentId: string, selected?: boolean) {
        const next = this.treebanks.value.state;
        const tb = next[provider] && next[provider][corpus] ? next[provider][corpus] : undefined;
        if (!tb || !tb.components[componentId] || tb.components[componentId].disabled) {
            return;
        }

        selected = selected != null ? selected : !tb.components[componentId].selected;
        let anySelected = false;
        Object.values(tb.components).forEach(c => {
            if (c.id === componentId) {
                c.selected = selected;
            } else if (!tb.treebank.multiOption) {
                c.selected = false;
            }

            anySelected = anySelected || c.selected;
        });

        console.log(provider, corpus, componentId, selected);

        tb.treebank.selected = anySelected;
        this.treebanks.next({state: next, origin: 'user'});
    }

    toggleComponents(provider: string, corpus: string, selected?: boolean) {
        const next = this.treebanks.value.state;
        const tb = next[provider] && next[provider][corpus] ? next[provider][corpus] : undefined;
        if (!tb) {
            return;
        }

        const componentsToSelect = Object.values(tb.components).filter(c => !c.disabled);
        selected = selected != null ? selected : !componentsToSelect.every(c => c.selected);
        Object.values(tb.components).forEach(c => c.selected = selected);
        if (!tb.treebank.multiOption) {
            componentsToSelect.slice(1).forEach(c => c.selected = false);
        }

        tb.treebank.selected = selected;
        this.treebanks.next({state: next, origin: 'user'});
    }

    /**
     * Set the selected state for all components in this group, or toggle it if no new state is provided.
     * Other components are untouched, unless the bank does not support multiOption.
     * If components are selected after toggling, the bank itself is also deselected.
     *
     * @param provider
     * @param corpus
     * @param selected
     */
    toggleComponentGroup(provider: string, corpus: string, group: string, selected?: boolean) {
        const next = this.treebanks.value.state;
        const tb = next[provider] && next[provider][corpus] ? next[provider][corpus] : undefined;
        const grp = tb.componentGroups.find(g => g.key === group);
        if (!tb || !grp) {
            return;
        }

        const componentsInGroup = Object.values(grp.components).filter(id => !tb.components[id].disabled);
        selected = selected != null ? selected : !componentsInGroup.every(id => tb.components[id].selected);
        componentsInGroup.forEach(id => tb.components[id].selected = selected);

        // keep only the first one in the group
        if (selected && !tb.treebank.multiOption) {
            componentsInGroup.slice(1).forEach(id => tb.components[id].selected = false);
        }

        tb.treebank.selected = Object.values(tb.components).some(c => c.selected);
        this.treebanks.next({state: next, origin: 'user'});
    }

    toggleVariant(provider: string, corpus: string, variant: string, selected?: boolean) {
        const next = this.treebanks.value.state;
        const tb = next[provider] && next[provider][corpus] ? next[provider][corpus] : undefined;

        if (!tb || !(tb.variants && tb.variants.includes(variant))) {
            return;
        }

        const componentsInVariant = tb.componentGroups.map(g => g.components[variant]).filter(id => !tb.components[id].disabled);
        selected = selected != null ? selected : !componentsInVariant.every(id => tb.components[id].selected);
        componentsInVariant.forEach(id => tb.components[id].selected = selected);
        if (selected && !tb.treebank.multiOption) {
            componentsInVariant.slice(1).forEach(id => tb.components[id].selected = false);
        }

        tb.treebank.selected = Object.values(tb.components).some(c => c.selected);
        this.treebanks.next({state: next, origin: 'user'});
    }
}

export function mapToTreebankArray(banks: ConfiguredTreebanks) {
    return Object.entries(banks)
        .map(([provider, treebanks]) => treebanks)
        .flatMap(treebanks =>
            Object.values(treebanks)
            .map(v => v.treebank)
        );
}

export type SelectedTreebanks = Array<{
    provider: string,
    corpus: string,
    components: string[]
}>;

/**
 * Get an array of all selected treebank components, grouped by their parent treebank
 * @param treebanks
 */
export function mapTreebanksToSelectionSettings(treebanks: ConfiguredTreebanks): SelectedTreebanks {
    return Object.values(treebanks).flatMap(v => Object.values(v))
    .filter(v => v.treebank.selected && Object.values(v.components).some(c => c.selected))
    .map(({treebank, components}) => ({
        provider: treebank.provider,
        corpus: treebank.id,
        components: Object.values(components).filter(c => c.selected).map(c => c.id)
    }));
}
