import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatLegacyAutocompleteSelectedEvent as MatAutocompleteSelectedEvent } from '@angular/material/legacy-autocomplete';
import { MatLegacyChipInputEvent as MatChipInputEvent, MatLegacyChipSelectionChange as MatChipSelectionChange } from '@angular/material/legacy-chips';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
import { MoveDto } from '../model/move-dto';
import { MoveGroupDto } from '../model/move-group-dto';
import { UserMode } from '../model/user-mode';
import { DataManagerService } from '../services/data-manager.service';
import { NavService } from '../services/nav.service';
import { SettingsService } from '../services/settings.service';
import { easterEggMoves } from '../util/data';
import { deepCopy, nameExistsValidator } from '../util/util';
import { AnchorService } from '../app-routing-module/anchor.service';

@Component({
  selector: 'app-move-page',
  templateUrl: './move-page.component.html',
  styleUrls: ['./move-page.component.css']
})
export class MovePageComponent implements OnInit, OnDestroy, AfterViewInit {
  separatorKeysCodes: number[] = [ENTER, COMMA];
  move: MoveDto | undefined;
  dances = new Array<string>();
  types = new Array<string>();
  toDos = new Array<string>();
  videoNames = new Array<string>();
  courseNames = new Set<string>();
  moveForm = this.create_form();
  movesGroup: MoveGroupDto[] | undefined;
  otherMovesNames: Set<string> = new Set<string>();
  danceMoves: Array<MoveDto> = new Array<MoveDto>();
  loaded = false;
  idParam = "";
  nameOriginal = "";
  readonly = false;
  subscriptionsGlobal = new Array<Subscription>();
  subscriptions = new Array<Subscription>();
  description: string = "";
  locations = new Set<string>();

  @ViewChild('videonameInput') videonameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('renderedContent') renderedContent!: ElementRef<HTMLInputElement>;
  videonameControl = new UntypedFormControl("");

  constructor(private route: ActivatedRoute, private dataManager: DataManagerService,
    private settings: SettingsService, private navService: NavService, private sanitizer: DomSanitizer,
    private anchorService: AnchorService) {
    this.subscriptionsGlobal.push(this.route.paramMap.subscribe(params => {
      this.readParams(params);
    }));
  }
  ngAfterViewInit(): void {
    this.renderedContent.nativeElement.addEventListener('click', event => this.anchorService.interceptClick(event));
  }

  async ngOnInit(): Promise<void> {
    this.subscriptionsGlobal.push(this.dataManager.getGroupedMoveNames().subscribe(groupedMoveNames => {
      this.movesGroup = groupedMoveNames;
    }));
    this.subscriptionsGlobal.push(this.dataManager.isStarting.subscribe(starting => {
      if (!starting) {
        this.start();
      }
      this.loaded = !starting;
    }));
  }

  private start() {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.moveForm = this.create_form();
    this.dances = Array.from(new Set(this.dataManager.getDances().map(dance => dance.name))).sort();
    this.otherMovesNames = new Set<string>(["new"]);
    this.locations = new Set<string>(["local"]);

    if (this.idParam == "new") {
      if (this.move) {
        this.move = deepCopy(this.move);
        this.move.id = '';
        this.move.row = NaN;
        this.moveForm?.markAllAsTouched();
      }
      this.navService.headlineObservable.next(this.idParam);
    } else if (Object.keys(easterEggMoves).includes(this.idParam)) {
      this.move = deepCopy(easterEggMoves[this.idParam]);
      this.navService.headlineObservable.next(this.idParam);
    } else {
      this.move = this.dataManager.getMove(this.idParam);
      if (this.move) {
        this.move.courseDates.forEach(this.addCourseDateForm);
        this.dataManager.getMovesOf(this.move?.dance).map(m => m.name).filter(name => this.move?.name != name).forEach(name => this.otherMovesNames.add(name))
        this.nameOriginal = this.move.name;
      }
      this.navService.headlineObservable.next(this.move?.name ?? 'Not Found');
    }

    this.subscriptions.push(this.moveForm.valueChanges.subscribe(value => {
      console.log(value);
      if (!this.move) {
        this.move = {} as MoveDto;
      }
      this.move.name = value.name;
      this.move.dance = value.dance;
      this.courseNames = this.dataManager.getCourseNames(this.move?.dance);
      if (value.dance && value.order === null) {
        this.move.order = this.dataManager.getNextOrder(value.dance);
      } else {
        this.move.order = Number(value.order);
      }
      this.move.description = value.description;
      this.move.count = value.count;
      this.move.nameVerified = value.nameVerified;
      this.move.type = value.type;
      this.move.startMove = value.startMove;
      this.move.endMove = value.endMove;
      this.move.containedMoves = value.containedMoves;
      this.move.relatedMoves = value.relatedMoves;
      this.move.relatedMovesOtherDances = value.relatedMovesOtherDances;
      this.move.videoname = value.videoname;
      this.move.links = value.links;
      this.move.toDo = value.toDo;
      this.move.courseDates = value.courseDates;
      this.move.location = value.location;
      this.danceMoves = this.dataManager.getMovesOf(this.move?.dance);
      this.description = this.dataManager.enrichDescription(this.move);
      this.types = this.dataManager.getTypes().filter(x => x.includes(value.type));
      if (this.types.length == 1 && value.type == this.types[0]) {
        this.types = this.dataManager.getTypes();
      }
      this.toDos = this.dataManager.getToDos().filter(x => x.includes(value.toDo));
    }));
    this.videoNames = this.dataManager.getVideoNames();
    this.videonameControl.valueChanges.subscribe(value => {
      this.videoNames = this.dataManager.getVideoNames().filter(x => !value || x.includes(value));
    });
    if (this.move) {
      this.moveForm.patchValue(this.move);
    }
    this.subscriptions.push(this.settings.userMode.subscribe(userMode => {
      if (userMode === UserMode.read && this.move?.location && this.move?.location != 'local') {
        this.moveForm.disable();
        this.videonameControl.disable();
        this.readonly = true;
      } else if (this.settings.sheetId) {
        this.locations.add(this.settings.sheetId);
      }
    }));
    this.move?.videos?.forEach(v => v.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(v.link));
  }

