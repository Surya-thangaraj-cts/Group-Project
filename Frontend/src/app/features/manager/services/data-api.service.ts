import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { TransactionApiService } from '../../../core/services/transaction-api.service';
import { ApprovalApiService } from '../../../core/services/approval-api.service';
import { ManagerApiService } from '../../../core/services/manager-api.service';
import { NotificationApiService } from '../../../core/services/notification-api.service';

// Keep existing interfaces for backward compatibility
export interface Transaction {
  id: string;
  accountId: string;
  user: string;
  date: Date;
  amount: number;
  status: 'Approved' | 'Pending' | 'Rejected';
  type: 'Deposit' | 'Withdrawal' | 'Transfer';
  recipientName?: string;
  recipientAmount?: number;
}

export interface Report {
  reportId: string;
  scope: 'Branch' | 'AccountType' | 'Period';
  metrics: {
    totalTransactions: number;
    highValueCount: number;
    accountGrowthRate: number;
  };
  generatedDate: Date;
}

export interface Notification {
  notificationId: string;
  userId: string;
  type: 'ApprovalReminder' | 'SuspiciousActivity';
  message: string;
  status: 'Unread' | 'Read';
  createdDate: Date;
}

export interface Approval {
  approvalId: string;
  transactionId: string;
  reviewerId: string;
  decision: 'Pending' | 'Approved' | 'Rejected';
  comments: string;
  approvalDate: Date;
}

export interface DataChangeApproval {
  changeId: string;
  accountId: string;
  changeType: 'Name' | 'Address' | 'Email' | 'Phone' | 'Other';
  oldValue: string;
  newValue: string;
  requestedBy: string;
  decision: 'Pending' | 'Approved' | 'Rejected';
  comments: string;
  requestDate: Date;
  decisionDate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private transactionApi = inject(TransactionApiService);
  private approvalApi = inject(ApprovalApiService);
  private managerApi = inject(ManagerApiService);
  private notificationApi = inject(NotificationApiService);

  // State streams
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private approvalsSubject = new BehaviorSubject<Approval[]>([]);
  private dataChangeApprovalsSubject = new BehaviorSubject<DataChangeApproval[]>([]);
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private dashboardStatsSubject = new BehaviorSubject<any>({
    totalUsers: 0,
    totalExpenditure: 0,
    totalTransactions: 0,
    pendingApprovals: 0
  });

  constructor() {
    this.loadInitialData();
  }

  /**
   * Load all data from backend API
   */
  private loadInitialData(): void {
    this.loadTransactions();
    this.loadApprovals();
    this.loadNotifications();
    this.loadDashboardStats();
  }

  /**
   * Load transactions from API
   */
  private loadTransactions(): void {
    this.transactionApi.getTransactions(1, 150).pipe(
      map(pagedResult => this.mapTransactionsFromApi(pagedResult.items)),
      catchError(error => {
        console.error('Error loading transactions:', error);
        return of([]);
      })
    ).subscribe(transactions => {
      this.transactionsSubject.next(transactions);
    });
  }

  /**
   * Load approvals from API
   */
  private loadApprovals(): void {
    this.approvalApi.getApprovalDetails(1, 100).pipe(
      map(pagedResult => ({
        transactions: this.mapApprovalsFromApi(pagedResult.items.filter(a => a.type === 'HighValueTransaction')),
        dataChanges: this.mapDataChangeApprovalsFromApi(pagedResult.items.filter(a => a.type === 'AccountUpdate'))
      })),
      catchError(error => {
        console.error('Error loading approvals:', error);
        return of({ transactions: [], dataChanges: [] });
      })
    ).subscribe(result => {
      this.approvalsSubject.next(result.transactions);
      this.dataChangeApprovalsSubject.next(result.dataChanges);
    });
  }

  /**
   * Load notifications from API
   */
  private loadNotifications(): void {
    this.notificationApi.getNotifications().pipe(
      map(apiNotifications => this.mapNotificationsFromApi(apiNotifications)),
      catchError(error => {
        console.error('Error loading notifications:', error);
        return of([]);
      })
    ).subscribe(notifications => {
      this.notificationsSubject.next(notifications);
    });
  }

