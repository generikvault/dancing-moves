import { ClipboardModule } from '@angular/cdk/clipboard';
import { LayoutModule } from '@angular/cdk/layout';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MarkdownModule } from 'ngx-markdown';
import { AppRoutingModuleModule } from './app-routing-module/app-routing-module.module';
import { AppComponent } from './app.component';
import { DanceCardsPageComponent } from './dance-cards-page/dance-cards-page.component';
import { MoveCardComponent } from './move-cards-page/move-card/move-card.component';
import { MoveCardsPageComponent } from './move-cards-page/move-cards-page.component';
import { MovePageComponent } from './move-page/move-page.component';
import { DanceMoveSelectionComponent } from './nav/dance-move-selection/dance-move-selection.component';
import { NavComponent } from './nav/nav.component';
import { RelationsSelectionComponent } from './nav/relations-selection/relations-selection.component';
import { RelationsPageComponent } from './relations-page/relations-page.component';
import { SettingsPageComponent } from './settings-page/settings-page.component';
import { CourseCardsPageComponent } from './course-cards-page/course-cards-page.component';
import { CoursePageComponent } from './course-page/course-page.component';
import { DancePageComponent } from './dance-page/dance-page.component';
import { HomePageComponent } from './home-page/home-page.component';
@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    MoveCardComponent,
    MoveCardsPageComponent,
    MovePageComponent,
    SettingsPageComponent,
    DanceCardsPageComponent,
    RelationsPageComponent,
    RelationsSelectionComponent,
    DanceMoveSelectionComponent,
    CourseCardsPageComponent,
    CoursePageComponent,
    DancePageComponent,
    HomePageComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    AppRoutingModuleModule,
    ReactiveFormsModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    HttpClientModule,
    ClipboardModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatChipsModule,
    MatSlideToggleModule,
    MarkdownModule.forRoot(),
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'de-DE' }],
  bootstrap: [AppComponent]
})
export class AppModule { }
