import {Component, OnInit, ViewChild} from '@angular/core';
import {Crumb} from "../../components/breadcrumb-bar/breadcrumb-bar.component";
import {GlobalState, XpathInputStep, SentenceInputStep, ParseStep} from "../multi-step-page/steps";
import {DecreaseTransition, IncreaseTransition, Transitions} from "../multi-step-page/transitions";
import {MultiStepPageComponent} from "../multi-step-page/multi-step-page.component";

@Component({
  selector: 'grt-example-based-search',
  templateUrl: './example-based-search.component.html',
  styleUrls: ['./example-based-search.component.scss']
})
export class ExampleBasedSearchComponent extends MultiStepPageComponent {
    sentenceInputStep: SentenceInputStep;


    @ViewChild('sentenceInput')
    sentenceInputComponent;

    constructor() {
        super();
    }


    initializeCrumbs(){
        this.crumbs = [
            {
                name: "Example",
                number: 0,
            },
            {
                name: "Parse",
                number: 1,
            },
            {
                name: "matrix",
                number: 2,
            },
            {
                name: "Treebanks",
                number: 3,
            },
            {
                name: "Query",
                number: 4,
            },
            {
                name: "Results",
                number: 5,
            },
            {
                name: "Analysis",
                number: 6,
            },
        ];
    }

    initializeComponents(){
        console.log('initialize components');
        this.components = [
            this.sentenceInputComponent
        ]
    }

    initializeGlobalState(){
        this.sentenceInputStep = new SentenceInputStep(0);
        this.globalState = {
            selectedTreebanks: undefined,
            currentStep: this.sentenceInputStep,
            valid: false,
            xpath: '',
            loading: false
        };
    }

    initializeConfiguration(){

        this.configuration = {
            steps: [
                this.sentenceInputStep,
                new ParseStep(1)
            ]

        };
    }

    initializeTransitions(){
        this.transitions = new Transitions([new IncreaseTransition(this.configuration.steps), new DecreaseTransition(this.configuration.steps)]);
    }







}
