import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, firstValueFrom, forkJoin, Observable, of } from 'rxjs';
import { defaultIfEmpty, filter, map, switchMap, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { Connection } from '../model/connection';
import { CourseDateDto } from '../model/course-date-dto';
import { CourseDto } from '../model/course-dto';
import { DanceDto } from '../model/dance-dto';
import { DtoBase } from '../model/dto-base';
import { MoveDto } from '../model/move-dto';
import { MoveGroupDto } from '../model/move-group-dto';
import { RelationParams } from '../model/relation-params';
import { RelationType } from '../model/relation-type-enum';
import { SearchDto } from '../model/search-dto';
import { UserMode } from '../model/user-mode';
import { VideoDto } from '../model/video-dto';
import { convertToEmbed, deepCopy, delay, escapeRegExp, generateSortFn, getRow, olderThanADay } from '../util/util';
import { ApiclientService } from './apiclient.service';
import { NavService } from './nav.service';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class DataManagerService {

  private movesSubject = new BehaviorSubject<MoveDto[]>(new Array<MoveDto>());
  movesObservable = this.movesSubject.asObservable();
  searchFilterObservable = new BehaviorSubject<SearchDto>({} as SearchDto);
  relationsSelectionObservable = new BehaviorSubject<RelationParams>({} as RelationParams);
  dances!: Array<DanceDto>;
  moves!: Array<MoveDto>;
  courses!: Array<CourseDto>;
  isStarting = new BehaviorSubject<boolean>(true);
  private userMode!: UserMode;
  movesLenghtSorted!: MoveDto[];
  coursesLenghtSorted!: CourseDto[];

  movesNames = new Set<string>();
  danceNames = new Set<string>();
  types = new Array<string>();
  toDos = new Array<string>();

  constructor(private apiclientService: ApiclientService, private snackBar: MatSnackBar, private route: ActivatedRoute, private navService: NavService, private settingsService: SettingsService) {
    this.route.queryParams.subscribe((params: any) => {
      this.searchFilterObservable.next({ dance: params['dance'], move: params['move'], courses: this.readArrayParam(params, 'courses'), notcourse: params['notcourse'], type: params['type'], related: params['related'], todo: params['todo'], script: params['script'], sort: this.readArrayParam(params, 'sort') });
      this.relationsSelectionObservable.next({ relationTypes: this.readArrayParam(params, "relationTypes"), displayType: params["displayType"]?.trim() });
    });

    this.settingsService.userMode.subscribe(userMode => this.userMode = userMode);
    this.movesObservable.subscribe(moves => {
      this.movesNames = new Set(moves.map(move => move.name));
      this.danceNames = new Set(moves.map(move => move.dance));
      this.types = Array.from(new Set(moves.map(move => move.type)));
      this.toDos = Array.from(new Set(moves.map(move => move.toDo).filter(toDo => toDo)));
    });
  }


  private readArrayParam(params: any, key: string, defaultValue: string[] = []): Array<string> {
    if (!params[key]) {
      return defaultValue
    } else if (typeof params[key] === 'string') {
      return [params[key]];
    }
    return params[key];
  }

  async start() {
    await this.settingsService.loading();
    this.local_get();
    let date = new Date(localStorage.getItem("date") ?? "2022-03-04");
    if (!date || isNaN(date.getTime())) {
      date = new Date("2022-03-04");
    }
    if (this.settingsService.isDeveloper) {
      if (this.moves.length == 0 || this.dances.length == 0 || this.courses.length == 0) {
        this.settingsService.log(`no local data`, date);
      }
      if (olderThanADay(date)) {
        this.settingsService.log(`to old date`, date);
      }
    }

    if (this.moves.length == 0 || this.dances.length == 0 || this.courses.length == 0 || olderThanADay(date)) {
      this.api_get();
    }
  }

  api_get() {
    this.isStarting.next(true);
    forkJoin({ moves: this.apiclientService.getMoves(), courseDates: this.apiclientService.getCourseDates(), dances: this.apiclientService.getDances(), videos: this.apiclientService.getVideos(), courses: this.apiclientService.getCourses() }).subscribe({
      next: results => {
        if (results.moves.length > 0) {
          this.addLocal(results);
          this.setDances(results.dances);
          for (const course of results.courses) {
            course.contents = results.videos.filter(content => course.name == content.courseName).sort(generateSortFn([c => c.name]));
          }
          this.settingsService.initCourses(results.courses);
          this.setCourses(results.courses);
          for (const move of results.moves) {
            move.courseDates = results.courseDates.filter(c => c.moveId == move.name || c.moveId == move.id).sort(generateSortFn([c => c.date]));
          }
          this.setMoves(results.moves);
        }
        localStorage.setItem("date", new Date().toISOString());
        this.isStarting.next(false);
      }, error: err => {
        this.logError(err);
        this.isStarting.next(false)
      }
    })
  }

  private addLocal(results: {
    moves: MoveDto[];
    courseDates: CourseDateDto[];
    dances: DanceDto[];
    videos: VideoDto[];
    courses: CourseDto[];
  }) {
    results.moves = [...results.moves, ... this.moves.filter(d => d.location == 'local')];
    results.dances = [...results.dances, ... this.dances.filter(d => d.location == 'local')];
    results.courses = [...results.courses, ... this.courses.filter(d => d.location == 'local')];
  }

  private linkCourseContents = (move: MoveDto) => {
    if (move.videoname) {
      const videoNameDtos = move.videoname.map(v => v.trim()).filter(v => v).map(v => { return { name: v.split('!')[0], options: this.getOptions(v) }; });
      const courseNames = move.courseDates.map(c => c.course);
      const contents = this.courses.filter(c => courseNames.includes(c.name)).flatMap(c => c.contents);

      // deep copy for different options in each move
      move.videos = deepCopy(contents.filter(v => videoNameDtos.map(n => n.name).includes(v.name)));
      move.videos.forEach(videoDto => videoDto.link = videoDto.link + videoNameDtos.find(n => n.name === videoDto.name)?.options ?? '');
      videoNameDtos.filter(v => v.name.startsWith("http")).map(v => { return { name: v.name, link: convertToEmbed(v.name) } as VideoDto; }).forEach(v => move.videos.push(v));
    }
  }

  private setCourses(courses: CourseDto[]) {
    this.courses = courses.sort(generateSortFn([c => c.name]));
    this.coursesLenghtSorted = deepCopy(this.courses).sort((a, b) => a.name.length > b.name.length ? -1 : 1);
    localStorage.setItem("courses", JSON.stringify(this.courses));
  }

  private setDances(dances: DanceDto[]) {
    this.dances = dances.sort(generateSortFn([d => d.name]));
    localStorage.setItem("dances", JSON.stringify(this.dances));
  }

  private setMoves(moves: MoveDto[]) {
    moves.sort(generateSortFn([m => m.dance, m => m.name]));
    this.moves = moves;
    this.movesLenghtSorted = deepCopy(this.moves).sort((a, b) => a.name.length > b.name.length ? -1 : 1);
    this.moves.forEach(this.linkCourseContents);
    localStorage.setItem("moves", JSON.stringify(this.moves));
    this.movesSubject.next(this.moves);
  }

  local_get() {
    this.dances = JSON.parse(localStorage.getItem("dances") ?? "[]");
    this.moves = JSON.parse(localStorage.getItem("moves") ?? "[]");
    this.courses = JSON.parse(localStorage.getItem("courses") ?? "[]");
    this.settingsService.initCourses(this.courses);
    this.movesSubject.next(this.moves);
    this.movesLenghtSorted = deepCopy(this.moves).sort((a, b) => a.name.length > b.name.length ? -1 : 1);
    this.coursesLenghtSorted = deepCopy(this.courses).sort((a, b) => a.name.length > b.name.length ? -1 : 1);
    this.isStarting.next(false);
  }

  private getOptions(videoname: string) {

    if (videoname.includes('!')) {
      console.log('getOptions')
      return '!' + videoname.split('!')[1];
    }
    return '';
  }

  async loading() {
    if (this.isStarting.getValue()) {
      await firstValueFrom(this.isStarting.pipe(filter(starting => !starting)));
    }
  }


  getMove(id: string): MoveDto | undefined {
    const moves = this.movesSubject.value.filter(m => m.name == id || m.id == id);
    if (moves.length > 0) {
      return moves[0];
    }
    console.log('not found', id)
    return
  }

  getGroupedMoveNames(): Observable<MoveGroupDto[]> {
    return this.movesSubject.asObservable()
      .pipe(map(moves =>
        Object.entries(this.groupByDance(moves))
          .map(([key, value]) => { return { dance: key, moves: value } as MoveGroupDto; })
      ))
  }

  getMovesNamesOf(dance: string | undefined): Array<string> {
    return this.movesSubject.value.filter(move => !dance || move.dance == dance).map(move => move.name);
  }

  getMovesOf(dance: string | undefined): Array<MoveDto> {
    return this.movesSubject.value.filter(move => !dance || move.dance == dance);
  }

  getNextOrder(dance: string | undefined): number {
    const orders = this.movesSubject.value.filter(move => !dance || move.dance == dance).map(move => move.order).sort((a, b) => a - b);
    return (orders.pop() ?? -1) + 1;
  }

  getMovesNames(): Set<string> {
    return this.movesNames;
  }

  getDanceNames(): Set<string> {
    return this.danceNames;
  }

  getDances(): Array<DanceDto> {
    return this.dances;
  }

  getCourseNames(dance?: string): Set<string> {
    return new Set(this.courses.filter(c => !dance || c.dances.includes(dance)).map(course => course.name));
  }

  getCourses(): Array<CourseDto> {
    return this.courses;
  }

  getTypes(): Array<string> {
    return this.types;
  }

  getToDos(): Array<string> {
    return this.toDos;
  }

  getVideoNames(move: MoveDto | undefined): Array<string> {
    return Array.from(new Set(this.courses.filter(c => move?.courseDates.map(d => d.course).includes(c.name)).flatMap(c => c.contents).map(c => c.name))).sort();
  }

  private groupByDance = (xs: MoveDto[]): [string, MoveDto[]] => {
    return xs.reduce((rv: any, x: MoveDto) => {
      if (!rv[x.dance]) {
        rv[x.dance] = []
      }
      rv[x.dance].push(x);
      return rv;
    }, {});
  };

  enrichDescription(move: MoveDto): string {
    let description = move.description;
    this.movesLenghtSorted
      .filter(m => m.dance == move.dance)
      .forEach(m => description = description.replaceAll(this.createRegExp(m.name), `$1[${m.name}](move/${m.id})`))
    this.movesLenghtSorted
      .forEach(m => description = description.replaceAll(this.createRegExp(`${m.dance}/${m.name}`), `$1[${m.dance}/${m.name}](move/${m.id})`))
    this.coursesLenghtSorted
      .forEach(course => description = description.replaceAll(this.createRegExp(course.name), `$1[${course.name}](course/${encodeURI(course.name)})`))
    return description;
  }

  private createRegExp(str: string) {
    return new RegExp(`([^\[])${escapeRegExp(str)}(?!\])`, 'g');
  }

  getRelationPairs(types: Array<string>): Observable<Array<Connection>> {
    return this.searchFilterObservable.pipe(map(searchFilter => {
      const pairs = new Array<Connection>();
      const moves = this.selectMoves(this.movesSubject.value, this.getDanceNames(), searchFilter);
      for (const move of moves) {
        if (types.includes(RelationType.start)) {
          move.startMove.filter(id => id).forEach(id => pairs.push({ to: move, from: this.getMove(id) ?? { id: id, name: id } as MoveDto }));
        }
        if (types.includes(RelationType.end)) {
          move.endMove.filter(id => id).forEach(id => pairs.push({ from: move, to: this.getMove(id) ?? { id: id, name: id } as MoveDto }));
        }
        if (types.includes(RelationType.contained)) {
          move.containedMoves.filter(id => id).forEach(id => pairs.push({ from: move, to: this.getMove(id) ?? { id: id, name: id } as MoveDto }));
        }
        if (types.includes(RelationType.related)) {
          move.relatedMoves.filter(id => id).forEach(id => pairs.push({ from: move, to: this.getMove(id) ?? { id: id, name: id } as MoveDto }));
        }
        if (types.includes(RelationType.otherDance)) {
          move.relatedMovesOtherDances.filter(id => id).forEach(id => pairs.push({ from: move, to: this.getMove(id) ?? { id: id, name: id } as MoveDto }));
        }
      }
      return pairs;
    }))

  }

  selectMoves(moves: MoveDto[], dances: Set<string>, search: SearchDto): MoveDto[] {
    return moves
      .filter(move => !dances.has(search.dance) || move.dance == search.dance)
      .filter(move => !search.move || move.name.includes(search.move))
      .filter(move => !search.courses || search.courses.length == 0 || move.courseDates.map(c => c.course).filter(c => search.courses.includes(c)).length > 0)
      .filter(move => !search.notcourse || !move.courseDates.map(c => c.course).includes(search.notcourse))
      .filter(move => !search.type || move.type.includes(search.type))
      .filter(move => !search.related || move.name.includes(search.related) || move.description.includes(search.related)
        || move.startMove.join('').includes(search.related) || move.endMove.join('').includes(search.related)
        || move.containedMoves.join('').includes(search.related) || move.relatedMoves.join('').includes(search.related)
        || move.relatedMovesOtherDances.join('').includes(search.related))
      .filter(move => !search.todo || move.toDo.includes(search.todo))
      .filter(move => !search.script || Boolean(eval(search.script)));
  }

  selectCourses(courses: CourseDto[], search: SearchDto): CourseDto[] {
    return courses
      .filter(course => !search.dance || course.dances.includes(search.dance))
      .filter(course => !search.move || this.moves.filter(move => move.name.includes(search.move)).flatMap(move => move.courseDates.map(c => c.course)).includes(course.name))
      .filter(course => !search.type || this.moves.filter(move => move.type.includes(search.type)).flatMap(move => move.courseDates.map(c => c.course)).includes(course.name))
      .filter(course => !search.courses || search.courses.length == 0 || search.courses.includes(course.name))
      .filter(course => !search.notcourse || course.name != search.notcourse)
      .filter(course => !search.script || Boolean(eval(search.script)));
  }

  selectDances(dances: DanceDto[], search: SearchDto): DanceDto[] {
    return dances
      .filter(dance => !search.dance || dance.name.includes(search.dance))
      .filter(dance => !search.move || this.moves.filter(move => move.name.includes(search.move)).filter(move => move.dance === dance.name).length > 0)
      .filter(dance => !search.courses || search.courses.length == 0 || this.courses.filter(course => course.dances.includes(dance.name)).filter(c => search.courses.includes(c.name)).length > 0)
      .filter(dance => !search.notcourse || this.courses.filter(course => course.dances.includes(dance.name)).filter(c => search.courses.includes(c.name)).length === 0)
      .filter(dance => !search.script || Boolean(eval(search.script)));
  }

  private tapRequest = tap({
    next: (response: any) => {
      console.log(response);
    }, error: (response: any) => {
      this.logError(response);
    }
  })

  private logError(response: any) {
    console.error(response);
    this.snackBar.open(`error:${response?.error?.error?.message ?? response?.error?.error_description ?? response?.statusText}`, "OK");
  }

  findDependent(moveName: string): Array<MoveDto> {
    return this.moves.filter(m => m.description.includes(moveName));
  }

  saveOrCreate(moveDto: MoveDto): Observable<MoveDto> {
    if (!moveDto.id) {
      moveDto.id = uuidv4();
    }
    this.addDefaultLocation(moveDto);
    if (moveDto.row) {
      return this.apiclientService.patchData(moveDto).pipe(map(r => moveDto), this.tapRequest, switchMap(this.saveOrCreateCourseDates), map(this.updateMoveData));
    } else {
      return this.apiclientService.appendData(moveDto).pipe(map(r => {
        moveDto.row = getRow(r.updates.updatedRange);
        return moveDto;
      }), this.tapRequest, switchMap(this.saveOrCreateCourseDates), map(this.updateMoveData))
    }
  }

  deleteMove(dto: MoveDto): Observable<MoveDto> {
    if (!dto.location || !dto.row) {
      return of(this.deleteMoveData(dto));
    }
    return this.deleteCourseDates(dto).pipe(switchMap(d => this.apiclientService.deleteData(dto)), this.tapRequest, map(r => dto), map(this.deleteMoveData));
  }

  deleteCourse(dto: CourseDto): Observable<CourseDto> {
    if (!dto.location || !dto.row) {
      return of(this.deleteCourseData(dto));
    }
    return this.delteCourseContents(dto).pipe(switchMap(d => this.apiclientService.deleteData(dto)), this.tapRequest, map(r => dto), map(this.deleteCourseData));
  }

  deleteDance(dto: DanceDto): Observable<DanceDto> {
    if (!dto.location || !dto.row) {
      return of(this.deleteDanceData(dto));
    }
    return this.apiclientService.deleteData(dto).pipe(this.tapRequest, map(r => dto), map(this.deleteDanceData));
  }

  private addDefaultLocation(dto: DtoBase) {
    if (!dto.location && this.settingsService.dataBases.length > 0) {
      dto.location = this.settingsService.dataBases[0].spreadsheetId;
    }
  }

  mulitSave(moveDtos: Array<MoveDto>): Observable<Array<MoveDto>> {
    return forkJoin<Array<MoveDto>>(moveDtos.filter(m => m.row).map(this.patchMove));
  }

  private patchMove = (moveDto: MoveDto) => {
    return this.apiclientService.patchData(moveDto).pipe(map(r => moveDto), this.tapRequest, map(this.updateMoveData))
  }

  private saveOrCreateCourseDates = (moveDto: MoveDto): Observable<MoveDto> => {
    return forkJoin(moveDto.courseDates.filter(c => c.course && c.date).map(c => { c.moveId = moveDto.id; return c; }).map(this.saveOrCreateCourseDate))
      .pipe(defaultIfEmpty([]), map(courseDates => { moveDto.courseDates = courseDates; return moveDto; }));
  }
  private saveOrCreateCourseDate = (courseDateDto: CourseDateDto): Observable<CourseDateDto> => {
    this.addDefaultLocation(courseDateDto);
    if (courseDateDto.row) {
      return this.apiclientService.patchData(courseDateDto).pipe(map(r => courseDateDto), this.tapRequest);
    } else {
      return this.apiclientService.appendData(courseDateDto).pipe(map(r => {
        courseDateDto.row = getRow(r.updates.updatedRange);
        return courseDateDto;
      }), this.tapRequest)
    }
  }

  private saveOrCreateCourseContents = (courseDto: CourseDto): Observable<CourseDto> => {
    return forkJoin(courseDto.contents.filter(c => c.name && c.link).map(c => { c.courseName = courseDto.name; return c; }).map(this.saveOrCreateCourseContent))
      .pipe(defaultIfEmpty([]), map(contents => { courseDto.contents = contents; return courseDto; }));
  }
  private saveOrCreateCourseContent = (contentDto: VideoDto): Observable<VideoDto> => {
    this.addDefaultLocation(contentDto);
    if (contentDto.row) {
      return this.apiclientService.patchData(contentDto).pipe(map(r => contentDto), this.tapRequest);
    } else {
      return this.apiclientService.appendData(contentDto).pipe(map(r => {
        contentDto.row = getRow(r.updates.updatedRange);
        return contentDto;
      }), this.tapRequest)
    }
  }

  private deleteCourseDates = (moveDto: MoveDto): Observable<MoveDto> => {
    return forkJoin(moveDto.courseDates.filter(c => c.course && c.date).map(this.delete))
      .pipe(defaultIfEmpty([]), map(courseDates => moveDto));
  }

  private delteCourseContents = (courseDto: CourseDto): Observable<CourseDto> => {
    return forkJoin(courseDto.contents.filter(c => c.name && c.link).map(this.delete))
      .pipe(defaultIfEmpty([]), map(contents => courseDto));
  }

  private delete = (dto: DtoBase): Observable<DtoBase> => {
    if (dto.location && !dto.row) {
      return of(dto);
    }
    return this.apiclientService.deleteData(dto).pipe(this.tapRequest, map(r => dto), map(d => d));
  }

  private updateMoveData = (moveDto: MoveDto): MoveDto => {
    const moves = deepCopy(this.movesSubject.value).filter(m => m.name != moveDto.name);
    moves.push(moveDto);
    this.setMoves(moves);
    return moveDto;
  }

  private deleteMoveData = (moveDto: MoveDto): MoveDto => {
    const moves = deepCopy(this.movesSubject.value).filter(m => m.name != moveDto.name);
    this.setMoves(moves);
    this.navService.navigate(["moves"]);
    return moveDto;
  }

  private updateCourseData = (courseDto: CourseDto): CourseDto => {
    const courses = deepCopy(this.courses).filter(m => m.name != courseDto.name);
    courses.push(courseDto);
    this.setCourses(courses);
    this.navService.navigate(["course", courseDto.name]);
    return courseDto;
  }

  private deleteCourseData = (courseDto: CourseDto): CourseDto => {
    const courses = deepCopy(this.courses).filter(m => m.name != courseDto.name);
    this.setCourses(courses);
    this.navService.navigate(["courses"]);
    return courseDto;
  }

  private updateDanceData = (danceDto: DanceDto): DanceDto => {
    const dances = deepCopy(this.dances).filter(m => m.name != danceDto.name);
    dances.push(danceDto);
    this.setDances(dances);
    this.navService.navigate(["dance", danceDto.name]);
    return danceDto;
  }

  private deleteDanceData = (danceDto: DanceDto): DanceDto => {
    const dances = deepCopy(this.dances).filter(m => m.name != danceDto.name);
    this.setDances(dances);
    this.navService.navigate(["dances"]);
    return danceDto;
  }

  async normalize() {
    console.log('normalize');
    for (const dance of this.danceNames) {
      const moves = deepCopy(this.moves.filter(m => m.dance == dance));
      if (moves.length > 0) {
        moves.sort(generateSortFn([c => c.order]));
        let lastOrder = -1;
        for (const move of moves) {
          if (move.order <= lastOrder) {
            console.log(dance, move.name, move.order, lastOrder + 1)
            move.order = lastOrder + 1;
            this.saveOrCreate(move).subscribe(m => console.log(move));
          }
          lastOrder++;
        }
      }
    }
  }

  async normalizeCourse() {
    console.log('normalizeCourse');
    for (const course of this.courses) {
      this.saveOrCreateCourse(course).subscribe(console.log);
      await delay(10000);
    }
  }

  saveOrCreateCourse(courseDto: CourseDto): Observable<CourseDto> {
    this.addDefaultLocation(courseDto);
    this.settingsService.encrpytCourse(courseDto);
    if (courseDto.row) {
      return this.apiclientService.patchData(courseDto).pipe(map(r => courseDto), this.tapRequest, switchMap(this.saveOrCreateCourseContents), map(this.updateCourseData));
    } else {
      return this.apiclientService.appendData(courseDto).pipe(map(r => {
        courseDto.row = getRow(r.updates.updatedRange);
        return courseDto;
      }), this.tapRequest, switchMap(this.saveOrCreateCourseContents), map(this.updateCourseData))
    }
  }

  saveOrCreateDance(danceDto: DanceDto): Observable<DanceDto> {
    this.addDefaultLocation(danceDto);
    if (danceDto.row) {
      return this.apiclientService.patchData(danceDto).pipe(map(r => danceDto), this.tapRequest, map(this.updateDanceData));
    } else {
      return this.apiclientService.appendData(danceDto).pipe(map(r => {
        danceDto.row = getRow(r.updates.updatedRange);
        return danceDto;
      }), this.tapRequest, map(this.updateDanceData))
    }
  }

  updateLocation(dto: DtoBase | undefined, location: string) {
    if (dto) {
      location = this.settingsService.mapTitleToSheetId(location);
      if (location != dto.location) {
        dto.row = NaN;
      }
      dto.location = location;
    }
  }
}
