import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params } from '@angular/router';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import CryptoES from 'crypto-es';
import { BehaviorSubject, firstValueFrom, forkJoin, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiToken } from '../model/api-token';
import { CourseDto } from '../model/course-dto';
import { DataBase } from '../model/data-base';
import { SecretDto } from '../model/secret-dto';
import { SecretWriteDto } from '../model/secret-write-dto';
import { UserMode } from '../model/user-mode';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  secret: SecretDto | undefined;
  secretWrite: SecretWriteDto | undefined;
  secretReadString!: string;
  secretWriteString!: string;
  isStarted = false;
  isStarting = new Subject<boolean>();
  userMode = new BehaviorSubject<UserMode>(UserMode.read);
  specialRightsString!: string;
  specialRightPasswords!: Array<string>;
  passwordPerCourse = new Map<string, string>();
  sheetNames = new Set<string>();
  userAccessToken!: ApiToken;
  dataBases: Array<DataBase> = [];
  private client: any;
  isDeveloper: boolean = false;

  constructor(private route: ActivatedRoute, private http: HttpClient, private snackBar: MatSnackBar) { }

  fetchSettings() {
    this.route.queryParams.subscribe(params => {
      this.initSettings(params);
    })
  }

  async loading() {
    if (!this.isStarted) {
      await firstValueFrom(this.isStarting);
    }
  }

  initSettings(params: Params) {
    this.secretReadString = this.getSetting(params, 'secret');
    this.secretWriteString = this.getSetting(params, 'secret-write');
    this.userAccessToken = JSON.parse(localStorage.getItem('google-access') ?? '{}');
    this.dataBases = this.stringToDataBases(this.getArraySetting(params, 'dataBases'));
    console.log('init', this.dataBases);

    forkJoin({ read: this.getFile('secret-read.txt'), write: this.getFile('secret-write.txt') }).subscribe(data => {
      this.secret = this.decrypt(data.read, this.secretReadString);
      this.secretWrite = this.decrypt(data.write, this.secretWriteString);
      if (this.secret && this.dataBases.length == 0) {
        this.dataBases.push({ title: 'main', spreadsheetId: this.secret.movesSheetId });
        console.log('main', this.dataBases);
      }
      if (this.secretWrite || this.userAccessToken?.access_token) {
        this.userMode.next(UserMode.write)
      } else {
        this.userMode.next(UserMode.read)
      }
      this.specialRightsString = this.getArraySetting(params, 'special-rights');
      this.specialRightPasswords = this.specialRightsString?.split(",")
      this.isStarting.next(false);
      this.isStarted = true;
    });;

  }

  public initCourses(courses: CourseDto[]) {
    for (const course of courses) {
      for (const pwd of this.specialRightPasswords) {
        const hash = this.hashCourse(course, pwd);
        if (hash === course.hash) {
          this.passwordPerCourse.set(course.name, pwd);
          this.sheetNames.add(course.groupName);
        }
      }
      this.decrpytCourse(course);
    }
  }

  public decrpytCourse(course: CourseDto) {
    if (!this.hasAccessToCourse(course)) {
      course.contents = [];
      return;
    }
    const password = this.passwordPerCourse.get(course.name);
    for (const content of course.contents) {
      try {
        const decrypted = CryptoES.AES.decrypt(content.linkEncripted, password);
        const decryptedString = decrypted.toString(CryptoES.enc.Utf8);
        if (decryptedString) {
          content.link = decryptedString;
        } else {
          content.link = content.linkEncripted;
          console.log("no content", content, password, decryptedString);
        }
      } catch (e) {
        console.log('incorrect password', content, password, e);
        return;
      }
    }
  }

  public encrpytCourse(course: CourseDto) {
    if (!this.hasAccessToCourse(course)) {
      return;
    }
    const password = this.passwordPerCourse.get(course.name);
    for (const content of course.contents) {
      if (password) {
        try {
          const encrypted = CryptoES.AES.encrypt(content.link, password);
          const encryptedString = encrypted.toString();
          content.linkEncripted = encryptedString;
        } catch (e) {
          console.log('incorrect password', content, password, e);
          return;
        }
      } else {
        content.linkEncripted = content.link
      }
    }
  }

  public hasAccessToCourse(course?: CourseDto): boolean {
    if (!course?.hash || !course?.salt) {
      return true;
    }
    return this.passwordPerCourse.has(course.name);
  }

  public hashCourse(course: CourseDto, password: string): string {
    return CryptoES.SHA256(course?.salt + password).toString();
  }

  private getFile(filename: string) {
    return this.http.get<string>(`assets/${filename}`, { responseType: 'text' as 'json' });
  }

  private decrypt(data: string, key: string): any {
    if (!key) {
      return undefined;
    }
    try {
      const decrypted = CryptoES.AES.decrypt(data, key);
      const decryptedString = decrypted.toString(CryptoES.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (e) {
      console.log('incorrect secret', key, e);
      return undefined;
    }
  }

  encrypt(data: string, key: string) {
    const encrypted = CryptoES.AES.encrypt(data, key);
    const encryptedString = encrypted.toString();
    console.log(encryptedString);
  }

  hash = (key: string) => {
    const hash = CryptoES.SHA256(key).toString();
    return hash;
  }

  private getSetting(params: Params, key: string): string {
    if (params[key]) {
      const value = params[key];
      localStorage.setItem(key, value);
      return value;
    }
    return localStorage.getItem(key) ?? '';
  }

  private getArraySetting(params: Params, key: string): string {
    const localEntries = (localStorage.getItem(key) ?? '').split(',');
    const queryEntries = (params[key] ?? '').split(',');
    const mergedString = Array.from(new Set([...localEntries, ...queryEntries].filter(e => e))).join(',');
    localStorage.setItem(key, mergedString);
    return mergedString;
  }


  handleCredentialResponse = (response: ApiToken) => {
    if (response.access_token) {
      this.userAccessToken = response;
      localStorage.setItem('google-access', JSON.stringify(this.userAccessToken));
      this.userMode.next(UserMode.write);
    }
  }

  initClient() {
    // @ts-ignore
    this.client = google.accounts.oauth2.initTokenClient({
      client_id: environment.clientId,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      callback: this.handleCredentialResponse
    });
  }

  async loginGoogle(prompt = '') {
    if (environment.isAndroid) {
      GoogleAuth.initialize({
        clientId: '899905894399-1ifjke5s5a8dq80knqjcrivs4rpq619b.apps.googleusercontent.com',
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      try {
        let googleUser = await GoogleAuth.signIn();
        this.log('res1', googleUser);
        this.handleCredentialResponse({ access_token: googleUser?.authentication?.accessToken, refreshToken: googleUser?.authentication?.refreshToken, expires_in: 10000, token_type: '' });
      } catch (err) {
        this.log('error2', err);
      }
    } else {
      if (!this.client) {
        this.initClient();
      }
      this.client?.requestAccessToken();
    }

  }

  updateLoginGoogle() {
    this.loginGoogle('none');
  }

  log(msg: string, content: any) {
    if (this.isDeveloper) {
      this.snackBar.open(`${msg}: ${JSON.stringify(content)}`, 'OK');
      console.log(msg, content)
    }
  }

  private dataBaseToString = (dataBase: DataBase): string => {
    return dataBase.title + "|" + dataBase.spreadsheetId;
  }

  private stringToDataBase = (dataBaseString: string): DataBase => {
    return { title: dataBaseString.split('|')[0], spreadsheetId: dataBaseString.split('|')[1] };
  }

  dataBasesToString = (dataBases: DataBase[]): string => {
    return dataBases.filter(d => d.title && d.spreadsheetId).map(this.dataBaseToString).join(',');
  }

  private stringToDataBases = (dataBasesString: string): DataBase[] => {
    if (!dataBasesString) {
      return [];
    }
    return dataBasesString.split(',').map(this.stringToDataBase);
  }
  isSheetValid(sheetId: string): boolean {
    return this.dataBases.map(d => d.spreadsheetId).includes(sheetId)
  }

  mapTitleToSheetId(title: string): string {
    if (!title && this.dataBases.length > 0) {
      return this.dataBases[0].spreadsheetId;
    }
    return this.dataBases.find(d => d.title == title)?.spreadsheetId ?? 'local';
  }

  mapSheetIdToTitle(spreadsheetId: string): string {
    if (!spreadsheetId && this.dataBases.length > 0) {
      return this.dataBases[0].title;
    }
    return this.dataBases.find(d => d.spreadsheetId == spreadsheetId)?.title ?? 'local';
  }
}
