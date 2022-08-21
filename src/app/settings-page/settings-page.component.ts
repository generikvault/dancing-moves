import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Params } from '@angular/router';
import { Subscription } from 'rxjs';
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
    isDeveloper: new UntypedFormControl(false)
  });
  url!: string;
  subscriptions = new Array<Subscription>();


  constructor(private settings: SettingsService, private navService: NavService) {
    this.navService.headlineObservable.next("Settings");
  }


  async ngOnInit(): Promise<void> {
    await this.settings.loading();
    this.subscriptions.push(this.settingsForm.valueChanges.subscribe(value => {
      console.log(value);
      const queryJson = { 'secret': value.secretRead, 'secret-write': value.secretWrite, 'special-rights': value.specialRights };
      this.navService.navigate([], queryJson);
      this.url = this.createUrl(queryJson);
      localStorage.setItem('secret', value.secretRead);
      localStorage.setItem('secret-write', value.secretWrite);
      localStorage.setItem('special-rights', value.specialRights);
      localStorage.setItem('sheetId', value.sheetId);
      this.settings.isDeveloper = value.isDeveloper;
    }));
    this.settingsForm.patchValue({
      secretRead: this.settings.secretReadString,
      secretWrite: this.settings.secretWriteString,
      specialRights: this.settings.specialRightsString,
      sheetId: this.settings.sheetId
    });
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

  loginGoogle2() {
    this.settings.loginGoogle2();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
