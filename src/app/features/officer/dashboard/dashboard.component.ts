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
  pendingRequestsCount = 0;
  recentTransactions: any[] = [];
  officerName = '';

  ngOnInit(): void {
    this.loadDashboardData();
    // populate officer name from auth context
    const user = this.auth.getCurrentUser();
    if (user) this.officerName = user.name || '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    // Get accounts count
    this.officerSvc.accounts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(accounts => {
        this.accountsCount = Array.isArray(accounts) ? accounts.length : 0;
      });

    // Get pending update requests count
    this.officerSvc.updateRequests$
      .pipe(takeUntil(this.destroy$))
      .subscribe(requests => {
        if (Array.isArray(requests)) {
          // updateRequests use uppercase 'PENDING' internally
          this.pendingRequestsCount = requests.filter((req: any) => (req.status || '').toUpperCase() === 'PENDING').length;
        }
      });

    // Get recent transactions (last 4)
    this.officerSvc.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(transactions => {
        if (!Array.isArray(transactions)) {
          this.recentTransactions = [];
          return;
        }

        // Combine with latest accounts snapshot to present friendly rows
        const accounts = (this.officerSvc as any).accountsSubject?.value || [];

        const mapped = transactions.slice(0, 4).map(tx => {
          const accountId = tx.accountId || tx.toAccountId || 'N/A';
          const acc = accounts.find((a: any) => a.accountId === accountId) || null;
          const customerName = acc ? acc.customerName : 'N/A';
          const accountNumber = accountId;
          const date = tx.time || new Date().toISOString();
          // Get account type (CURRENT or SAVINGS) instead of transaction type
          const accountType = acc ? acc.accountType : 'UNKNOWN';
          return {
            id: tx.id,
            type: accountType,
            customerName,
            date,
            accountNumber,
            narrative: tx.narrative || ''
          };
        });

        this.recentTransactions = mapped;
        
      });

    // Get officer name from notifications or use default
    // this.officerSvc.notifications$
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(() => {
    //     // Officer name would be available from auth context if needed
    //     // For now, using a placeholder that can be populated from user context
    //   });
  }
}
