import {Component, ChangeDetectorRef} from '@angular/core';
import {SelectionModel} from '@angular/material';
import {PeopleDatabase, UserData} from './people-database';
import {PersonDataSource} from './person-data-source';

@Component({
  moduleId: module.id,
  selector: 'data-table-demo',
  templateUrl: 'data-table-demo.html',
  styleUrls: ['data-table-demo.scss'],
})
export class DataTableDemo {
  dataSource: PersonDataSource;
  selection = new SelectionModel<UserData>(true, []);
  propertiesToDisplay = ['checkbox', 'userId', 'userName', 'progress'];

  constructor(private _peopleDatabase: PeopleDatabase,
              private _changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit() {
    this.dataSource = new PersonDataSource(this._peopleDatabase);
  }

  getOpacity(progress: number) {
    let distanceFromMiddle = Math.abs(50 - progress);
    return distanceFromMiddle / 50 + .3;
  }

  isAllSelected(): boolean {
    return !this.selection.isEmpty() &&
        this.selection.selected.length == this.dataSource.filteredData.length;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.filteredData.forEach(data => this.selection.select(data));
    }
  }
}
