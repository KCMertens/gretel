import { AfterViewChecked, AfterViewInit, Component, OnInit } from '@angular/core';
import { GlobalState } from "./steps";
import { Transitions } from "./transitions";
import { Crumb } from "../../components/breadcrumb-bar/breadcrumb-bar.component";

@Component({
    selector: 'grt-multi-step-page',
    templateUrl: './multi-step-page.component.html',
    styleUrls: ['./multi-step-page.component.scss']
})

export class MultiStepPageComponent<T extends GlobalState> implements OnInit, AfterViewChecked {



    globalState: T;
    configuration: any;
    transitions: Transitions<T>;
    crumbs: Crumb[];
    components: any[];

    constructor() {

    }

    ngOnInit() {
        // Template Design Pattern
        this.initializeCrumbs();

        this.initializeGlobalState();
        this.initializeConfiguration();
        this.initializeTransitions();
        this.globalState.currentStep.enterStep(this.globalState).subscribe( state =>{
            this.globalState = state;
        })

    }

    initializeCrumbs() {
        throw new Error('Not implemented');
    }

    initializeComponents() {
        throw new Error('Not implemented');
    }
    initializeGlobalState() {
        throw new Error('Not implemented');
    }

    initializeConfiguration() {
        throw new Error('Not implemented');
    }

    initializeTransitions() {
        throw new Error('Not implemented');
    }


    ngAfterViewChecked() {
        this.initializeComponents();
    }


    /**
     * Go back one step
     */
    prev() {
        this.transitions.fire('decrease', this.globalState).subscribe((s) => {
            this.updateGlobalState(s)
        });

    }

    updateGlobalState(state: T) {
        this.globalState = state;
    }


    /**
     *  go to next step. Only can continue of the current step is valid.
     */
    next() {
        if (this.globalState.valid) {
            this.transitions.fire('increase', this.globalState).subscribe((s) => {
                this.updateGlobalState(s)
            });
        } else {
            this.showWarning();
        }
    }

    /**
     * Sets
     * @param boolean
     */
    setValid(valid: boolean) {
        this.globalState.valid = valid
    }

    /**
     * Show the warning of the appropriate component.
     */
    showWarning() {
        this.components[this.globalState.currentStep.number].showWarning();

    }


}
