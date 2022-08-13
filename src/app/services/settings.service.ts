import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import CryptoES from 'crypto-es';
import { BehaviorSubject, firstValueFrom, forkJoin, Subject } from 'rxjs';
import { ApiToken } from '../model/api-token';
import { CourseDto } from '../model/course-dto';
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
  userMode = new BehaviorSubject<UserMode>(UserMode.test);
  specialRightsString!: string;
  specialRightPasswords!: Array<string>;
  passwordPerCourse = new Map<string, string>();
  sheetNames = new Set<string>();
  userAccessToken!: ApiToken;
  sheetId!: string;
  private client: any;

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  fetchSettings() {
    this.route.queryParams.subscribe(params => {
      this.initSettings(params);
    })
  }

  async loading() {
    if (!this.isStarted) {
      this.initClient();
      await firstValueFrom(this.isStarting);
    }
  }

  initSettings(params: Params) {
    this.secretReadString = this.getSetting(params, 'secret');
    this.secretWriteString = this.getSetting(params, 'secret-write');
    this.userAccessToken = JSON.parse(localStorage.getItem('google-access') ?? '{}');
    this.sheetId = this.getSetting(params, 'sheetId');

    forkJoin({ read: this.getFile('secret-read.txt'), write: this.getFile('secret-write.txt') }).subscribe(data => {
      this.secret = this.decrypt(data.read, this.secretReadString);
      this.secretWrite = this.decrypt(data.write, this.secretWriteString);
      if (this.secret && !this.sheetId) {
        this.sheetId = this.secret.movesSheetId;
      }
      if (this.secret && (this.secretWrite || this.userAccessToken?.access_token)) {
        this.userMode.next(UserMode.write)
      } else if (this.secret) {
        this.userMode.next(UserMode.read)
      } else {
        this.userMode.next(UserMode.test)
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
      try {
        const encrypted = CryptoES.AES.encrypt(content.link, password);
        const encryptedString = encrypted.toString();
        content.linkEncripted = encryptedString;
      } catch (e) {
        console.log('incorrect password', content, password, e);
        return;
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
      client_id: "899905894399-7au62afsvq8l1hqcu5mjh6hbll44vr7t.apps.googleusercontent.com",
      scope: "https://www.googleapis.com/auth/spreadsheets",
      callback: this.handleCredentialResponse
    });
  }
  loginGoogle() {
    // @ts-ignore
    this.client.requestAccessToken();
  }
  updateLoginGoogle() {
    // @ts-ignore
    this.client.requestAccessToken({ prompt: 'none' });
  }
}
