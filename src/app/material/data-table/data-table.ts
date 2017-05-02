import {
  ViewChild,
  Component,
  Directive,
  TemplateRef,
  ContentChildren,
  ContentChild,
  QueryList,
  ViewContainerRef,
  Input,
  forwardRef,
  IterableDiffers,
  SimpleChanges,
  IterableDiffer,
  Inject,
  ViewEncapsulation,
  ElementRef,
  Renderer,
  IterableChanges,
  IterableChangeRecord, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/let';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/observable/combineLatest';
import {DataSource} from './data-source';

/** Height of each row in pixels (48 + 1px border) */
export const ROW_HEIGHT = 49;

export interface MdTableViewData {
  start: number;
  end: number;
}

@Directive({selector: '[mdColumnDef]'})
export class MdColumnDef {
  @Input('mdColumnDef') name: string;

  @ContentChild(forwardRef(() => MdCellDef)) cell: MdCellDef;
  @ContentChild(forwardRef(() => MdHeaderCellDef)) headerCell: MdHeaderCellDef;
}


@Directive({selector: '[mdRowDef]'})
export class MdRowDef {
  viewInitialized = false;

  @Input('mdRowDefColumns') columns: string[];

  private _columnsDiffer: IterableDiffer<any> = null;

  constructor(public template: TemplateRef<any>,
              @Inject(forwardRef(() => MdTable)) private table: MdTable,
              protected _differs: IterableDiffers) { }

  ngAfterViewInit() {
    this.viewInitialized = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const currentColumnsValue = changes['columns'].currentValue;

    if (!this._columnsDiffer && currentColumnsValue) {
      this._columnsDiffer = this._differs.find(currentColumnsValue).create();
    }
  }

  ngDoCheck(): void {
    if (!this.viewInitialized || !this._columnsDiffer || !this.columns) { return; }

    const changes = this._columnsDiffer.diff(this.columns);
    if (changes) {
      this.table.columnChange.next(changes);
    }
  }
}

@Component({
  selector: 'md-row',
  template: '<ng-container mdCellOutlet></ng-container>',
  host: {
    'class': 'mat-row',
    'role': 'row',
  },
})
export class MdRow { }

@Directive({
  selector: 'md-cell',
  host: {
    'class': 'mat-cell mat-column',
    'role': 'gridcell',
  },
})
export class MdCell {
  constructor(private columnDef: MdColumnDef,
              private elementRef: ElementRef,
              private renderer: Renderer) {
    this.renderer.setElementClass(elementRef.nativeElement, columnDef.name, true);
  }
}

@Directive({
  selector: 'md-header-cell',
  host: {
    'class': 'mat-header-cell mat-column',
    'role': 'columnheader',
  },
})
export class MdHeaderCell {
  constructor(private columnDef: MdColumnDef,
              private elementRef: ElementRef,
              private renderer: Renderer) {
    this.renderer.setElementClass(elementRef.nativeElement, columnDef.name, true);
  }
}

@Directive({selector: '[mdCellDef]'})
export class MdCellDef {
  constructor(public template: TemplateRef<any>) { }
}

@Directive({selector: '[mdHeaderCellDef], md-column-def'})
export class MdHeaderCellDef {
  constructor(public template: TemplateRef<any>) { }
}

@Directive({selector: '[mdCellOutlet]'})
export class MdCellOutlet {
  cells: MdCellDef[] = [];
  context: any;

  static mostRecentCellOutlet: MdCellOutlet = null;

  constructor(private _viewContainer: ViewContainerRef) {
    MdCellOutlet.mostRecentCellOutlet = this;
  }

  ngOnInit() {
    this.cells.forEach(cell => {
      this._viewContainer.createEmbeddedView(cell.template, this.context);
    });
  }
}

@Directive({selector: '[mdRowPlaceholder]'})
export class MdRowPlaceholder {
  constructor(public viewContainer: ViewContainerRef) { }
}

@Directive({selector: '[mdHeaderRowPlaceholder]'})
export class MdHeaderRowPlaceholder {
  constructor(public viewContainer: ViewContainerRef) { }
}

@Component({
  selector: 'md-table',
  styleUrls: ['./data-table.scss'],
  template: `    
    <ng-container mdHeaderRowPlaceholder></ng-container>
    <ng-container mdRowPlaceholder></ng-container>
    <ng-template #emptyRow><div class="mat-placeholder" role="row"></div></ng-template>
  `,
  host: {
    'class': 'mat-table',
    'role': 'grid'
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MdTable {
  @Input() dataSource: DataSource<any>;

  viewChange = new BehaviorSubject<MdTableViewData>({start: 0, end: 20});
  columnChange = new Subject<IterableChanges<any>>();

  private _dataDiffer: IterableDiffer<any> = null;
  private _columnMap = new Map<ConstrainDOMString,  MdColumnDef>();

  @ContentChildren(MdRowDef) rowDefinitions: QueryList<MdRowDef>;
  @ContentChildren(MdColumnDef) columnDefinitions: QueryList<MdColumnDef>;
  @ViewChild(MdRowPlaceholder) rowPlaceholder: MdRowPlaceholder;
  @ViewChild(MdHeaderRowPlaceholder) headerRowPlaceholder: MdRowPlaceholder;
  @ViewChild('emptyRow') emptyRowTemplate: TemplateRef<any>;

  constructor(private _differs: IterableDiffers,
              private _changeDetectorRef: ChangeDetectorRef,
              private elementRef: ElementRef) {
    this._dataDiffer = this._differs.find([]).create();
  }

  ngOnInit() {
    this.columnChange.asObservable().subscribe(() => {
      this.renderHeaderRow();
    });

    Observable.fromEvent(this.elementRef.nativeElement, 'scroll')
        .debounceTime(100)
        .subscribe(() => this.scrollEvent());
  }

  ngAfterContentInit() {
    this.columnDefinitions.forEach(columnDef => this._columnMap.set(columnDef.name, columnDef));
  }

  ngAfterViewInit() {
    this.renderHeaderRow();

    // For now, if the columns change then all rows need to re-render.
    this.columnChange.subscribe(() => {
      this._dataDiffer.diff([]);
      this.rowPlaceholder.viewContainer.clear();
    });

    const connectFn = this.dataSource.connectTable.bind(this.dataSource);
    Observable.combineLatest(this.viewChange.let(connectFn), this.columnChange)
        .subscribe((result: any) => {
      this.renderRowChanges(result[0]);
    });
  }

  scrollToTop() {
    this.elementRef.nativeElement.scrollTop = 0;
  }

  scrollEvent() {
    const scrollTop = this.elementRef.nativeElement.scrollTop;
    const elementHeight = this.elementRef.nativeElement.getBoundingClientRect().height;

    const topIndex = Math.floor(scrollTop / ROW_HEIGHT);

    const view = {
      start: Math.max(topIndex, 0),
      end: Math.ceil(topIndex + (elementHeight / ROW_HEIGHT))
    };

    this.viewChange.next(view);
  }

  renderRowChanges(dataRows: any[]) {
    console.time('Rendering rows');

    const changes = this._dataDiffer.diff(dataRows);
    if (!changes) { return; }

    const oldScrollTop = this.elementRef.nativeElement.scrollTop;

    changes.forEachOperation(
        (item: IterableChangeRecord<any>, adjustedPreviousIndex: number, currentIndex: number) => {
          if (item.previousIndex == null) {
            this.addRow(dataRows[currentIndex], currentIndex);
          } else if (currentIndex == null) {
            this.rowPlaceholder.viewContainer.remove(adjustedPreviousIndex);
          } else {
            const view = this.rowPlaceholder.viewContainer.get(adjustedPreviousIndex);
            this.rowPlaceholder.viewContainer.move(view, currentIndex);
          }
        });

    // Scroll changes in the process of adding/removing rows. Reset it back to where it was
    // so that it (1) it does not shift and (2) a scroll event does not get triggered which
    // would cause a loop.
    this.elementRef.nativeElement.scrollTop = oldScrollTop;

    this._changeDetectorRef.markForCheck();

    console.timeEnd('Rendering rows');
  }

  renderHeaderRow() {
    const headerRowView = this.headerRowPlaceholder.viewContainer;

    headerRowView.clear();  // Reset header row

    // Create view for the header and set the header cells outlet
    let headerRow = this.getHeaderRowDef();
    let headerCells = this.getHeaderCellTemplatesForRow(headerRow);
    const context = {headerCells};
    headerRowView.createEmbeddedView(headerRow.template, context);
    this.setLatestHeadersCellsOutlet(headerCells);
  }

  addRow(data: any, currentIndex: number) {
    if (data) {
      let row = this.getRowDefForItem(data);

      const context = {$implicit: data};
      this.rowPlaceholder.viewContainer.createEmbeddedView(row.template, context, currentIndex);

      // Set cells outlet
      let cells = this.getCellTemplatesForRow(row);
      this.setLatestRowsCellsOutlet(cells, data);
    } else {
      this.rowPlaceholder.viewContainer.createEmbeddedView(this.emptyRowTemplate, {}, currentIndex);
    }
  }


  // Hack attack! Because we're so smart, we know that immediately after calling
  // `createEmbeddedView` that the most recently constructed instance of MdCellOutlet
  // is the one inside this row, so we can set stuff to it (so that the user doesn't have to).
  // TODO: add some code to enforce that exactly one MdCellOutlet was instantiated as a result
  // of this `createEmbeddedView`.
  setLatestHeadersCellsOutlet(headerCells: MdHeaderCellDef[]) {
    let headerRowCellOutlet = MdCellOutlet.mostRecentCellOutlet;
    headerRowCellOutlet.cells = headerCells;
    headerRowCellOutlet.context = {};
  }

  // Hack attack! Because we're so smart, we know that immediately after calling
  // `createEmbeddedView` that the most recently constructed instance of MdCellOutlet
  // is the one inside this row, so we can set stuff to it (so that the user doesn't have to).
  // TODO: add some code to enforce that exactly one MdCellOutlet was instantiated as a result
  // of this `createEmbeddedView`.
  setLatestRowsCellsOutlet(cells: MdCellDef[], item: any) {
    let cellOutlet = MdCellOutlet.mostRecentCellOutlet;
    cellOutlet.cells = cells;
    cellOutlet.context = {$implicit: item};
  }

  getHeaderRowDef() {
    // proof-of-concept: only supporting one row definition
    return this.rowDefinitions.first;
  }

  getRowDefForItem(item: any) {
    // proof-of-concept: only supporting one row definition
    return this.rowDefinitions.first;
  }

  // NOTE: don't do this for every row in real life
  getCellTemplatesForRow(row: MdRowDef): MdCellDef[] {
    return row.columns ?
        row.columns.map(columnId => this._columnMap.get(columnId).cell) :
        this.columnDefinitions.map(colDef => colDef.cell);
  }

  getHeaderCellTemplatesForRow(row: MdRowDef): MdHeaderCellDef[] {
    return row.columns ?
        row.columns.map(columnId => this._columnMap.get(columnId).headerCell) :
        this.columnDefinitions.map(colDef => colDef.headerCell);
  }
}
