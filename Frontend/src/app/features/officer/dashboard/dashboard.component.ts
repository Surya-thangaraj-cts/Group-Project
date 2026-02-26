import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfficerService } from '../officer.service';
import { AuthService } from '../../../auth/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class OfficerDashboardComponent implements OnInit, OnDestroy {
  private officerSvc = inject(OfficerService);
  private auth = inject(AuthService);
  private destroy$ = new Subject<void>();

  accountsCount = 0;
  pendingAccountsCount = 0;
  pendingUpdateReqsCount = 0;
  totalTxnCount = 0;
  pendingRequestsCount = 0;
  recentTransactions: any[] = [];
  officerName = '';

  ngOnInit(): void {
    this.loadDashboardData();
    const user = this.auth.getCurrentUser();
    if (user) this.officerName = user.name || '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Recalculate the total pending requests count (accounts + update requests only) */
  private recalcPending(): void {
    this.pendingRequestsCount = this.pendingAccountsCount + this.pendingUpdateReqsCount;
  }

  private loadDashboardData(): void {
    // Accounts — only ACTIVE ones count as "created"
    this.officerSvc.accounts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(accounts => {
        if (!Array.isArray(accounts)) {
          this.accountsCount = 0;
          this.pendingAccountsCount = 0;
        } else {
          this.accountsCount = accounts.filter(a => a.status === 'ACTIVE').length;
          this.pendingAccountsCount = accounts.filter(a => a.status === 'PENDING').length;
        }
        this.recalcPending();
      });

    // Pending update requests from approvals API
    this.officerSvc.updateRequests$
      .pipe(takeUntil(this.destroy$))
      .subscribe(requests => {
        this.pendingUpdateReqsCount = Array.isArray(requests)
          ? requests.filter((r: any) => (r.status || '').toUpperCase() === 'PENDING').length
          : 0;
        this.recalcPending();
      });

    // All transactions
    this.officerSvc.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(transactions => {
        if (!Array.isArray(transactions)) {
          this.recentTransactions = [];
          this.totalTxnCount = 0;
          return;
        }

        const accounts = (this.officerSvc as any).accountsSubject?.value || [];
        this.totalTxnCount = transactions.length;

        this.recentTransactions = transactions.slice(0, 10).map(tx => {
          const accountId = tx.accountId || tx.toAccountId || 'N/A';
          const acc = accounts.find((a: any) => a.accountId === accountId) || null;
          return {
            id: tx.id,
            type: acc ? acc.accountType : 'UNKNOWN',
            customerName: acc ? acc.customerName : 'N/A',
            date: tx.time || new Date().toISOString(),
            accountNumber: accountId,
            amount: tx.amount,
            txnType: tx.type,
            status: tx.status || 'Completed'
          };
        });
      });
  }
}
