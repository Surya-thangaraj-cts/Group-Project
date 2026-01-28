import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
    accountGrowthRate: number; // percentage
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
  private dashboardStats = {
    totalUsers: 1284,
    totalExpenditure: 125840,
    totalTransactions: 8924,
    pendingApprovals: 42
  };

  private transactions: Transaction[] = [
    // High-value transactions (> ₹100,000)
    { id: 'TXN001', accountId: 'ACC1001', user: 'John Smith', date: new Date('2025-12-25'), amount: 125000, status: 'Approved', type: 'Deposit', recipientName: 'N/A', recipientAmount: 125000 },
    { id: 'TXN002', accountId: 'ACC1002', user: 'Sarah Johnson', date: new Date('2025-12-24'), amount: 150000, status: 'Pending', type: 'Withdrawal', recipientName: 'Bank Account', recipientAmount: 150000 },
    { id: 'TXN003', accountId: 'ACC1003', user: 'Mike Davis', date: new Date('2025-12-23'), amount: 200000, status: 'Approved', type: 'Transfer', recipientName: 'ACC2005 - Michael Chen', recipientAmount: 200000 },
    { id: 'TXN004', accountId: 'ACC1004', user: 'Emily Brown', date: new Date('2025-12-22'), amount: 175000, status: 'Rejected', type: 'Withdrawal', recipientName: 'External Bank', recipientAmount: 175000 },
    { id: 'TXN005', accountId: 'ACC1005', user: 'James Wilson', date: new Date('2025-12-21'), amount: 225000, status: 'Approved', type: 'Deposit', recipientName: 'N/A', recipientAmount: 225000 },
    { id: 'TXN006', accountId: 'ACC1006', user: 'Lisa Anderson', date: new Date('2025-12-20'), amount: 180000, status: 'Pending', type: 'Transfer', recipientName: 'ACC3001 - Finance Dept', recipientAmount: 180000 },
    { id: 'TXN007', accountId: 'ACC1007', user: 'Robert Taylor', date: new Date('2025-12-19'), amount: 210000, status: 'Approved', type: 'Deposit', recipientName: 'N/A', recipientAmount: 210000 },
    { id: 'TXN008', accountId: 'ACC1008', user: 'Jennifer Lee', date: new Date('2025-12-18'), amount: 160000, status: 'Approved', type: 'Withdrawal', recipientName: 'Savings Account', recipientAmount: 160000 },
    { id: 'TXN009', accountId: 'ACC1009', user: 'David Martinez', date: new Date('2025-12-17'), amount: 190000, status: 'Pending', type: 'Transfer', recipientName: 'ACC2008 - Operations Team', recipientAmount: 190000 },
    { id: 'TXN010', accountId: 'ACC1010', user: 'Amanda Clark', date: new Date('2025-12-16'), amount: 205000, status: 'Approved', type: 'Deposit', recipientName: 'N/A', recipientAmount: 205000 },
    { id: 'TXN011', accountId: 'ACC1011', user: 'Thomas Brown', date: new Date('2025-12-15'), amount: 145000, status: 'Pending', type: 'Transfer', recipientName: 'ACC2010 - Sales Team', recipientAmount: 145000 },
    { id: 'TXN012', accountId: 'ACC1012', user: 'Rachel White', date: new Date('2025-12-14'), amount: 185000, status: 'Approved', type: 'Deposit', recipientName: 'N/A', recipientAmount: 185000 },
    // Regular transactions (≤ ₹100,000)
    { id: 'TXN013', accountId: 'ACC2001', user: 'Kevin Martin', date: new Date('2025-12-13'), amount: 75000, status: 'Approved', type: 'Deposit', recipientName: 'N/A', recipientAmount: 75000 },
    { id: 'TXN014', accountId: 'ACC2002', user: 'Patricia Garcia', date: new Date('2025-12-12'), amount: 85000, status: 'Approved', type: 'Transfer', recipientName: 'ACC3005 - HR Dept', recipientAmount: 85000 },
    { id: 'TXN015', accountId: 'ACC2003', user: 'Steven Rodriguez', date: new Date('2025-12-11'), amount: 65000, status: 'Approved', type: 'Withdrawal', recipientName: 'Savings Account', recipientAmount: 65000 },
    { id: 'TXN016', accountId: 'ACC2004', user: 'Donna Lewis', date: new Date('2025-12-10'), amount: 95000, status: 'Pending', type: 'Deposit', recipientName: 'N/A', recipientAmount: 95000 },
    { id: 'TXN017', accountId: 'ACC2005', user: 'Michael Chen', date: new Date('2025-12-09'), amount: 48000, status: 'Approved', type: 'Transfer', recipientName: 'ACC3010 - IT Dept', recipientAmount: 48000 },
    { id: 'TXN018', accountId: 'ACC2006', user: 'Karen White', date: new Date('2025-12-08'), amount: 38000, status: 'Approved', type: 'Withdrawal', recipientName: 'External Bank', recipientAmount: 38000 },
    { id: 'TXN019', accountId: 'ACC2007', user: 'Christopher Hall', date: new Date('2025-12-07'), amount: 72000, status: 'Approved', type: 'Deposit', recipientName: 'N/A', recipientAmount: 72000 },
    { id: 'TXN020', accountId: 'ACC2008', user: 'Betty Allen', date: new Date('2025-12-06'), amount: 88000, status: 'Rejected', type: 'Transfer', recipientName: 'ACC3015 - Marketing', recipientAmount: 88000 },
    { id: 'TXN021', accountId: 'ACC2009', user: 'Daniel Young', date: new Date('2025-12-05'), amount: 55000, status: 'Approved', type: 'Withdrawal', recipientName: 'Personal Account', recipientAmount: 55000 },
    { id: 'TXN022', accountId: 'ACC2010', user: 'Sandra Hernandez', date: new Date('2025-12-04'), amount: 92000, status: 'Approved', type: 'Deposit', recipientName: 'N/A', recipientAmount: 92000 },
    { id: 'TXN023', accountId: 'ACC2011', user: 'Paul King', date: new Date('2025-12-03'), amount: 45000, status: 'Pending', type: 'Transfer', recipientName: 'ACC3020 - Sales', recipientAmount: 45000 },
    { id: 'TXN024', accountId: 'ACC2012', user: 'Margaret Wright', date: new Date('2025-12-02'), amount: 78000, status: 'Approved', type: 'Withdrawal', recipientName: 'Savings Account', recipientAmount: 78000 },
    { id: 'TXN025', accountId: 'ACC2013', user: 'Charles Anderson', date: new Date('2025-12-01'), amount: 52000, status: 'Approved', type: 'Deposit', recipientName: 'N/A', recipientAmount: 52000 }
  ];

  private monthlyData = [
    { month: 'Jan', expenditure: 15000, approvals: 120 },
    { month: 'Feb', expenditure: 18500, approvals: 145 },
    { month: 'Mar', expenditure: 22000, approvals: 168 },
    { month: 'Apr', expenditure: 19800, approvals: 152 },
    { month: 'May', expenditure: 25400, approvals: 185 },
    { month: 'Jun', expenditure: 24100, approvals: 172 }
  ];

  private categoryData = [
    { name: 'Operations', value: 35000 },
    { name: 'Marketing', value: 28000 },
    { name: 'IT', value: 32000 },
    { name: 'HR', value: 18000 },
    { name: 'Sales', value: 12840 }
  ];

  // 12-month account growth trends (Jan - Dec)
  private accountGrowthTrends = [
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
  ];

  // Monthly transaction volumes (Jan - Dec) used for bar chart
  private monthlyTransactionVolumes = [
    { month: 'Jan', volume: 1200 },
    { month: 'Feb', volume: 1350 },
    { month: 'Mar', volume: 1600 },
    { month: 'Apr', volume: 1500 },
    { month: 'May', volume: 1750 },
    { month: 'Jun', volume: 1820 },
    { month: 'Jul', volume: 1950 },
    { month: 'Aug', volume: 2100 },
    { month: 'Sep', volume: 2025 },
    { month: 'Oct', volume: 2200 },
    { month: 'Nov', volume: 2350 },
    { month: 'Dec', volume: 2500 }
  ];

  // Keep legacy transaction volume analysis by brackets for reports
  private transactionVolumeAnalysis = [
    { bracket: 'Under ₹50,000', volume: 2150, percentage: 15 },
    { bracket: '₹50K - ₹100K', volume: 3420, percentage: 25 },
    { bracket: '₹100K - ₹150K', volume: 3890, percentage: 28 },
    { bracket: '₹150K - ₹200K', volume: 2890, percentage: 20 },
    { bracket: 'Over ₹200K', volume: 1574, percentage: 12 }
  ];

  private reports: Report[] = [
    {
      reportId: 'RPT001',
      scope: 'Period',
      metrics: {
        totalTransactions: 8924,
        highValueCount: 1464,
        accountGrowthRate: 12.5
      },
      generatedDate: new Date('2025-12-20')
    },
    {
      reportId: 'RPT002',
      scope: 'Branch',
      metrics: {
        totalTransactions: 4562,
        highValueCount: 742,
        accountGrowthRate: 15.2
      },
      generatedDate: new Date('2025-12-19')
    },
    {
      reportId: 'RPT003',
      scope: 'AccountType',
      metrics: {
        totalTransactions: 4362,
        highValueCount: 722,
        accountGrowthRate: 9.8
      },
      generatedDate: new Date('2025-12-18')
    }
  ];

  private notifications: Notification[] = [
    {
      notificationId: 'NOT001',
      userId: 'USER1001',
      type: 'SuspiciousActivity',
      message: 'High-value transaction detected: ₹210,000 transfer from ACC1007 to ACC2015. Please review TXN007.',
      status: 'Unread',
      createdDate: new Date('2025-12-30T14:30:00')
    },
    {
      notificationId: 'NOT002',
      userId: 'USER1002',
      type: 'ApprovalReminder',
      message: 'Transaction TXN006 (₹180,000) is pending your approval. Account: ACC1006',
      status: 'Unread',
      createdDate: new Date('2025-12-30T13:15:00')
    },
    {
      notificationId: 'NOT003',
      userId: 'USER1001',
      type: 'ApprovalReminder',
      message: 'Account change request DCH001 for ACC1001 (Name change) awaits your approval.',
      status: 'Unread',
      createdDate: new Date('2025-12-30T12:45:00')
    },
    {
      notificationId: 'NOT004',
      userId: 'USER1003',
      type: 'SuspiciousActivity',
      message: 'High-value withdrawal detected: ₹210,000 from ACC1007. Verification required.',
      status: 'Unread',
      createdDate: new Date('2025-12-29T16:20:00')
    },
    {
      notificationId: 'NOT005',
      userId: 'USER1002',
      type: 'ApprovalReminder',
      message: 'Transaction TXN009 (₹190,000) requires your approval. Account: ACC1009',
      status: 'Unread',
      createdDate: new Date('2025-12-29T15:05:00')
    },
    {
      notificationId: 'NOT006',
      userId: 'USER1001',
      type: 'ApprovalReminder',
      message: 'Account change request DCH002 for ACC1002 (Address update) is pending review.',
      status: 'Unread',
      createdDate: new Date('2025-12-29T14:30:00')
    },
    {
      notificationId: 'NOT007',
      userId: 'USER1004',
      type: 'SuspiciousActivity',
      message: 'Unusual pattern detected: Multiple high-value transactions from ACC1003. Flagged for review.',
      status: 'Unread',
      createdDate: new Date('2025-12-29T13:45:00')
    },
    {
      notificationId: 'NOT008',
      userId: 'USER1002',
      type: 'ApprovalReminder',
      message: 'Transaction TXN002 (₹150,000) awaits approval. Account: ACC1002',
      status: 'Read',
      createdDate: new Date('2025-12-29T11:05:00')
    },
    {
      notificationId: 'NOT009',
      userId: 'USER1001',
      type: 'ApprovalReminder',
      message: 'Account change request DCH003 for ACC1003 (Email update) requires your decision.',
      status: 'Read',
      createdDate: new Date('2025-12-28T15:20:00')
    },
    {
      notificationId: 'NOT010',
      userId: 'USER1003',
      type: 'SuspiciousActivity',
      message: 'High-value deposit detected: ₹225,000 to ACC1005. Verification in progress.',
      status: 'Read',
      createdDate: new Date('2025-12-28T10:30:00')
    }
  ];
  private notificationsSubject = new BehaviorSubject<Notification[]>(this.notifications);
  private unreadCountSubject = new BehaviorSubject<number>(this.getUnreadNotificationsCountInternal());

  private approvals: Approval[] = [
    { approvalId: 'APR001', transactionId: 'TXN002', reviewerId: 'REV001', decision: 'Pending', comments: '', approvalDate: new Date('2025-12-30T10:00:00') },
    { approvalId: 'APR002', transactionId: 'TXN006', reviewerId: 'REV001', decision: 'Pending', comments: '', approvalDate: new Date('2025-12-30T09:30:00') },
    { approvalId: 'APR003', transactionId: 'TXN009', reviewerId: 'REV002', decision: 'Pending', comments: '', approvalDate: new Date('2025-12-30T09:15:00') },
    { approvalId: 'APR004', transactionId: 'TXN011', reviewerId: 'REV003', decision: 'Pending', comments: '', approvalDate: new Date('2025-12-30T08:45:00') },
    { approvalId: 'APR005', transactionId: 'TXN007', reviewerId: 'REV001', decision: 'Approved', comments: 'High-value deposit ₹210,000 approved after verification', approvalDate: new Date('2025-12-29T14:20:00') },
    { approvalId: 'APR006', transactionId: 'TXN001', reviewerId: 'REV002', decision: 'Approved', comments: 'High-value deposit ₹125,000 verified and accepted', approvalDate: new Date('2025-12-28T16:45:00') },
    { approvalId: 'APR007', transactionId: 'TXN005', reviewerId: 'REV001', decision: 'Approved', comments: 'High-value deposit ₹225,000 verified, account holder confirmed', approvalDate: new Date('2025-12-27T11:30:00') },
    { approvalId: 'APR008', transactionId: 'TXN003', reviewerId: 'REV002', decision: 'Approved', comments: 'Transfer ₹200,000 approved after fraud checks', approvalDate: new Date('2025-12-27T10:15:00') },
    { approvalId: 'APR009', transactionId: 'TXN004', reviewerId: 'REV003', decision: 'Rejected', comments: 'High-value withdrawal ₹175,000 rejected - Insufficient account balance', approvalDate: new Date('2025-12-28T13:10:00') },
    { approvalId: 'APR010', transactionId: 'TXN008', reviewerId: 'REV001', decision: 'Rejected', comments: 'High-value withdrawal ₹160,000 failed fraud detection checks', approvalDate: new Date('2025-12-27T09:45:00') },
    { approvalId: 'APR011', transactionId: 'TXN010', reviewerId: 'REV002', decision: 'Approved', comments: 'High-value deposit ₹205,000 approved', approvalDate: new Date('2025-12-26T14:30:00') },
    { approvalId: 'APR012', transactionId: 'TXN012', reviewerId: 'REV001', decision: 'Approved', comments: 'High-value deposit ₹185,000 verified', approvalDate: new Date('2025-12-25T11:00:00') }
  ];

  private dataChangeApprovals: DataChangeApproval[] = [
    { changeId: 'DCH001', accountId: 'ACC1001', changeType: 'Name', oldValue: 'John Smith', newValue: 'John Robert Smith', requestedBy: 'ACC1001', decision: 'Pending', comments: '', requestDate: new Date('2025-12-30T08:00:00'), decisionDate: new Date('2025-12-30T08:00:00') },
    { changeId: 'DCH002', accountId: 'ACC1002', changeType: 'Address', oldValue: '123 Main St', newValue: '456 Oak Avenue', requestedBy: 'ACC1002', decision: 'Pending', comments: '', requestDate: new Date('2025-12-30T07:30:00'), decisionDate: new Date('2025-12-30T07:30:00') },
    { changeId: 'DCH003', accountId: 'ACC1003', changeType: 'Email', oldValue: 'mike.d@email.com', newValue: 'michael.davis@email.com', requestedBy: 'ACC1003', decision: 'Pending', comments: '', requestDate: new Date('2025-12-30T06:45:00'), decisionDate: new Date('2025-12-30T06:45:00') },
    { changeId: 'DCH004', accountId: 'ACC1004', changeType: 'Phone', oldValue: '555-1234', newValue: '555-5678', requestedBy: 'ACC1004', decision: 'Pending', comments: '', requestDate: new Date('2025-12-30T06:00:00'), decisionDate: new Date('2025-12-30T06:00:00') },
    { changeId: 'DCH005', accountId: 'ACC1005', changeType: 'Email', oldValue: 'james.w@email.com', newValue: 'james.m.wilson@email.com', requestedBy: 'ACC1005', decision: 'Pending', comments: '', requestDate: new Date('2025-12-29T17:15:00'), decisionDate: new Date('2025-12-29T17:15:00') },
    { changeId: 'DCH006', accountId: 'ACC1006', changeType: 'Phone', oldValue: '555-6789', newValue: '555-9012', requestedBy: 'ACC1006', decision: 'Pending', comments: '', requestDate: new Date('2025-12-29T16:30:00'), decisionDate: new Date('2025-12-29T16:30:00') },
    { changeId: 'DCH007', accountId: 'ACC1007', changeType: 'Address', oldValue: '100 North St', newValue: '200 South Ave', requestedBy: 'ACC1007', decision: 'Approved', comments: 'Address change verified with government ID', decisionDate: new Date('2025-12-29T15:45:00'), requestDate: new Date('2025-12-29T10:00:00') },
    { changeId: 'DCH008', accountId: 'ACC1008', changeType: 'Name', oldValue: 'Jennifer Lee', newValue: 'Jennifer Marie Lee', requestedBy: 'ACC1008', decision: 'Approved', comments: 'Legal name change documentation verified', decisionDate: new Date('2025-12-28T14:20:00'), requestDate: new Date('2025-12-28T09:00:00') },
    { changeId: 'DCH009', accountId: 'ACC1009', changeType: 'Email', oldValue: 'david.m@email.com', newValue: 'david.martinez.ops@email.com', requestedBy: 'ACC1009', decision: 'Approved', comments: 'Email change confirmed', decisionDate: new Date('2025-12-27T16:10:00'), requestDate: new Date('2025-12-27T11:00:00') },
    { changeId: 'DCH010', accountId: 'ACC1010', changeType: 'Phone', oldValue: '555-3456', newValue: '555-7890', requestedBy: 'ACC1010', decision: 'Rejected', comments: 'Phone number format invalid', decisionDate: new Date('2025-12-27T14:30:00'), requestDate: new Date('2025-12-27T09:15:00') },
    { changeId: 'DCH011', accountId: 'ACC1011', changeType: 'Address', oldValue: '300 West Ln', newValue: '400 East Blvd', requestedBy: 'ACC1011', decision: 'Rejected', comments: 'Address could not be verified', decisionDate: new Date('2025-12-26T15:45:00'), requestDate: new Date('2025-12-26T10:30:00') },
    { changeId: 'DCH012', accountId: 'ACC1012', changeType: 'Name', oldValue: 'Rachel White', newValue: 'Rachel Elizabeth White', requestedBy: 'ACC1012', decision: 'Approved', comments: 'Name change verified', decisionDate: new Date('2025-12-25T13:00:00'), requestDate: new Date('2025-12-25T08:00:00') }
  ];

  getDashboardStats() {
    return this.dashboardStats;
  }

  getTransactions(): Observable<Transaction[]> {
    return new BehaviorSubject(this.transactions).asObservable();
  }

  getMonthlyData() {
    return this.monthlyData;
  }

  getCategoryData() {
    return this.categoryData;
  }

  getAccountGrowthTrends() {
    return this.accountGrowthTrends;
  }

  getTransactionVolumeAnalysis() {
    return this.transactionVolumeAnalysis;
  }

  getMonthlyTransactionVolumes() {
    return this.monthlyTransactionVolumes;
  }

  getReports(): Observable<Report[]> {
    return new BehaviorSubject(this.reports).asObservable();
  }

  getReportById(reportId: string): Report | undefined {
    return this.reports.find(r => r.reportId === reportId);
  }


  getNotifications(): Observable<Notification[]> {
    return this.notificationsSubject.asObservable();
  }

  getUnreadNotificationsCount(): Observable<number> {
    return this.unreadCountSubject.asObservable();
  }

  /** For legacy direct count access (not reactive) */
  getUnreadNotificationsCountValue(): number {
    return this.getUnreadNotificationsCountInternal();
  }

  private getUnreadNotificationsCountInternal(): number {
    return this.notifications.filter(n => n.status === 'Unread').length;
  }

  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.notificationId === notificationId);
    if (notification) {
      notification.status = 'Read';
      this.emitNotifications();
    }
  }

  deleteNotification(notificationId: string): void {
    const index = this.notifications.findIndex(n => n.notificationId === notificationId);
    if (index > -1) {
      this.notifications.splice(index, 1);
      this.emitNotifications();
    }
  }

  private emitNotifications(): void {
    this.notificationsSubject.next([...this.notifications]);
    this.unreadCountSubject.next(this.getUnreadNotificationsCountInternal());
  }

  /**
   * Create and add a new notification to the list
   */
  addNotification(userId: string, type: 'ApprovalReminder' | 'SuspiciousActivity', message: string): void {
    const newId = 'NOT' + String(Math.floor(Math.random() * 900000) + 100000);
    this.notifications.unshift({
      notificationId: newId,
      userId,
      type,
      message,
      status: 'Unread',
      createdDate: new Date()
    });
    this.emitNotifications();
  }

  getApprovals(): Observable<Approval[]> {
    return new BehaviorSubject(this.approvals).asObservable();
  }

  getApprovalsByStatus(status: 'Pending' | 'Approved' | 'Rejected'): Approval[] {
    return this.approvals.filter(a => a.decision === status);
  }

  getHighValueTransactions(): Approval[] {
    return this.approvals.filter(a => {
      const transaction = this.transactions.find(t => t.id === a.transactionId);
      return transaction && transaction.amount > 100000;
    });
  }

  /**
   * Return combined count of approvals + data change approvals for Approved/Rejected tabs
   * For Pending tab we intentionally keep data-change-only behavior elsewhere, so use
   * dedicated methods for that where needed.
   */
  getCombinedApprovalsCount(status: 'Approved' | 'Rejected'): number {
    const transactionApprovals = this.approvals.filter(a => a.decision === status).length;
    const dataChangeApprovals = this.dataChangeApprovals.filter(d => d.decision === status).length;
    return transactionApprovals + dataChangeApprovals;
  }

  /** Count pending data-change approvals (used by Pending tab) */
  getPendingDataChangeCount(): number {
    return this.dataChangeApprovals.filter(d => d.decision === 'Pending').length;
  }

  /**
   * Count high-value pending transactions (approvals linked to transactions > 100000 and still pending)
   */
  getHighValuePendingCount(): number {
    return this.approvals.filter(a => {
      if (a.decision !== 'Pending') { return false; }
      const transaction = this.transactions.find(t => t.id === a.transactionId);
      return !!transaction && transaction.amount > 100000;
    }).length;
  }

  updateApproval(approvalId: string, decision: 'Approved' | 'Rejected', comments: string): void {
    const approval = this.approvals.find(a => a.approvalId === approvalId);
    if (approval) {
      approval.decision = decision;
      approval.comments = comments;
      approval.approvalDate = new Date();
    }
  }

  getApprovalWithTransaction(approvalId: string): { approval: Approval; transaction: Transaction } | undefined {
    const approval = this.approvals.find(a => a.approvalId === approvalId);
    if (approval) {
      const transaction = this.transactions.find(t => t.id === approval.transactionId);
      if (transaction) {
        return { approval, transaction };
      }
    }
    return undefined;
  }

  // Data Change Approval Methods
  getDataChangeApprovals(): Observable<DataChangeApproval[]> {
    return new BehaviorSubject(this.dataChangeApprovals).asObservable();
  }

  getDataChangeApprovalsByStatus(status: 'Pending' | 'Approved' | 'Rejected'): DataChangeApproval[] {
    return this.dataChangeApprovals.filter(d => d.decision === status);
  }

  updateDataChangeApproval(changeId: string, decision: 'Approved' | 'Rejected', comments: string): void {
    const dataChange = this.dataChangeApprovals.find(d => d.changeId === changeId);
    if (dataChange) {
      dataChange.decision = decision;
      dataChange.comments = comments;
      dataChange.decisionDate = new Date();
    }
  }

  exportToCSV(data: any[], filename: string = 'export.csv') {
    let csv = '';
    const headers = Object.keys(data[0]);
    csv += headers.join(',') + '\n';

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (typeof value === 'string') {
          return `"${value}"`;
        }
        return value;
      });
      csv += values.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  exportToExcel(data: any[], filename: string = 'export.xlsx') {
    // For simplicity, export as CSV with xlsx extension
    this.exportToCSV(data, filename);
  }
}