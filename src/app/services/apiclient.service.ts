import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as jwt from 'jwt-simple';
import { BehaviorSubject, catchError, defaultIfEmpty, filter, forkJoin, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { ApiToken } from '../model/api-token';
import { CourseDateDto } from '../model/course-date-dto';
import { CourseDto } from '../model/course-dto';
import { DanceDto } from '../model/dance-dto';
import { DtoBase } from '../model/dto-base';
import { MoveDto } from '../model/move-dto';
import { ResponseCreate } from '../model/response-create';
import { ResponseCreateDb } from '../model/response-create-db';
import { ResponseDelete } from '../model/response-delete';
import { ResponseGet } from '../model/response-get';
import { ResponseUpdate } from '../model/response-update';
import { SecretWriteDto } from '../model/secret-write-dto';
import { UserMode } from '../model/user-mode';
import { VideoDto } from '../model/video-dto';
import { delay, dtoType, parseBoolean, parseDate, toGermanDate } from '../util/util';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class ApiclientService {
  private lastUpdated!: number;
  private writeToken!: ApiToken;
  private userMode!: UserMode;
  private appendPossible = new BehaviorSubject(true);
  private appendNumber = 0;
  private appendNumberDue = 0;
  private putPossible = new BehaviorSubject(true);
  private putNumber = 0;
  private putNumberDue = 0;
  private sheetTemplates = [
    { name: "Dances", values: ["Name", "Typ", "Musik", "Takt", "Beschreibung", "Links"] },
    { name: "CourseDates", values: ["Lerndatum", "Coursename", "Tanzfiguren", "Beschreibung"] },
    { name: "CourseContents", values: ["Name", "Link", "Coursename"] },
    { name: "Courses", values: ["Coursename", "Dances", "School", "Description", "Teacher", "Level", "Start", "End", "Uhrzeit", "Groupname", "hash", "salt"] },
    { name: "Moves", values: ["Name", "Tanz", "Beschreibung", "Description Eng", "Lernreihenfolge", "Count", "Name gesichert", "Typ", "Eingang", "Ausgang", "Enthält", "Ähnliche Tanzfiguren", "In anderen Tänzen", "Videoname", "Media", "Links", "ToDo", "id", "Benutzer"] },
  ]

  constructor(private settingsService: SettingsService, private http: HttpClient) {
    this.settingsService.userMode.subscribe(userMode => this.userMode = userMode);
  }

  getMoves(): Observable<Array<MoveDto>> {
    return this.getAllDataBases('Moves!A1:S10000').pipe(map(response => this.mapRows<MoveDto>(response, this.createMoveDto)));
  }

  private getAllDataBases(sheetRange: string): Observable<ResponseGet[]> {
    return forkJoin(this.settingsService.dataBases.map(d => this.spreadsheetsGet(d.spreadsheetId, sheetRange
    ))).pipe(defaultIfEmpty([]));
  }

  getCourseDates(): Observable<Array<CourseDateDto>> {
    return this.getAllDataBases('CourseDates!A1:D10000').pipe(map(response => this.mapRows<CourseDateDto>(response, this.createCourseDateDto)));
  }

  getCourses(): Observable<Array<CourseDto>> {
    return this.getAllDataBases(
      'Courses!A1:L10000'
    ).pipe(map(response => this.mapRows<CourseDto>(response, this.createCourseDto)));
  }

  getDances(): Observable<Array<DanceDto>> {
    return this.getAllDataBases(
      'Dances!A1:H200'
    ).pipe(map(response => this.mapRows<DanceDto>(response, this.createDanceDto)));
  }

  getVideos(): Observable<Array<VideoDto>> {
    return this.getAllDataBases(
      `CourseContents!A1:C10000`
    ).pipe(map(response => this.mapRows<VideoDto>(response, this.createVideoDto)));
  }

  createNewTable(tableName = "Test"): Observable<ResponseCreateDb> {
    const body = {
      "properties": {
        "title": "Dancing Moves " + tableName
      }, "sheets": this.sheetTemplates.map(s => {
        return {
          "properties": {
            "title": s.name
          },
          "data": [
            {
              "startRow": 0,
              "startColumn": 0,
              "rowData": [
                {
                  "values": s.values.map(v => {
                    return {
                      "userEnteredValue":
                      {
                        "stringValue": v
                      }
                    }
                  })
                }]
            }]
        }
      })
    }
    return this.spreadsheetsCreateDb(body);
  }


  private mapRows<T>(responses: ResponseGet[], mapfunc: (row: string[], i: number, sheetId: string) => T): Array<T> {
    const result = new Array<T>();
    for (const response of responses) {
      const values = response?.values;
      if (values?.length > 0) {
        for (let i = 1; i < values.length; i++) {
          var row = values[i];
          if (row[0] || row[1]) {
            result.push(mapfunc(row, i, response.spreadsheetId));
          }
        }
      }
    }

    return result;
  }

  appendData(dto: DtoBase): Observable<ResponseCreate> {
    const sheetRange = this.createRange(dto.dtoType);
    const body = { values: [this.toLine(dto)] }
    return this.spreadsheetsPost(dto.location as string, sheetRange, body, ':append');
  }

  patchData(dto: DtoBase): Observable<ResponseUpdate> {
    const sheetRange = this.createRange(dto.dtoType, dto.row)
    const body = { values: [this.toLine(dto)] }
    return this.spreadsheetsPut(dto.location as string, sheetRange, body);
  }

  deleteData(dto: DtoBase): Observable<ResponseDelete> {
    return this.spreadsheetsDelete(dto.location as string, this.createRange(dto.dtoType, dto.row));
  }

  private createRange(type: dtoType, row: number = 2): string {
    switch (type) {
      case 'Dances':
        return `Dances!A${row}:F${row}`;
      case 'Moves':
        return `Moves!A${row}:U${row}`;
      case 'Courses':
        return `Courses!A${row}:L${row}`;
      case 'CourseDates':
        return `CourseDates!A${row}:D${row}`;
      case 'CourseContents':
        return `CourseContents!A${row}:C${row}`;
      default:
        return `${type}!A${row}:C${row}`;
    }
  }

  private toLine(dto: DtoBase): string[] {
    switch (dto.dtoType) {
      case 'Dances':
        return this.danceToLine(dto as DanceDto);
      case 'Moves':
        return this.moveToLine(dto as MoveDto);
      case 'Courses':
        return this.courseToLine(dto as CourseDto);
      case 'CourseDates':
        return this.courseDateToLine(dto as CourseDateDto);
      case 'CourseContents':
        return this.courseContentToLine(dto as VideoDto);
      default:
        return [];
    }
  }

  private spreadsheetsGet(sheetId: string, sheetRange: string): Observable<ResponseGet> {
    if (this.settingsService.secret?.apiKey) {
      return this.http.get<ResponseGet>(this.buildUrl(sheetId, sheetRange), { params: { key: this.settingsService.secret?.apiKey as string } })
        .pipe(
          catchError(error =>
            this.loginHeader().pipe(
              switchMap(headers => this.http.get<ResponseGet>(this.buildUrl(sheetId, sheetRange), { headers })),
              catchError(error => of({ range: '', majorDimension: '', values: [], spreadsheetId: sheetId } as ResponseGet)))),
          tap(r => r.spreadsheetId = sheetId));
    }
    return this.loginHeader().pipe(
      switchMap(headers => this.http.get<ResponseGet>(this.buildUrl(sheetId, sheetRange), { headers })),
      catchError(error => of({ range: '', majorDimension: '', values: [], spreadsheetId: sheetId } as ResponseGet)),
      tap(r => r.spreadsheetId = sheetId));
  }

  private spreadsheetsPost(sheetId: string, sheetRange: string, body: any, type = ''): Observable<ResponseCreate> {
    if (this.userMode !== UserMode.write || !this.settingsService.isSheetValid(sheetId)) {
      return of({ updates: { updatedRange: 'T!A42:S42' } } as ResponseCreate);
    }
    const localAppendNummer = this.appendNumber++;
    return this.appendPossible.pipe(filter(p => p && localAppendNummer == this.appendNumberDue), take(1), switchMap(p => this.loginHeader()), switchMap(headers => {
      this.appendPossible.next(false);
      return this.http.post<ResponseCreate>(this.buildUrl(sheetId, sheetRange, type), body, { headers, params: { valueInputOption: 'USER_ENTERED' } }).pipe(tap(r => {
        this.appendNumberDue++;
        this.appendPossible.next(true);
      }))
    }));
  }

  private buildUrl(sheetId: string, sheetRange: string, type: string = ''): string {
    return `https://content-sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURI(sheetRange)}${type}`;
  }

  private spreadsheetsDelete(sheetId: string, sheetRange: string, type = ':clear'): Observable<ResponseDelete> {
    if (this.userMode !== UserMode.write || !this.settingsService.isSheetValid(sheetId)) {
      return of({} as ResponseDelete);
    }
    return this.loginHeader().pipe(
      switchMap(headers => this.http.post<ResponseDelete>(this.buildUrl(sheetId, sheetRange, type), null, { headers })))
  }

  private spreadsheetsPut(sheetId: string, sheetRange: string, body: any, type = ''): Observable<ResponseUpdate> {
    if (this.userMode !== UserMode.write || !this.settingsService.isSheetValid(sheetId)) {
      return of({} as ResponseUpdate);
    }
    const localPutNummer = this.putNumber++;
    const doWait = localPutNummer !== 0 && (localPutNummer % 250) === 0;
    return this.putPossible.pipe(filter(p => p && localPutNummer == this.putNumberDue), take(1), switchMap(p => this.loginHeader()), switchMap(headers => {
      return this.http.put<ResponseUpdate>(this.buildUrl(sheetId, sheetRange, type), body, { headers, params: { valueInputOption: 'USER_ENTERED' } }).pipe(tap(async (r) => {
        if (doWait) {
          console.log('wait a minute', localPutNummer);
          this.putPossible.next(false);
          await delay(60000);
        }
        this.putNumberDue++;
        this.putPossible.next(true);
      }))
    }));
  }

  private spreadsheetsCreateDb(body: any): Observable<ResponseCreateDb> {
    if (this.userMode !== UserMode.write) {
      return of({} as ResponseCreateDb);
    }
    return this.loginHeader().pipe(switchMap(headers =>
      this.http.post<ResponseCreateDb>(`https://content-sheets.googleapis.com/v4/spreadsheets`, body, { headers })
    ))
  }

  private loginHeader(): Observable<any> {
    return this.loginWrite().pipe(map(r => { return { Authorization: `Bearer ${r.access_token}` } }));
  }

  private loginWrite(): Observable<ApiToken> {
    if (this.settingsService.userAccessToken?.access_token) {
      this.writeToken = this.settingsService.userAccessToken;
      if (!this.lastUpdated) {
        this.lastUpdated = this.nowInSec();
      }
    }
    if (!this.settingsService.secretWrite && !this.settingsService.userAccessToken?.access_token) {
      return of({} as ApiToken);
    }
    if (this.writeToken && this.lastUpdated && (this.nowInSec() - this.lastUpdated) < (this.writeToken.expires_in - 100)) {
      return of(this.writeToken);
    }
    let token;
    this.lastUpdated = this.nowInSec();
    if (token = this.settingsService.secretWrite) {
      token = this.createJwt();
      console.log(token);
      return this.http.post<ApiToken>('https://oauth2.googleapis.com/token', { grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: token }).pipe(tap(r => this.writeToken = r));
    } else if (this.settingsService.userAccessToken?.access_token) {
      this.settingsService.updateLoginGoogle();
      return of(this.writeToken);
    }
    return of({} as ApiToken);
  }

  private nowInSec(): number {
    return Date.now() / 1000;
  }

  private createJwt() {
    const secretWrite = this.settingsService.secretWrite as SecretWriteDto;
    const iat = Date.now() / 1000;
    const token = jwt.encode({
      'iss': secretWrite.client_email,
      'sub': secretWrite.client_email,
      'scope': 'https://www.googleapis.com/auth/spreadsheets',
      'aud': secretWrite.token_uri,
      'iat': iat,
      'exp': iat + 3600
    }, secretWrite.private_key, 'RS256', { header: { kid: secretWrite.private_key_id } });
    return token;
  }

  private createCourseDateDto = (row: any, i: number, spreadsheetId: string): CourseDateDto => {
    return {
      date: parseDate(row[0]),
      course: row[1],
      moveId: row[2],
      description: row[3],
      location: spreadsheetId,
      row: i + 1,
      dtoType: 'CourseDates'
    };
  }


  private createMoveDto = (row: any, i: number, spreadsheetId: string): MoveDto => {
    return {
      name: row[0],
      dance: row[1],
      description: row[2],
      descriptionEng: row[3],
      order: Number(row[4]),
      count: row[5],
      nameVerified: parseBoolean(row[6]),
      type: row[7],
      startMove: this.stringToArray(row[8]),
      endMove: this.stringToArray(row[9]),
      containedMoves: this.stringToArray(row[10]),
      relatedMoves: this.stringToArray(row[11]),
      relatedMovesOtherDances: this.stringToArray(row[12]),
      videoname: row[13]?.split(',').flatMap((v: string) => v.split('\n')).filter((v: string) => v),
      media: row[14],
      links: row[15],
      toDo: row[16],
      id: row[17],
      row: i + 1,
      courseDates: [],
      location: spreadsheetId,
      videos: [],
      dtoType: 'Moves'
    };
  }

  private createCourseDto = (row: any, i: number, spreadsheetId: string): CourseDto => {
    return {
      name: row[0],
      dances: this.stringToArray(row[1]),
      school: row[2],
      description: row[3],
      teacher: row[4],
      level: row[5],
      start: parseDate(row[6]),
      end: parseDate(row[7]),
      time: row[8],
      groupName: row[9],
      hash: row[10],
      salt: row[11],
      contents: [],
      location: spreadsheetId,
      row: i + 1,
      dtoType: 'Courses'
    };
  }

  private createDanceDto = (row: any, i: number, spreadsheetId: string): DanceDto => {
    return {
      name: row[0],
      type: row[1],
      music: row[2],
      rhythm: row[3],
      description: row[4],
      links: row[5],
      location: spreadsheetId,
      row: i + 1,
      dtoType: 'Dances'
    };
  }

  private createVideoDto = (row: any, i: number, spreadsheetId: string): VideoDto => {
    return {
      name: row[0],
      link: row[1],
      linkEncripted: row[1],
      courseName: row[2],
      changed: false,
      location: spreadsheetId,
      row: i + 1,
      dtoType: 'CourseContents'
    };
  }

  private stringToArray(str: string) {
    str = str?.trim();
    if (str) {
      return Array.from(new Set(str.split(",").map((e: string) => e.trim()).filter(e => Boolean(e))).values());
    } else {
      return []
    }
  }


  private moveToLine(dto: MoveDto): string[] {
    return [dto.name, dto.dance, dto.description, dto.descriptionEng,
    String(dto.order), dto.count, String(dto.nameVerified),
    dto.type, dto.startMove?.join(","), dto.endMove?.join(","), dto.containedMoves?.join(","), dto.relatedMoves?.join(","), dto.relatedMovesOtherDances?.join(","),
    dto.videoname?.join(','), dto.media, dto.links, dto.toDo, dto.id]
  }

  private courseDateToLine(dto: CourseDateDto): string[] {
    return [toGermanDate(dto.date), dto.course, dto.moveId, dto.description]
  }

  private courseToLine(dto: CourseDto): string[] {
    return [dto.name, dto.dances?.join(","), dto.school, dto.description, dto.teacher, dto.level, toGermanDate(dto.start), toGermanDate(dto.end), dto.time, dto.groupName, dto.hash, dto.salt]
  }

  private courseContentToLine(dto: VideoDto): string[] {
    return [dto.name, dto.linkEncripted, dto.courseName]
  }

  private danceToLine(dto: DanceDto): string[] {
    return [dto.name, dto.type, dto.music, dto.rhythm, dto.description, dto.links]
  }
}
