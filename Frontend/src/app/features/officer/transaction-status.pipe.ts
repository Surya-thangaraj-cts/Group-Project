import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'transactionStatus'
})
export class TransactionStatusPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return 'Completed';
    if (typeof value === 'string' && !isNaN(Number(value))) {
      value = Number(value);
    }
    switch (value) {
      case 0:
        return 'Completed';
      case 1:
        return 'Pending';
      case 2:
        return 'Rejected';
      case 'Completed':
      case 'Pending':
      case 'Rejected':
        return value;
      default:
        return 'Completed';
    }
  }
}
