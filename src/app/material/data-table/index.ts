import {CommonModule} from '@angular/common';
import {NgModule, ModuleWithProviders} from '@angular/core';
import {
  MdCell,
  MdHeaderCell,
  MdRow,
  MdHeaderRowPlaceholder,
  MdRowPlaceholder,
  MdColumnDef,
  MdHeaderCellDef,
  MdCellOutlet,
  MdCellDef,
  MdRowDef,
  MdTable,
} from './data-table';
import {MdSortable} from './sortable';

export * from './data-source';
export * from './data-table';
export * from './data-table-errors';
export * from './sortable';

@NgModule({
  imports: [CommonModule],
  exports: [
      MdTable, MdRowDef, MdCellDef, MdCellOutlet, MdHeaderCellDef,
      MdColumnDef, MdCell, MdRow, MdHeaderCell, MdSortable],
  declarations: [
      MdTable, MdRowDef, MdCellDef, MdCellOutlet, MdHeaderCellDef,
      MdColumnDef, MdCell, MdRow, MdHeaderCell, MdSortable,
      MdRowPlaceholder, MdHeaderRowPlaceholder,
  ]

})
export class MdDataTableModule {
  /** @deprecated */
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: MdDataTableModule,
    };
  }
}