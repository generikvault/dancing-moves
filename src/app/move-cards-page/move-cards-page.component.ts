import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MoveDto } from '../model/move-dto';
import { SearchDto } from '../model/search-dto';
import { DataManagerService } from '../services/data-manager.service';
import { NavService } from '../services/nav.service';
import { deepCopy, delay, generateSortFn } from '../util/util';
@Component({
  selector: 'app-move-cards-page',
  templateUrl: './move-cards-page.component.html',
  styleUrls: ['./move-cards-page.component.css']
})
export class MoveCardsPageComponent implements OnInit, AfterViewInit, OnDestroy {

  moves: MoveDto[] = [];
  allMoves: MoveDto[] = [];
  loaded = false;
  subscriptions = new Array<Subscription>();

  constructor(private dataManagerService: DataManagerService, private navService: NavService) {
    this.navService.headlineObservable.next("Dancing Moves");
  }

  ngAfterViewInit(): void {
    if (this.moves.length != 0) {
      this.scrollTo(this.navService.fragment);
    }
    this.subscriptions.push(this.dataManagerService.isStarting.subscribe(starting => {
      this.scrollTo(this.navService.fragment);
    }))
  }

  async ngOnInit(): Promise<void> {
    this.subscriptions.push(this.dataManagerService.isStarting.subscribe(starting => {
      if (!starting) {
        this.start();
      }
      this.loaded = !starting;
    }));
  }

  private start() {
    this.subscriptions.push(this.dataManagerService.movesObservable.subscribe((moves: MoveDto[]) => {
      this.moves = deepCopy(moves).sort(generateSortFn([m => m.dance, m => m.order, m => m.name]));
      this.allMoves = deepCopy(this.moves);
    }));
    this.subscriptions.push(this.dataManagerService.searchFilterObservable.subscribe(
      (value: SearchDto) => {
        this.moves = this.dataManagerService.selectMoves(this.allMoves, this.dataManagerService.getDanceNames(), value)
        this.moves.sort(generateSortFn(value.sort.map(key => this.sortKeyToFunction(key, value))));
      }));
  }
  async scrollTo(id?: string): Promise<void> {
    if (id) {
      await delay(10);
      const elementList = document.querySelectorAll('#' + id);
      console.log(elementList);
      const element = elementList[0] as HTMLElement;
      element?.scrollIntoView({ block: "start", behavior: 'auto' });
      this.navService.fragment = "";
    }
  }

  sortKeyToFunction(key: string, searchDto: SearchDto): (m: MoveDto) => any {
    if (key === "courseDate") {
      if (!searchDto.courses || searchDto.courses.length === 0) {
        return m => m.courseDates.map(c => c.date).pop();
      }
      return m => m.courseDates.filter(c => searchDto.courses.includes(c.course)).map(c => c.date).pop();
    }
    return m => eval("m." + key);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
