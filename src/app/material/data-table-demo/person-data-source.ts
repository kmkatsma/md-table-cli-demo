import {MdTableViewData} from '../data-table/data-table';
import {MdTableSortData, SortableDataSource} from '../data-table/data-source';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/mergeMap';
import {PeopleDatabase, UserData} from './people-database';

export interface PaginationData {
  index: number;
  pageLength: number;
}

export class PersonDataSource extends SortableDataSource<any> {
  _filteredData = new BehaviorSubject<UserData[]>([]);
  get filteredData(): UserData[] { return this._filteredData.value; }

  _displayData = new BehaviorSubject<UserData[]>([]);
  get displayedData(): UserData[] { return this._displayData.value; }

  _renderedData: any[] = [];

  _filter = new BehaviorSubject<string>('');
  set filter(filter: string) { this.resetPagination(); this._filter.next(filter); }
  get filter(): string { return this._filter.value; }

  _sort = new BehaviorSubject<MdTableSortData>({column: null, order: 'ascending'});
  set sort(sort: MdTableSortData) { this.resetPagination(); this._sort.next(sort); }
  get sort(): MdTableSortData { return this._sort.value; }

  _pagination = new BehaviorSubject<PaginationData>({index: 0, pageLength: 10});
  set pagination(pagination: PaginationData) { this._pagination.next(pagination); };
  get pagination(): PaginationData { return this._pagination.value; }

  constructor(private _peopleDatabase: PeopleDatabase) {
    super();

    // When the base data or filter changes, fetch a new set of filtered data.
    const baseFilteredDataChanges = [this._peopleDatabase.baseDataChange, this._filter];
    Observable.combineLatest(baseFilteredDataChanges)
        .mergeMap(() => this._peopleDatabase.getData(this.filter))
        .subscribe((data: UserData[]) => { this._filteredData.next(data); });

    this._pagination.subscribe(() => this._renderedData = []);

    // Update displayed data when the filtered data changes, or the sort/pagination changes.
    // When the filtered data changes, re-sort the data and update data size and displayed data.
    const displayDataChanges = [this._filteredData, this._sort, this._pagination];
    Observable.combineLatest(displayDataChanges).subscribe((result: any[]) => {
      const [filteredData, sort, pagination] = result;

      const sortedData = this.sortData(sort, filteredData);
      let paginatedData = sortedData.splice(pagination.index, pagination.pageLength);

      this._displayData.next(paginatedData);
    });
  }

  connectTable(viewChange: Observable<MdTableViewData>): Observable<UserData[]> {
    return Observable.combineLatest([viewChange, this._displayData]).map((result: any[]) => {
      const [view, displayData] = result;

      // Set the rendered rows length to the virtual page size. Fill in the data provided
      // from the index start until the end index or pagination size, whichever is smaller.
      this._renderedData.length = displayData.length;

      const buffer = 20;
      let rangeStart = Math.max(0, view.start - buffer);
      let rangeEnd = Math.min(displayData.length, view.end + buffer);

      for (let i = rangeStart; i < rangeEnd; i++) {
        this._renderedData[i] = displayData[i];
      }

      return this._renderedData; // Currently ignoring the view
    });
  }

  /** Returns a copy of the display data sorted by the provided sort data. */
  sortData(sort: MdTableSortData, data: UserData[]): UserData[] {
    console.time('Sort');

    const copiedData = data.slice();
    if (!this.sort.column) { return copiedData; }

    const colToPropMap: { [key: string]: string; } = {
      'userId': 'id',
      'userName': 'name',
      'progress': 'progress',
      'color': 'color'
    };

    const sortedData = copiedData.sort((a, b) => {
      let prop = colToPropMap[sort.column];

      let valueA = isNaN(+a[prop]) ? a[prop] : +a[prop];
      let valueB = isNaN(+b[prop]) ? b[prop] : +b[prop];

      return (valueA < valueB ? -1 : 1) * (sort.order == 'ascending' ? 1 : -1);
    });

    console.timeEnd('Sort');
    return sortedData;
  }

  refreshPagination() {
    const pageIndexExceedsData = this.displayedData.length <= this.pagination.index;
    if (pageIndexExceedsData) { this.incrementPage(-1); }
  }

  incrementPage(increment: number) {
    if (this.canIncrementPage(increment)) {
      const index = this.pagination.index + this.pagination.pageLength * increment;
      this.pagination = {index, pageLength: this.pagination.pageLength};
    }
  }

  canIncrementPage(increment: number) {
    const increasedIndex = this.pagination.index + (this.pagination.pageLength * increment);
    return increasedIndex == 0 ||
        (increasedIndex >= 0 && increasedIndex < this.filteredData.length);
  }

  setPageLength(pageLength: number) {
    this.pagination = {index: 0, pageLength};
  }

  resetPagination() {
    this.pagination = {index: 0, pageLength: this.pagination.pageLength};
  }
}
