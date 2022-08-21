import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CourseDto } from '../model/course-dto';
import { SearchDto } from '../model/search-dto';
import { DataManagerService } from '../services/data-manager.service';
import { NavService } from '../services/nav.service';
import { deepCopy, generateSortFn } from '../util/util';

@Component({
  templateUrl: './course-cards-page.component.html',
  styleUrls: ['./course-cards-page.component.css']
})
export class CourseCardsPageComponent implements OnInit, OnDestroy {

  courses: CourseDto[] = [];
  allCourses: CourseDto[] = [];
  loaded = false;
  subscriptions = new Array<Subscription>();
  constructor(private dataManagerService: DataManagerService, private navService: NavService) {
    this.navService.headlineObservable.next("Courses");
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
    this.courses = this.dataManagerService.getCourses();
    this.allCourses = deepCopy(this.courses);
    this.subscriptions.push(this.dataManagerService.searchFilterObservable.subscribe(
      (value: SearchDto) => {
        this.courses = this.dataManagerService.selectCourses(this.allCourses, value).sort(generateSortFn([c => c.name]));
      }));
  }

  openDetails(name: string): Promise<boolean> {
    return this.navService.navigate(["course", encodeURI(name)]);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
