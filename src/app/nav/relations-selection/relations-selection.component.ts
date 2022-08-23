import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RelationDisplayType } from 'src/app/model/relation-display-type-enum';
import { RelationType } from 'src/app/model/relation-type-enum';
import { DataManagerService } from 'src/app/services/data-manager.service';
import { NavService } from 'src/app/services/nav.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-relations-selection',
  templateUrl: './relations-selection.component.html',
  styleUrls: ['./relations-selection.component.css']
})
export class RelationsSelectionComponent implements OnInit {
  relationTypes: Array<string> = [RelationType.start, RelationType.end, RelationType.contained, RelationType.related, RelationType.otherDance];
  displayTypes: Array<string> = [RelationDisplayType.cytoscape]

  relationsForm = new UntypedFormGroup({
    relationTypes: new UntypedFormControl([]),
    displayType: new UntypedFormControl("")
  });
  subscriptions = new Array<Subscription>();
  initialTypes: Array<string> = [RelationType.start, RelationType.end];

  constructor(private dataManagerService: DataManagerService, private navService: NavService) { }

  async ngOnInit(): Promise<void> {
    await this.dataManagerService.loading();
    this.subscriptions.push(this.dataManagerService.relationsSelectionObservable.subscribe(value => {
      if (!value.relationTypes?.length) {
        value.relationTypes = JSON.parse(JSON.stringify(this.initialTypes));
      }
      if (!value.displayType) {
        value.displayType = RelationDisplayType.cytoscape;
      }
      if (JSON.stringify(value) !== JSON.stringify(this.relationsForm.value)) {
        this.relationsForm.patchValue(value);
      }
    }));
    this.subscriptions.push(this.relationsForm.valueChanges.subscribe(value => {
      this.dataManagerService.relationsSelectionObservable.next(value);
      if (JSON.stringify(this.initialTypes) === JSON.stringify(value.relationTypes)) {
        value.relationTypes = [];
      }
      if (value.displayType == RelationDisplayType.cytoscape) {
        value.displayType = undefined;
      }
      this.navService.navigate([], value);
    }));
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
