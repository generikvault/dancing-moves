import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DataBase } from '../model/data-base';
import { ApiclientService } from '../services/apiclient.service';
import { NavService } from '../services/nav.service';
import { SettingsService } from '../services/settings.service';

@Component({
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.css']
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  settingsForm = new UntypedFormGroup({
    secretRead: new UntypedFormControl(''),
    secretWrite: new UntypedFormControl(''),
    specialRights: new UntypedFormControl(''),
    sheetId: new UntypedFormControl(''),
    dataBases: new UntypedFormArray([]),
    isDeveloper: new UntypedFormControl(false)
  });
  url!: string;
  subscriptions = new Array<Subscription>();
  isAndriod = environment.isAndroid;


  constructor(private settings: SettingsService, private navService: NavService, private apiclientService: ApiclientService) {
    this.navService.headlineObservable.next("Settings");
  }


  async ngOnInit(): Promise<void> {
    await this.settings.loading();
    this.settings.dataBases.forEach(this.addDataBaseForm);
    this.settingsForm.patchValue({
      secretRead: this.settings.secretReadString,
      secretWrite: this.settings.secretWriteString,
      specialRights: this.settings.specialRightsString,
      dataBases: this.settings.dataBases
    });
    this.subscriptions.push(this.settingsForm.valueChanges.subscribe(value => {
      console.log(value);
      const queryJson = { 'secret': value.secretRead, 'secret-write': value.secretWrite, 'special-rights': value.specialRights, 'dataBases': this.settings.dataBasesToString(value.dataBases) };
      this.url = this.createUrl(queryJson);
      localStorage.setItem('secret', value.secretRead);
      localStorage.setItem('secret-write', value.secretWrite);
      localStorage.setItem('special-rights', value.specialRights);
      localStorage.setItem('sheetId', value.sheetId);
      this.settings.isDeveloper = value.isDeveloper;
      if (environment.isAndroid) {
        this.settings.initSettings({});
      } else {
        this.navService.navigate([], queryJson);
      }
      this.settings.dataBases = value.dataBases;
    }));
  }

  private createUrl(queryJson: Params): string {
    const options = Object.entries(queryJson).filter(value => value[1]).map(value => `${value[0]}=${value[1]}`);
    if (options.length > 0) {
      return `${document.baseURI}?${options.join('&')}`
    }
    return document.baseURI
  }

  onSubmit() {

  }

  loginGoogle() {
    this.settings.loginGoogle();
  }

  getDataBases() {
    return (this.settingsForm.get('dataBases') as UntypedFormArray).controls;
  }

  createNewDataBase() {
    const dataBases = this.settingsForm.value.dataBases;
    const lastEntry = dataBases[dataBases.length - 1] as DataBase;
    if (lastEntry.title && !lastEntry.spreadsheetId) {
      this.apiclientService.createNewTable(lastEntry.title).subscribe(t => {
        this.settings.dataBases[this.settings.dataBases.length - 1].spreadsheetId = t.spreadsheetId;
        this.settingsForm.patchValue({
          dataBases: this.settings.dataBases
        });
      });
    }
  }

  isDataBaseEditState(): boolean {
    const dataBases = this.settingsForm.value.dataBases;
    const lastEntry = dataBases[dataBases.length - 1] as DataBase;
    return Boolean(lastEntry?.title) && !lastEntry?.spreadsheetId;
  }


  private createDataBaseForm = () => {
    return new UntypedFormGroup({
      title: new UntypedFormControl(''),
      spreadsheetId: new UntypedFormControl('')
    });
  }

  addDataBaseForm = () => {
    const formArray = this.settingsForm.get("dataBases") as UntypedFormArray;
    formArray.push(this.createDataBaseForm());
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
