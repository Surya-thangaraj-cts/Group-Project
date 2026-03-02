import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription, of, forkJoin } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { ManagerService } from './manager.service';
import { NotificationDto, ApprovalDetailsDto } from './manager-dtos';

export interface ManagerNotification extends NotificationDto {
  _fromApproval?: boolean;
  _approvalType?: string;
  _customerName?: string;
  _accountId?: string | null;
  _pendingChanges?: string;
}

@Injectable({ providedIn: 'root' })
export class ManagerNotificationService implements OnDestroy {
  private notificationsSubject = new BehaviorSubject<ManagerNotification[]>([]);
  private pollSub?: Subscription;
  private readonly POLL_INTERVAL = 10_000;
  private dismissedApprovalIds = new Set<string>();
  private readApprovalIds = new Set<string>();

  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$: Observable<number> = this.notificationsSubject.pipe(
    map(list => list.filter(n => n.status === 0).length)
  );

  constructor(private managerService: ManagerService) {
    this.loadDismissedIds();
    this.loadReadIds();
    this.loadAll();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  loadAll(): void {
    forkJoin({
      notifications: this.managerService.getNotifications().pipe(catchError(() => of([]))),
      pendingApprovals: this.managerService.getApprovalDetails(1, 100, 'Pending').pipe(
        catchError(() => of({ items: [] as ApprovalDetailsDto[], totalCount: 0, totalPages: 0, pageNumber: 1, pageSize: 100 }))
      ),
      approvedApprovals: this.managerService.getApprovalDetails(1, 20, 'Approve').pipe(
        catchError(() => of({ items: [] as ApprovalDetailsDto[], totalCount: 0, totalPages: 0, pageNumber: 1, pageSize: 20 }))
      ),
      rejectedApprovals: this.managerService.getApprovalDetails(1, 20, 'Reject').pipe(
        catchError(() => of({ items: [] as ApprovalDetailsDto[], totalCount: 0, totalPages: 0, pageNumber: 1, pageSize: 20 }))
      )
    }).subscribe(({ notifications, pendingApprovals, approvedApprovals, rejectedApprovals }) => {
      const allApprovals = [
        ...(pendingApprovals.items || []),
        ...(approvedApprovals.items || []),
        ...(rejectedApprovals.items || [])
      ];
      this.mergeAndPublish(notifications || [], allApprovals);
    });
  }

  private mergeAndPublish(backendNotifs: NotificationDto[], allApprovals: ApprovalDetailsDto[]): void {
    const coveredApprovalIds = new Set<string>(
      backendNotifs.filter(n => n.approvalId).map(n => n.approvalId!)
    );

    const synthetic: ManagerNotification[] = allApprovals
      .filter(a => !coveredApprovalIds.has(a.approvalId) && !this.dismissedApprovalIds.has(a.approvalId))
      .map(a => {
        const notif = this.approvalToNotification(a);
        if (this.readApprovalIds.has(a.approvalId)) notif.status = 1;
        return notif;
      });

    const real: ManagerNotification[] = backendNotifs.map(n => ({ ...n, _fromApproval: false }));

    const merged = [...real, ...synthetic].sort(
      (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );
    this.notificationsSubject.next(merged);
  }

  private approvalToNotification(a: ApprovalDetailsDto): ManagerNotification {
    let message = '';
    let typeNum = 1;
    let parsedChanges: Record<string, any> | null = null;

    if (a.pendingChanges) {
      try { parsedChanges = JSON.parse(a.pendingChanges); } catch {}
    }

    const customerName = a.customerName
      || parsedChanges?.['CustomerName']
      || parsedChanges?.['customerName']
      || '';

    const accountTypeLabel = this.mapAccountType(
      parsedChanges?.['AccountType'] ?? parsedChanges?.['accountType']
    );

    const isDecided = a.decision === 'Approve' || a.decision === 'Reject';
    const decisionLabel = a.decision === 'Approve' ? 'Approved' : a.decision === 'Reject' ? 'Rejected' : '';
    const decisionEmoji = a.decision === 'Approve' ? '✅' : a.decision === 'Reject' ? '❌' : '';

    if (a.type === 'AccountCreation') {
      if (isDecided) {
        message = `${decisionEmoji} Account creation request ${decisionLabel.toLowerCase()}`;
        if (customerName) message += ` for ${customerName}`;
      } else {
        message = customerName ? `New account request from ${customerName}` : 'New account creation request';
      }
      if (accountTypeLabel) message += ` • ${accountTypeLabel}`;
      typeNum = 0;
    } else if (a.type === 'AccountUpdate') {
      if (isDecided) {
        message = `${decisionEmoji} Account update request ${decisionLabel.toLowerCase()}`;
        if (customerName) message += ` for ${customerName}`;
        else if (a.accountId) message += ` • Account ${a.accountId}`;
      } else {
        message = customerName ? `Account update request from ${customerName}` : 'Account update request';
        if (a.accountId) message += ` • Account ${a.accountId}`;
      }
      typeNum = 0;
    } else if (a.type === 'Transaction') {
      if (isDecided) {
        message = `${decisionEmoji} Transaction ${decisionLabel.toLowerCase()}`;
        if (a.accountId) message += ` • Account ${a.accountId}`;
      } else {
        message = 'Transaction pending approval';
        if (a.accountId) message += ` • Account ${a.accountId}`;
      }
      typeNum = 2;
    } else {
      message = isDecided
        ? `${decisionEmoji} ${a.type || 'Request'} ${decisionLabel.toLowerCase()}`
        : `Pending approval: ${a.type || 'Unknown'}`;
    }

    return {
      notificationId: `approval_${a.approvalId}`,
      userId: a.reviewerId || '',
      type: typeNum,
      message,
      status: 0,
      createdDate: a.approvalDate || new Date().toISOString(),
      approvalId: a.approvalId,
      transactionId: null,
      _fromApproval: true,
      _approvalType: a.type,
      _customerName: customerName || undefined,
      _accountId: a.accountId ?? undefined,
      _pendingChanges: parsedChanges ? this.formatChangesForDisplay(parsedChanges) : (a.pendingChanges ?? undefined)
    };
  }

  private mapAccountType(val: any): string {
    if (val === null || val === undefined) return '';
    switch (Number(val)) {
      case 0: return 'Savings Account';
      case 1: return 'Current Account';
      case 2: return 'Fixed Deposit';
      case 3: return 'Recurring Deposit';
      default: return `Account Type ${val}`;
    }
  }

  private mapStatus(val: any): string {
    if (val === null || val === undefined) return '';
    switch (Number(val)) {
      case 0: return 'Pending';
      case 1: return 'Active';
      case 2: return 'Inactive';
      case 3: return 'Closed';
      default: return `Status ${val}`;
    }
  }

  private formatChangesForDisplay(obj: Record<string, any>): string {
    const labelMap: Record<string, string> = {
      CustomerName: 'Customer Name', customerName: 'Customer Name',
      CustomerId: 'Customer ID', customerId: 'Customer ID',
      AccountType: 'Account Type', accountType: 'Account Type',
      Status: 'Status', status: 'Status',
      Balance: 'Balance', balance: 'Balance',
      AccountId: 'Account ID', accountId: 'Account ID'
    };

    return Object.entries(obj)
      .map(([key, val]) => {
        const label = labelMap[key] || key;
        let displayVal = val;
        if ((key === 'AccountType' || key === 'accountType') && typeof val === 'number')
          displayVal = this.mapAccountType(val);
        else if ((key === 'Status' || key === 'status') && typeof val === 'number')
          displayVal = this.mapStatus(val);
        else if ((key === 'Balance' || key === 'balance') && typeof val === 'number')
          displayVal = '₹' + val.toLocaleString('en-IN');
        return `${label}: ${displayVal}`;
      })
      .join('\n');
  }

  private startPolling(): void {
    this.pollSub = interval(this.POLL_INTERVAL).pipe(
      switchMap(() =>
        forkJoin({
          notifications: this.managerService.getNotifications().pipe(catchError(() => of([]))),
          pendingApprovals: this.managerService.getApprovalDetails(1, 100, 'Pending').pipe(
            catchError(() => of({ items: [] as ApprovalDetailsDto[], totalCount: 0, totalPages: 0, pageNumber: 1, pageSize: 100 }))
          ),
          approvedApprovals: this.managerService.getApprovalDetails(1, 20, 'Approve').pipe(
            catchError(() => of({ items: [] as ApprovalDetailsDto[], totalCount: 0, totalPages: 0, pageNumber: 1, pageSize: 20 }))
          ),
          rejectedApprovals: this.managerService.getApprovalDetails(1, 20, 'Reject').pipe(
            catchError(() => of({ items: [] as ApprovalDetailsDto[], totalCount: 0, totalPages: 0, pageNumber: 1, pageSize: 20 }))
          )
        })
      )
    ).subscribe(({ notifications, pendingApprovals, approvedApprovals, rejectedApprovals }) => {
      const allApprovals = [
        ...(pendingApprovals.items || []),
        ...(approvedApprovals.items || []),
        ...(rejectedApprovals.items || [])
      ];
      this.mergeAndPublish(notifications || [], allApprovals);
    });
  }

  markAsRead(notification: ManagerNotification): void {
    const current = this.notificationsSubject.value.map(n =>
      n.notificationId === notification.notificationId ? { ...n, status: 1 } : n
    );
    this.notificationsSubject.next(current);

    if (notification._fromApproval) {
      if (notification.approvalId) {
        this.readApprovalIds.add(notification.approvalId);
        this.saveReadIds();
      }
    } else {
      this.managerService.markNotificationAsRead(notification.notificationId)
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }

  markAllAsRead(): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next(current.map(n => ({ ...n, status: 1 })));

    let syntheticChanged = false;
    current.filter(n => n.status === 0 && n._fromApproval && n.approvalId).forEach(n => {
      this.readApprovalIds.add(n.approvalId!);
      syntheticChanged = true;
    });
    if (syntheticChanged) this.saveReadIds();

    current.filter(n => n.status === 0 && !n._fromApproval).forEach(n => {
      this.managerService.markNotificationAsRead(n.notificationId)
        .pipe(catchError(() => of(null)))
        .subscribe();
    });
  }

  deleteNotification(notification: ManagerNotification): void {
    this.notificationsSubject.next(
      this.notificationsSubject.value.filter(n => n.notificationId !== notification.notificationId)
    );

    if (notification._fromApproval && notification.approvalId) {
      this.dismissedApprovalIds.add(notification.approvalId);
      this.saveDismissedIds();
      this.readApprovalIds.delete(notification.approvalId);
      this.saveReadIds();
    } else {
      this.managerService.deleteNotification(notification.notificationId)
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }

  clearAll(): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([]);

    current.forEach(n => {
      if (n._fromApproval && n.approvalId) {
        this.dismissedApprovalIds.add(n.approvalId);
        this.readApprovalIds.delete(n.approvalId);
      } else {
        this.managerService.deleteNotification(n.notificationId)
          .pipe(catchError(() => of(null)))
          .subscribe();
      }
    });
    this.saveDismissedIds();
    this.saveReadIds();
  }

  refresh(): void {
    this.loadAll();
  }

  private loadDismissedIds(): void {
    try {
      const stored = localStorage.getItem('manager_dismissed_approval_notifs');
      if (stored) (JSON.parse(stored) as string[]).forEach(id => this.dismissedApprovalIds.add(id));
    } catch {}
  }

  private saveDismissedIds(): void {
    try { localStorage.setItem('manager_dismissed_approval_notifs', JSON.stringify([...this.dismissedApprovalIds])); } catch {}
  }

  private loadReadIds(): void {
    try {
      const stored = localStorage.getItem('manager_read_approval_notifs');
      if (stored) (JSON.parse(stored) as string[]).forEach(id => this.readApprovalIds.add(id));
    } catch {}
  }

  private saveReadIds(): void {
    try { localStorage.setItem('manager_read_approval_notifs', JSON.stringify([...this.readApprovalIds])); } catch {}
  }
}
