import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { RelationParams } from "./app/model/relation-params";
import { UserMode } from "./app/model/user-mode";
import { DataManagerService } from "./app/services/data-manager.service";
import { NavService } from "./app/services/nav.service";
import { SettingsService } from "./app/services/settings.service";

export const buildNavService = () => jasmine.createSpyObj<NavService>('NavService',
    ['navigate', 'openWebsiteIfEasterEggFound'], { headlineObservable: new BehaviorSubject<string>("Dancing Moves") });
export const buildDataManagerService = () => jasmine.createSpyObj<DataManagerService>('DataManagerService',
    {
        start: undefined, loading: undefined, getMove: undefined, getGroupedMoveNames: of(), getMovesNamesOf: undefined, getMovesNames: undefined,
        getDanceNames: undefined, getCourseNames: undefined, getTypes: undefined, getRelationPairs: of(), saveOrCreate: undefined, getDances: [], getVideoNames: []
    }, { relationsSelectionObservable: new BehaviorSubject<RelationParams>({} as RelationParams), isStarting: new BehaviorSubject<boolean>(false) });
export const buildActivatedRoute = () => jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute',
    [], { paramMap: of() });

export const buildSettingsService = () => jasmine.createSpyObj<SettingsService>('SettingsService',
    ['fetchSettings', 'loading', 'initSettings', 'log'], { userMode: new BehaviorSubject<UserMode>(UserMode.read) });