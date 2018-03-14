import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';


import {AppComponent} from './app.component';
import {ParseSentenceComponent} from './components/parse-sentence/parse-sentence.component';
import {AlpinoService} from "./services/alpino.service";
import {HttpClientModule} from "@angular/common/http";
import {HomePageComponent} from './pages/home-page/home-page.component';
import {HeaderComponent} from './components/header/header.component';
import {NavigationComponent} from './components/header/navigation/navigation.component';
import {BodyHeaderComponent} from './components/body-header/body-header.component';
import {FooterComponent} from './components/footer/footer.component';
import {HomeContentComponent} from './pages/home-page/home-content/home-content.component';
import {AdressComponent} from './components/adress/adress.component';
import {PaperCiteComponent} from './components/paper-cite/paper-cite.component';
import {AppRoutingModule} from "./app-routing/app-routing.module";
import {DocumentationComponent} from './pages/documentation/documentation.component';
import { GretelWebsiteLinkComponent } from './components/gretel-website-link/gretel-website-link.component';
import { DocumentationContentComponent } from './pages/documentation/documentation-content/documentation-content.component';
import { FooterNavigationComponent } from './components/footer/footer-navigation/footer-navigation.component';
import { XpathSearchComponent } from './pages/xpath-search/xpath-search.component';
import { Header3Component } from './components/header-3/header-3.component';
import { XpathEditorComponent } from './components/xpath-editor/xpath-editor.component';
import { StepsNavigatorComponent } from './components/steps-navigator/steps-navigator.component';
import {XpathSearchService} from "./xpath-search.service";
import {LinkService} from "./services/link.service";
import { StepComponent } from './components/step/step.component';
import { XpathInputComponent } from './components/step/xpath-input/xpath-input.component';
import { BreadcrumbBarComponent } from './components/breadcrumb-bar/breadcrumb-bar.component';

@NgModule({
  declarations: [
    AppComponent,
    ParseSentenceComponent,
    HomePageComponent,
    HeaderComponent,
    NavigationComponent,
    BodyHeaderComponent,
    FooterComponent,
    HomeContentComponent,
    AdressComponent,
    PaperCiteComponent,
    DocumentationComponent,
    GretelWebsiteLinkComponent,
    DocumentationContentComponent,
    FooterNavigationComponent,
    XpathSearchComponent,
    Header3Component,
    XpathEditorComponent,
    StepsNavigatorComponent,
    StepComponent,
    XpathInputComponent,
    BreadcrumbBarComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,

  ],
  providers: [
    AlpinoService,
    XpathSearchService,
    LinkService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
