import { Injectable } from '@angular/core';

export type RequestType = 'AddressUpdate' | 'AccountTypeChange' | 'ProfileUpdate' | 'Other';

export interface ApprovalRequest {
  approvalId: string;
  requestType: RequestType;
  customerName: string;
  customerId: string;
  accountId?: string;
  field?: string; // e.g. 'address' or 'accountType'
  oldValue?: string;
  newValue?: string;
  requesterId: string; // officer who made the request
  requestDate: string; // ISO
  status: 'Pending' | 'Approved' | 'Rejected';
  managerComment?: string;
}

@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private storageKey = 'approvals';

  constructor() {
    this.ensureSeedData();
  }

  private ensureSeedData() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      const now = new Date();
      const seed: ApprovalRequest[] = [
        {
          approvalId: 'APR-5001',
          requestType: 'AddressUpdate',
          customerName: 'John Doe',
          customerId: 'CUST1001',
          accountId: 'ACCT2001',
          field: 'address',
          oldValue: '12 Old St, City A',
          newValue: '34 New Rd, City B',
          requesterId: 'officer123',
          requestDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          status: 'Pending'
        },
        {
          approvalId: 'APR-5002',
          requestType: 'AccountTypeChange',
          customerName: 'Alice Smith',
          customerId: 'CUST1002',
          accountId: 'ACCT2002',
          field: 'accountType',
          oldValue: 'Savings',
          newValue: 'Current',
          requesterId: 'officer456',
          requestDate: new Date(now.getTime() - 1000 * 60 * 60 * 36).toISOString(),
          status: 'Pending'
        },
        {
          approvalId: 'APR-5003',
          requestType: 'ProfileUpdate',
          customerName: 'Bob Lee',
          customerId: 'CUST1003',
          accountId: 'ACCT2003',
          field: 'phone',
          oldValue: '555-0100',
          newValue: '555-0199',
          requesterId: 'officer123',
          requestDate: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(),
          status: 'Pending'
        }
      ];
      localStorage.setItem(this.storageKey, JSON.stringify(seed));
    }
  }

  getAll(): ApprovalRequest[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) as ApprovalRequest[] : [];
  }

  getPending(): ApprovalRequest[] {
    return this.getAll().filter(a => a.status === 'Pending');
  }

  updateStatus(approvalId: string, status: 'Approved' | 'Rejected', managerComment?: string) {
    const arr = this.getAll();
    const idx = arr.findIndex(a => a.approvalId === approvalId);
    if (idx === -1) return false;
    arr[idx].status = status;
    arr[idx].managerComment = managerComment || '';
    localStorage.setItem(this.storageKey, JSON.stringify(arr));
    return true;
  }

  add(request: ApprovalRequest) {
    const arr = this.getAll();
    arr.unshift(request);
    localStorage.setItem(this.storageKey, JSON.stringify(arr));
  }
}
