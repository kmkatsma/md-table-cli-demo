import {Component, Input, Output, EventEmitter} from '@angular/core';
import {PersonDataSource} from './person-data-source';

@Component({
  moduleId: module.id,
  selector: 'pagination-control',
  templateUrl: 'pagination-control.html',
  styleUrls: ['pagination-control.scss'],
  host: {
    '[class.hide]': 'this.dataSource.displayedData.length == 0'
  }
})
export class PaginationControl {
  pageSizeOptions = [5, 10, 20, 50, 100, 500, 1000];

  @Input() dataSource: PersonDataSource;

  @Output() pageChanged = new EventEmitter<void>();

  getRangeDisplay(): string {
    const start = this.dataSource.pagination.index;
    const dataLength = this.dataSource.filteredData.length;
    const end = Math.min(start + this.dataSource.pagination.pageLength, dataLength);

    return `${start + 1}-${end} of ${dataLength}`;
  }
}