  /**
   * Load dashboard stats from API
   */
  private loadDashboardStats(): void {
    this.managerApi.getDashboard().pipe(
      map(dashboard => ({
        totalUsers: 1284, // Static for now
        totalExpenditure: 125840, // Static for now
        totalTransactions: 8924, // Static for now
        pendingApprovals: dashboard.pendingApprovals || 0
      })),
      catchError(error => {
        console.error('Error loading dashboard stats:', error);
        return of({
          totalUsers: 0,
          totalExpenditure: 0,
          totalTransactions: 0,
          pendingApprovals: 0
        });
      })
    ).subscribe(stats => {
      this.dashboardStatsSubject.next(stats);
    });
  }

  // ========== Mapping Functions ==========

  private mapTransactionsFromApi(apiTransactions: any[]): Transaction[] {
    return apiTransactions.map(apiTxn => ({
      id: apiTxn.transactionId?.toString() || '',
      accountId: apiTxn.accountId?.toString() || '',
      user: apiTxn.customerName || 'Unknown',
      date: new Date(apiTxn.date || Date.now()),
      amount: apiTxn.amount || 0,
      status: this.mapStatus(apiTxn.status),
      type: this.mapTransactionType(apiTxn.type),
      recipientName: apiTxn.customerName,
      recipientAmount: apiTxn.amount
    }));
  }

  private mapApprovalsFromApi(apiApprovals: any[]): Approval[] {
    return apiApprovals.map(apiAppr => ({
      approvalId: apiAppr.approvalId?.toString() || '',
      transactionId: apiAppr.transactionId?.toString() || '',
      reviewerId: apiAppr.reviewerId?.toString() || '',
      decision: this.mapDecision(apiAppr.decision),
      comments: apiAppr.comments || '',
      approvalDate: new Date(apiAppr.approvalDate || Date.now())
    }));
  }

  private mapDataChangeApprovalsFromApi(apiApprovals: any[]): DataChangeApproval[] {
    return apiApprovals.map(apiAppr => ({
      changeId: apiAppr.approvalId?.toString() || '',
      accountId: apiAppr.accountId?.toString() || '',
      changeType: this.extractChangeType(apiAppr.pendingChanges),
      oldValue: '',
      newValue: apiAppr.pendingChanges || '',
      requestedBy: apiAppr.reviewerId?.toString() || '',
      decision: this.mapDecision(apiAppr.decision),
      comments: apiAppr.comments || '',
      requestDate: new Date(apiAppr.approvalDate || Date.now()),
      decisionDate: new Date(apiAppr.approvalDate || Date.now())
    }));
  }

  private mapNotificationsFromApi(apiNotifications: any[]): Notification[] {
    return apiNotifications.map(apiNot => ({
      notificationId: apiNot.notificationId?.toString() || '',
      userId: apiNot.userId?.toString() || '',
      type: apiNot.type === 0 ? 'ApprovalReminder' : 'SuspiciousActivity',
      message: apiNot.message || '',
      status: apiNot.status === 1 ? 'Read' : 'Unread',
      createdDate: new Date(apiNot.createdDate || Date.now())
    }));
  }

  private mapStatus(status: string): 'Approved' | 'Pending' | 'Rejected' {
    if (status === 'Completed') return 'Approved';
    if (status === 'Pending') return 'Pending';
    if (status === 'Rejected') return 'Rejected';
    return 'Pending';
  }

  private mapDecision(decision: string): 'Pending' | 'Approved' | 'Rejected' {
    if (decision === 'Approve') return 'Approved';
    if (decision === 'Reject') return 'Rejected';
    return 'Pending';
  }

  private mapTransactionType(type: string): 'Deposit' | 'Withdrawal' | 'Transfer' {
    if (type === 'Deposit') return 'Deposit';
    if (type === 'Withdrawal') return 'Withdrawal';
    if (type === 'Transfer') return 'Transfer';
    return 'Deposit';
  }

  private extractChangeType(changes: string): 'Name' | 'Address' | 'Email' | 'Phone' | 'Other' {
    if (!changes) return 'Other';
    if (changes.toLowerCase().includes('name')) return 'Name';
    if (changes.toLowerCase().includes('address')) return 'Address';
    if (changes.toLowerCase().includes('email')) return 'Email';
    if (changes.toLowerCase().includes('phone')) return 'Phone';
    return 'Other';
  }

  // ========== Public API Methods ==========

  getTransactions(): Observable<Transaction[]> {
    return this.transactionsSubject.asObservable();
  }

  getApprovals(): Observable<Approval[]> {
    return this.approvalsSubject.asObservable();
  }

  getDataChangeApprovals(): Observable<DataChangeApproval[]> {
    return this.dataChangeApprovalsSubject.asObservable();
  }

