import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { CourseDto } from '../model/course-dto';
import { UserMode } from '../model/user-mode';
import { VideoDto } from '../model/video-dto';
import { DataManagerService } from '../services/data-manager.service';
import { NavService } from '../services/nav.service';
import { SettingsService } from '../services/settings.service';
import { convertToEmbed, deepCopy, nameExistsValidator } from '../util/util';

@Component({
  templateUrl: './course-page.component.html',
  styleUrls: ['./course-page.component.css']
})
export class CoursePageComponent implements OnInit, OnDestroy {
  course: CourseDto | undefined;
  otherNames: Set<string> = new Set<string>();
  dances = new Set<string>();
  schools = new Set<string>();
  levels = new Set<string>();
  loaded = false;
  nameParam = "";
  readonly = false;
  courseForm = this.create_form();
  subscriptionsGlobal = new Array<Subscription>();
  subscriptions = new Array<Subscription>();

  constructor(private route: ActivatedRoute, private dataManager: DataManagerService,
    private settings: SettingsService, private navService: NavService) {
    this.subscriptionsGlobal.push(this.route.paramMap.subscribe(params => {
      this.readParams(params);
    }));
  }

  ngOnInit(): void {
    this.subscriptionsGlobal.push(this.dataManager.isStarting.subscribe(starting => {
      if (!starting) {
        this.start();
      }
      this.loaded = !starting;
    }));
  }

  private start() {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.courseForm = this.create_form();
    this.dances = new Set(this.dataManager.getDances().map(dance => dance.name));
    const courses = this.dataManager.getCourses();
    this.otherNames = new Set(courses.map(course => course.name));
    this.otherNames.add("new");

    if (this.nameParam == "new") {
      if (this.course) {
        this.course = deepCopy(this.course);
        this.course.row = NaN;
        this.courseForm?.markAllAsTouched();
      }
    } else {
      this.course = courses.find(course => course.name == this.nameParam);
      if (this.course) {
        this.course.contents?.forEach(this.addContentForm);
        this.otherNames.delete(this.course.name);
      }
    }
    this.subscriptions.push(this.courseForm.valueChanges.subscribe(value => {
      if (!this.course) {
        this.course = { dtoType: 'Courses' } as CourseDto;
      }
      this.course.name = value.name;
      this.course.dances = value.dances;
      this.course.school = value.school;
      this.course.description = value.description;
      this.course.teacher = value.teacher;
      this.course.level = value.level;
      this.course.start = value.start;
      this.course.end = value.end;
      this.course.time = value.time;
      this.course.groupName = value.groupName;
      this.course.contents = value.contents.map((c: VideoDto) => {
        c.link = convertToEmbed(c.link);
        return c
      });
      if (value.password) {
        this.course.salt = uuidv4();
        this.course.hash = this.settings.hashCourse(this.course, value.password);
      }
      this.schools = new Set(courses.map(course => course.school));
      this.levels = new Set(courses.map(course => course.level));
    }));
    if (this.course) {
      this.courseForm.patchValue(this.course);
    }
    this.subscriptions.push(this.settings.userMode.subscribe(userMode => {
      if (userMode === UserMode.read) {
        this.courseForm.disable();
        this.readonly = true;
      } else if (userMode === UserMode.write) {
        if (!this.settings.hasAccessToCourse(this.course)) {
          this.courseForm.disable();
          this.readonly = true;
        }
      }
    }));
  }

  private create_form() {
    return new UntypedFormGroup({
      name: new UntypedFormControl('', [Validators.required, nameExistsValidator(() => this.otherNames)]),
      dances: new UntypedFormControl([]),
      school: new UntypedFormControl(''),
      description: new UntypedFormControl(''),
      teacher: new UntypedFormControl(''),
      level: new UntypedFormControl(''),
      start: new UntypedFormControl(null),
      end: new UntypedFormControl(null),
      time: new UntypedFormControl(''),
      groupName: new UntypedFormControl(''),
      password: new UntypedFormControl(''),
      contents: new UntypedFormArray([]),
      location: new UntypedFormControl(''),
      row: new UntypedFormControl(''),
      dtoType: new UntypedFormControl('Courses')
    });
  }
  private readParams(params: ParamMap) {
    if (!params.has('name')) {
      return;
    }
    this.nameParam = params.get('name') as string;
    this.nameParam = decodeURI(this.nameParam);
    this.navService.headlineObservable.next(this.nameParam);
    if (this.loaded) {
      this.start();
    }
  }

  private createContentForm = () => {
    return new UntypedFormGroup({
      name: new UntypedFormControl(''),
      link: new UntypedFormControl(null),
      location: new UntypedFormControl(''),
      row: new UntypedFormControl(''),
      dtoType: new UntypedFormControl('CourseContents')
    });
  }

  addContentForm = () => {
    const formArray = this.courseForm.get("contents") as UntypedFormArray;
    formArray.push(this.createContentForm());
  }

  getContentControls() {
    return (this.courseForm.get('contents') as UntypedFormArray).controls;
  }

  onSubmit() {
    if (this.courseForm.valid && this.course) {
      this.loaded = false;
      this.courseForm.disable();
      this.dataManager.saveOrCreateCourse(this.course).subscribe(m => {
        console.log(m);
        this.courseForm.patchValue(m);
        this.loaded = true;
        this.courseForm.enable();
      });
    }
  }

  onDelete() {
    if (this.course) {
      this.dataManager.deleteCourse(this.course).subscribe(m => console.log(m));
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptionsGlobal.forEach(s => s.unsubscribe());
  }
}
