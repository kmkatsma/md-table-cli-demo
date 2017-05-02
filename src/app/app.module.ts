import { BrowserModule } from '@angular/platform-browser';
import { MaterialModule } from '@angular/material';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MdDataTableModule } from './material/data-table/index';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import 'hammerjs';

import { AppComponent } from './app.component';
import { DataTableDemo } from './material/data-table-demo/data-table-demo';
import { DataTableHeader } from './material/data-table-demo/data-table-header';
import { PaginationControl } from './material/data-table-demo/pagination-control';
import { PeopleDatabase } from './material/data-table-demo/people-database';

@NgModule({
  declarations: [
    AppComponent,
    DataTableDemo,
    DataTableHeader,
    PaginationControl
  ],
  imports: [
    BrowserModule,
    MaterialModule,
    FormsModule,
    HttpModule,
    MdDataTableModule,
    BrowserAnimationsModule
  ],
  providers: [
    PeopleDatabase
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
