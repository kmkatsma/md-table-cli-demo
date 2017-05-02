import {MdError} from '@angular/material';

/**
 * Exception thrown when a tooltip has an invalid position.
 * @docs-private
 */
export class MdTableInvalidDataSourceError extends MdError {
  constructor() {
    super('MdDataTable: No dataSource provided.');
  }
}