  getNotifications(): Observable<Notification[]> {
    return this.notificationsSubject.asObservable();
  }

  getUnreadNotificationsCount(): Observable<number> {
    return this.notificationsSubject.pipe(
      map(notifications => notifications.filter(n => n.status === 'Unread').length)
    );
  }

  getDashboardStats(): Observable<any> {
    return this.dashboardStatsSubject.asObservable();
  }

  /**
   * Update approval decision
   */
  updateApprovalDecision(approvalId: string, decision: 'Approved' | 'Rejected', comments: string): Observable<any> {
    const apiDecision = decision === 'Approved' ? 1 : 2; // 1 = Approve, 2 = Reject
    return this.approvalApi.updateApprovalDecision(parseInt(approvalId), {
      decision: apiDecision,
      comments: comments
    }).pipe(
      tap(() => {
        // Refresh approvals after update
        this.loadApprovals();
        this.loadNotifications();
      }),
      catchError(error => {
        console.error('Error updating approval:', error);
        return of(null);
      })
    );
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): void {
    this.notificationApi.markAsRead(parseInt(notificationId)).pipe(
      tap(() => this.loadNotifications()),
      catchError(error => {
        console.error('Error marking notification as read:', error);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Get transaction by ID
   */
  getTransactionById(id: string): Transaction | undefined {
    return this.transactionsSubject.value.find(t => t.id === id);
  }

  /**
   * Get approval by transaction ID
   */
  getApprovalByTransactionId(transactionId: string): Approval | undefined {
    return this.approvalsSubject.value.find(a => a.transactionId === transactionId);
  }

  /**
   * Get data change approval by change ID
   */
  getDataChangeApprovalByChangeId(changeId: string): DataChangeApproval | undefined {
    return this.dataChangeApprovalsSubject.value.find(d => d.changeId === changeId);
  }

  /**
   * Extract notification details from message
   */
  extractNotificationDetailsFromMessage(message: string): { type: string; value: string } {
    if (message.includes('Transaction')) {
      const match = message.match(/TXN\d+/);
      return { type: 'transaction', value: match ? match[0] : '' };
    } else if (message.includes('change request')) {
      const match = message.match(/DCH\d+/);
      return { type: 'datachange', value: match ? match[0] : '' };
    }
    return { type: 'suspicious', value: '' };
  }

  // ========== Mock Data Methods (For Components That Still Need Them) ==========

  getMonthlyData(): Observable<any[]> {
    return of([
      { month: 'Jan', expenditure: 15000, approvals: 120 },
      { month: 'Feb', expenditure: 18500, approvals: 145 },
      { month: 'Mar', expenditure: 22000, approvals: 168 },
      { month: 'Apr', expenditure: 19800, approvals: 152 },
      { month: 'May', expenditure: 25400, approvals: 185 },
      { month: 'Jun', expenditure: 24100, approvals: 172 }
    ]);
  }

  getAccountGrowthTrends(): Observable<any[]> {
    return of([
      { month: 'Jan', newAccounts: 45, activeAccounts: 520 },
      { month: 'Feb', newAccounts: 62, activeAccounts: 582 },
      { month: 'Mar', newAccounts: 58, activeAccounts: 640 },
      { month: 'Apr', newAccounts: 71, activeAccounts: 711 },
      { month: 'May', newAccounts: 85, activeAccounts: 796 },
      { month: 'Jun', newAccounts: 93, activeAccounts: 889 },
      { month: 'Jul', newAccounts: 102, activeAccounts: 990 },
      { month: 'Aug', newAccounts: 120, activeAccounts: 1110 },
      { month: 'Sep', newAccounts: 98, activeAccounts: 1208 },
      { month: 'Oct', newAccounts: 110, activeAccounts: 1318 },
      { month: 'Nov', newAccounts: 125, activeAccounts: 1443 },
      { month: 'Dec', newAccounts: 140, activeAccounts: 1583 }
    ]);
  }

  getReports(): Observable<Report[]> {
    return of([
      {
        reportId: 'RPT001',
        scope: 'Period',
        metrics: { totalTransactions: 8924, highValueCount: 1464, accountGrowthRate: 12.5 },
        generatedDate: new Date('2025-12-20')
      },
      {
        reportId: 'RPT002',
        scope: 'Branch',
        metrics: { totalTransactions: 4562, highValueCount: 742, accountGrowthRate: 15.2 },
        generatedDate: new Date('2025-12-19')
      }
    ]);
  }
}
