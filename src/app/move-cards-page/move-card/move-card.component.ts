import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AnchorService } from 'src/app/app-routing-module/anchor.service';
import { CourseDateDto } from 'src/app/model/course-date-dto';
import { MoveDto } from 'src/app/model/move-dto';
import { DataManagerService } from 'src/app/services/data-manager.service';
import { NavService } from 'src/app/services/nav.service';

@Component({
  selector: 'app-move-card',
  templateUrl: './move-card.component.html',
  styleUrls: ['./move-card.component.css']
})
export class MoveCardComponent implements OnInit, OnDestroy {

  @Input("move-dto") moveDto!: MoveDto
  nameUri = "";
  description!: string;

  @ViewChild('renderedContent') renderedContent!: ElementRef<HTMLInputElement>;

  onClick = (event: Event) => {
    this.navService.fragment = this.nameUri;
    this.anchorService.interceptClick(event);
  }

  constructor(private navService: NavService, private dataManager: DataManagerService, private anchorService: AnchorService) { }

  ngOnInit(): void {
    this.nameUri = this.moveDto.name.replace(/[^\w]/g, '');
  }

  openDetails(): Promise<boolean> {
    this.navService.fragment = this.nameUri;
    return this.navService.navigate(["move", encodeURI(this.moveDto.id)]);
  }

  isDateValid(courseDate: CourseDateDto) {
    return courseDate?.date && courseDate?.date?.toString() !== 'Invalid Date';
  }

  initDescription() {
    if (!this.description) {
      this.description = this.dataManager.enrichDescription(this.moveDto);
      this.renderedContent.nativeElement.addEventListener('click', this.onClick);
    }
  }

  ngOnDestroy(): void {
    this.renderedContent.nativeElement?.removeEventListener('click', this.onClick);
  }
}
