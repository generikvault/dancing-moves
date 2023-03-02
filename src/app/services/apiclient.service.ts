import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as jwt from 'jwt-simple';
import { BehaviorSubject, catchError, filter, forkJoin, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { ApiToken } from '../model/api-token';
import { CourseDateDto } from '../model/course-date-dto';
import { CourseDto } from '../model/course-dto';
import { DanceDto } from '../model/dance-dto';
import { MoveDto } from '../model/move-dto';
import { ResponseCreate } from '../model/response-create';
import { ResponseCreateDb } from '../model/response-create-db';
import { ResponseGet } from '../model/response-get';
import { ResponseUpdate } from '../model/response-update';
import { SecretWriteDto } from '../model/secret-write-dto';
import { UserMode } from '../model/user-mode';
import { VideoDto } from '../model/video-dto';
import { apiTestData } from '../util/data';
import { delay, parseBoolean, parseDate, toGermanDate } from '../util/util';
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
    if (this.userMode === UserMode.test) {
      return of(apiTestData).pipe(map(response => this.mapRows<MoveDto>([response], this.createMoveDto)));;
    }
    return this.getAllDataBases('Moves!A1:S1000').pipe(map(response => this.mapRows<MoveDto>(response, this.createMoveDto)));
  }

  private getAllDataBases(sheetRange: string): Observable<ResponseGet[]> {
    return forkJoin(this.settingsService.dataBases.map(d => this.spreadsheetsGet(d.spreadsheetId, sheetRange
    )));
  }

  getCourseDates(): Observable<Array<CourseDateDto>> {
    return this.getAllDataBases('CourseDates!A1:C1000').pipe(map(response => this.mapRows<CourseDateDto>(response, this.createCourseDateDto)));
  }

  getCourses(): Observable<Array<CourseDto>> {
    return this.getAllDataBases(
      'Courses!A1:L1000'
    ).pipe(map(response => this.mapRows<CourseDto>(response, this.createCourseDto)));
  }

  getDances(): Observable<Array<DanceDto>> {
    return this.getAllDataBases(
      'Dances!A1:H100'
    ).pipe(map(response => this.mapRows<DanceDto>(response, this.createDanceDto)));
  }

  getVideos(): Observable<Array<VideoDto>> {
    return this.getAllDataBases(
      `CourseContents!A1:C1000`
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

  appendData(moveDto: MoveDto): Observable<ResponseCreate> {
    const sheetRange = 'Moves!A2:U2';
    const body = { values: [this.moveToLine(moveDto)] }
    return this.spreadsheetsPost(moveDto.location as string, sheetRange, body, ':append');
  }

  patchData(moveDto: MoveDto): Observable<ResponseUpdate> {
    const sheetRange = `Moves!A${moveDto.row}:U${moveDto.row}`;
    const body = { values: [this.moveToLine(moveDto)] }
    return this.spreadsheetsPut(moveDto.location as string, sheetRange, body);
  }

  appendDataCourse(courseDto: CourseDto): Observable<ResponseCreate> {
    const sheetRange = 'Courses!A2:L2';
    const body = { values: [this.courseToLine(courseDto)] }
    return this.spreadsheetsPost(courseDto.location as string, sheetRange, body, ':append');
  }

  patchDataCourse(courseDto: CourseDto): Observable<ResponseUpdate> {
    const sheetRange = `Courses!A${courseDto.row}:L${courseDto.row}`;
    const body = { values: [this.courseToLine(courseDto)] }
    return this.spreadsheetsPut(courseDto.location as string, sheetRange, body);
  }

  appendCourseDate(courseDateDto: CourseDateDto): Observable<ResponseCreate> {
    const sheetRange = 'CourseDates!A2:C2';
    const body = { values: [this.courseDateToLine(courseDateDto)] }
    return this.spreadsheetsPost(courseDateDto.location as string, sheetRange, body, ':append');
  }

  patchCourseDate(courseDateDto: CourseDateDto): Observable<ResponseUpdate> {
    const sheetRange = `CourseDates!A${courseDateDto.row}:C${courseDateDto.row}`;
    const body = { values: [this.courseDateToLine(courseDateDto)] }
    return this.spreadsheetsPut(courseDateDto.location as string, sheetRange, body);
  }

  appendCourseContent(content: VideoDto): Observable<ResponseCreate> {
    const sheetRange = `CourseContents!A2:C2`;
    const body = { values: [this.courseContentToLine(content)] }
    return this.spreadsheetsPost(content.location as string, sheetRange, body, ':append');
  }

  patchCourseContent(content: VideoDto): Observable<ResponseUpdate> {
    const sheetRange = `CourseContents!A${content.row}:C${content.row}`;
    const body = { values: [this.courseContentToLine(content)] }
    return this.spreadsheetsPut(content.location as string, sheetRange, body);
  }

  appendDance(danceDto: DanceDto): Observable<ResponseCreate> {
    const sheetRange = 'Dances!A2:F2';
    const body = { values: [this.danceToLine(danceDto)] }
    return this.spreadsheetsPost(danceDto.location as string, sheetRange, body, ':append');
  }

  patchDance(danceDto: DanceDto): Observable<ResponseUpdate> {
    const sheetRange = `Dances!A${danceDto.row}:F${danceDto.row}`;
    const body = { values: [this.danceToLine(danceDto)] }
    return this.spreadsheetsPut(danceDto.location as string, sheetRange, body);
  }

  private spreadsheetsGet(sheetId: string, sheetRange: string): Observable<ResponseGet> {
    if (this.userMode === UserMode.test) {
      return of({ range: '', majorDimension: '', values: [], spreadsheetId: sheetId } as ResponseGet);
    }
    return this.http.get<ResponseGet>(`https://content-sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURI(sheetRange)}`, { params: { key: this.settingsService.secret?.apiKey as string } })
      .pipe(
        catchError(error =>
          this.loginWrite().pipe(
            switchMap(r => this.http.get<ResponseGet>(`https://content-sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURI(sheetRange)}`, { headers: { Authorization: `Bearer ${r.access_token}` } })),
            catchError(error => of({ range: '', majorDimension: '', values: [], spreadsheetId: sheetId } as ResponseGet)))),
        tap(r => r.spreadsheetId = sheetId));
  }

  private spreadsheetsPost(sheetId: string, sheetRange: string, body: any, type = ''): Observable<ResponseCreate> {
    if (this.userMode !== UserMode.write || !this.settingsService.isSheetValid(sheetId)) {
      return of({ updates: { updatedRange: 'T!A42:S42' } } as ResponseCreate);
    }
    const localAppendNummer = this.appendNumber++;
    return this.appendPossible.pipe(filter(p => p && localAppendNummer == this.appendNumberDue), take(1), switchMap(p => this.loginWrite()), switchMap(r => {
      this.appendPossible.next(false);
      return this.http.post<ResponseCreate>(`https://content-sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURI(sheetRange)}${type}`, body, { headers: { Authorization: `Bearer ${r.access_token}` }, params: { valueInputOption: 'USER_ENTERED' } }).pipe(tap(r => {
        this.appendNumberDue++;
        this.appendPossible.next(true);
      }))
    }));
  }

  private spreadsheetsPut(sheetId: string, sheetRange: string, body: any, type = ''): Observable<ResponseUpdate> {
    if (this.userMode !== UserMode.write || !this.settingsService.isSheetValid(sheetId)) {
      return of({} as ResponseUpdate);
    }
    const localPutNummer = this.putNumber++;
    const doWait = localPutNummer !== 0 && (localPutNummer % 250) === 0;
    return this.putPossible.pipe(filter(p => p && localPutNummer == this.putNumberDue), take(1), switchMap(p => this.loginWrite()), switchMap(r => {
      return this.http.put<ResponseUpdate>(`https://content-sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURI(sheetRange)}${type}`, body, { headers: { Authorization: `Bearer ${r.access_token}` }, params: { valueInputOption: 'USER_ENTERED' } }).pipe(tap(async (r) => {
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
    return this.loginWrite().pipe(switchMap(r =>
      this.http.post<ResponseCreateDb>(`https://content-sheets.googleapis.com/v4/spreadsheets`, body, { headers: { Authorization: `Bearer ${r.access_token}` } })
    ))
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
      row: i + 1
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
      videos: []
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
      row: i + 1
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
      row: i + 1
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
      row: i + 1
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


  private moveToLine(moveDto: MoveDto): string[] {
    return [moveDto.name, moveDto.dance, moveDto.description, moveDto.descriptionEng,
    String(moveDto.order), moveDto.count, String(moveDto.nameVerified),
    moveDto.type, moveDto.startMove?.join(","), moveDto.endMove?.join(","), moveDto.containedMoves?.join(","), moveDto.relatedMoves?.join(","), moveDto.relatedMovesOtherDances?.join(","),
    moveDto.videoname?.join(','), moveDto.media, moveDto.links, moveDto.toDo, moveDto.id]
  }

  private courseDateToLine(courseDateDto: CourseDateDto): string[] {
    return [toGermanDate(courseDateDto.date), courseDateDto.course, courseDateDto.moveId, courseDateDto.description]
  }

  private courseToLine(courseDto: CourseDto): string[] {
    return [courseDto.name, courseDto.dances?.join(","), courseDto.school, courseDto.description, courseDto.teacher, courseDto.level, toGermanDate(courseDto.start), toGermanDate(courseDto.end), courseDto.time, courseDto.groupName, courseDto.hash, courseDto.salt]
  }

  private courseContentToLine(courseDataDto: VideoDto): string[] {
    return [courseDataDto.name, courseDataDto.linkEncripted, courseDataDto.courseName]
  }

  private danceToLine(danceDto: DanceDto): string[] {
    return [danceDto.name, danceDto.type, danceDto.music, danceDto.rhythm, danceDto.description, danceDto.links]
  }
}
