import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {MdTableViewData} from './data-table';

/**
 * Possible ordering for sorting.
 */
export type MdTableSortOrder = 'ascending' | 'descending';

/**
 * Event fired when sort changes.
 */
export interface MdTableSortData {
  column: string;
  order: MdTableSortOrder;
}

export abstract class SortableDataSource<T> {
  sort: MdTableSortData;
}

export abstract class DataSource<T> {
  abstract connectTable(viewChanged: Observable<MdTableViewData>): Observable<T[]>;
}
