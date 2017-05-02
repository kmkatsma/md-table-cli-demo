import {MdColumnDef, MdTable} from './data-table';
import {Component} from '@angular/core';
import {MdTableSortData, SortableDataSource} from './data-source';

@Component({
  selector: '[sortable]',
  host: {
    'class': 'mat-table-sortable',
    '(click)': 'sort()'
  },
  templateUrl: 'sortable.html',
  styleUrls: ['./sortable.scss'],
})
export class MdSortable {
  constructor(private table: MdTable, private columnDef: MdColumnDef) {
    if (!(this.table.dataSource instanceof SortableDataSource)) {
      throw Error('The data source is not sortable.');
    }
  }

  sort() {
    let newSort: MdTableSortData = {
      column: this.columnDef.name,
      order: 'ascending'
    };

    // Sorting an already sorted column has two outcomes. If sorted ascending, switch to descending.
    // If sorted and already descending, remove the sort.
    const sort = this.getDataSource().sort;
    if (sort && sort.column == this.columnDef.name) {
      if (sort.order == 'ascending') { newSort.order = 'descending'; }
      if (sort.order == 'descending') { newSort.column = null; }
    }

    this.getDataSource().sort = newSort;
  }

  isSortedAscending() {
    return this.isSorted() && this.getDataSource().sort.order == 'ascending';
  }

  isSorted() {
    return this.getDataSource().sort && this.getDataSource().sort.column == this.columnDef.name;
  }

  getDataSource(): SortableDataSource<any> {
    return <any> this.table.dataSource;
  }
}