  private create_form(): UntypedFormGroup {
    return new UntypedFormGroup({
      name: new UntypedFormControl('', [Validators.required, nameExistsValidator(() => this.otherMovesNames)]),
      dance: new UntypedFormControl('', Validators.required),
      date: new UntypedFormControl(null),
      order: new UntypedFormControl(),
      count: new UntypedFormControl(''),
      nameVerified: new UntypedFormControl(''),
      type: new UntypedFormControl('Figur', Validators.required),
      startMove: new UntypedFormControl([]),
      endMove: new UntypedFormControl([]),
      containedMoves: new UntypedFormControl([]),
      relatedMoves: new UntypedFormControl([]),
      relatedMovesOtherDances: new UntypedFormControl([]),
      videoname: new UntypedFormControl([]),
      description: new UntypedFormControl(''),
      toDo: new UntypedFormControl(''),
      links: new UntypedFormControl(''),
      location: new UntypedFormControl(''),
      row: new UntypedFormControl(''),
      courseDates: new UntypedFormArray([])
    });
  }

  private readParams(params: ParamMap) {
    if (!params.has('name')) {
      return;
    }
    this.idParam = params.get('name') as string;
    this.idParam = decodeURI(this.idParam);
    this.nameOriginal = this.idParam;
    if (this.loaded) {
      this.start();
    }
  }

  private createCourseDateForm = () => {
    return new UntypedFormGroup({
      course: new UntypedFormControl(''),
      date: new UntypedFormControl(null),
      row: new UntypedFormControl('')
    });
  }

  addCourseDateForm = () => {
    const formArray = this.moveForm.get("courseDates") as UntypedFormArray;
    formArray.push(this.createCourseDateForm());
  }

  removeOrClearCourseDate = (i: number) => {
    const formArray = this.moveForm.get('courseDates') as UntypedFormArray
    if (formArray.length > 1) {
      formArray.removeAt(i)
    } else {
      formArray.reset()
    }
  }

  getCourseDateControls() {
    return (this.moveForm.get('courseDates') as UntypedFormArray).controls;
  }

  onSave() {
    if (this.moveForm.valid && this.move) {
      this.loaded = false;
      this.moveForm.disable();
      this.videonameControl.disable();
      this.dataManager.saveOrCreate(this.move).subscribe(m => {
        this.moveForm.patchValue(m);
        const newName = m.name;
        this.move?.videos?.forEach(v => v.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(v.link));
        if (this.nameOriginal != newName && this.nameOriginal != "new") {
          const dependentMoves = this.dataManager.findDependent(this.nameOriginal);
          if (dependentMoves && dependentMoves.length > 0) {
            dependentMoves.forEach(m => m.description = m.description.replace(this.nameOriginal, newName));
            this.dataManager.mulitSave(dependentMoves).subscribe(moves => {
              this.loaded = true;
              this.moveForm.enable();
              this.videonameControl.enable();
              this.navService.navigate(["move", m.id]);
            });
          } else {
            this.loaded = true;
            this.moveForm.enable();
            this.videonameControl.enable();
            this.navService.navigate(["move", m.id]);
          }
          this.navService.headlineObservable.next(m.name);
        } else {
          this.loaded = true;
          this.moveForm.enable();
          this.videonameControl.enable();
          if (this.idParam == "new") {
            this.navService.navigate(["move", m.id]);
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptionsGlobal.forEach(s => s.unsubscribe());
    this.settings.log('move.page', 'ngOnDestroy');
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      let videoNames = this.moveForm.get("videoname")?.value;
      videoNames = Array.isArray(videoNames) ? videoNames : new Array<string>();
      videoNames.push(value);
      this.moveForm.get("videoname")?.setValue(videoNames);
    }
    event.chipInput!.clear();
    this.videonameControl.setValue(null);
  }

  remove(key: string | unknown): void {
    const videoNames = this.moveForm.get("videoname")?.value;
    const index = videoNames.indexOf(key);

    if (index >= 0) {
      videoNames.splice(index, 1);
      this.moveForm.get("videoname")?.setValue(videoNames);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const videoNames = this.moveForm.get("videoname")?.value;
    videoNames.push(event.option.viewValue);
    this.moveForm.get("videoname")?.setValue(videoNames);
    this.videonameInput.nativeElement.value = '';
    this.videonameControl.setValue(null);
  }

  changeSelected(name: string | unknown): void {
    const videoname = name as string;
    const video = this.move?.videos.find(v => videoname?.includes(v.name));
    if (video) {
      window.open(video.link);
    }
  }
}
