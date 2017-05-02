import {Component, Input, ElementRef, ViewChild} from '@angular/core';
import {SelectionModel} from '@angular/material';
import {Observable} from 'rxjs/Observable';
import {PeopleDatabase, UserData} from './people-database';
import {PersonDataSource} from './person-data-source';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/debounceTime';

@Component({
  moduleId: module.id,
  selector: 'data-table-header',
  templateUrl: 'data-table-header.html',
  styleUrls: ['data-table-header.scss'],
  host: {
    '[style.backgroundColor]': "selection.hasValue() ? 'rgba(255, 64, 129, .5)' : '#FFF'"
  }
})
export class DataTableHeader {
  searchOpen = false;

  @Input() dataSource: PersonDataSource;

  @Input() selection: SelectionModel<UserData>;

  @Input() columns: string[];

  @ViewChild('filter') filter: ElementRef;

  constructor(public peopleDatabase: PeopleDatabase) { }

  ngOnInit() {
    Observable.fromEvent(this.filter.nativeElement, 'keyup')
        .debounceTime(150)
        .distinctUntilChanged()
        .subscribe(() => {
      this.dataSource.resetPagination();
      this.dataSource.filter = this.filter.nativeElement.value;
    });
  }

  removeSelected() {
    this.peopleDatabase.remove(this.selection.selected);
    this.selection.clear();
  }

  shiftColumns() {
    // Shift columns after removing checkbox, insert back in after shift
    const checkbox = this.columns.shift();
    this.columns.push(this.columns.shift());
    this.columns.unshift(checkbox);
  }

  toggleColorColumn() {
    let colorColumnIndex = this.columns.findIndex(col => col === 'color');
    if (colorColumnIndex == -1) {
      this.columns.push('color');
    } else {
      this.columns.splice(colorColumnIndex, 1);
    }
  }

  changeSelectedProgress() {
    this.selection.selected.forEach(data => this.peopleDatabase.randomizeProgress(data));
  }

  cancelSearch(input: HTMLInputElement, event: Event) {
    event.stopPropagation();

    this.searchOpen = false;
    this.dataSource.filter = '';

    input.value = '';
    input.blur();

  }
}
