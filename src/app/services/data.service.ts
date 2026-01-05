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
    { id: 'TXN001', accountId: 'ACC1001', user: 'John Smith', date: new Date('2025-12-25'), amount: 2500, status: 'Approved', type: 'Deposit', recipientName: 'N/A', recipientAmount: 2500 },
    { id: 'TXN002', accountId: 'ACC1002', user: 'Sarah Johnson', date: new Date('2025-12-24'), amount: 1800, status: 'Pending', type: 'Withdrawal', recipientName: 'Bank Account', recipientAmount: 1800 },
    { id: 'TXN003', accountId: 'ACC1003', user: 'Mike Davis', date: new Date('2025-12-23'), amount: 3200, status: 'Approved', type: 'Transfer', recipientName: 'ACC2005 - Michael Chen', recipientAmount: 3200 },
    { id: 'TXN004', accountId: 'ACC1004', user: 'Emily Brown', date: new Date('2025-12-22'), amount: 950, status: 'Rejected', type: 'Withdrawal', recipientName: 'External Bank', recipientAmount: 950 },
    { id: 'TXN005', accountId: 'ACC1005', user: 'James Wilson', date: new Date('2025-12-21'), amount: 4100, status: 'Approved', type: 'Deposit', recipientName: 'N/A', recipientAmount: 4100 },
    { id: 'TXN006', accountId: 'ACC1006', user: 'Lisa Anderson', date: new Date('2025-12-20'), amount: 2100, status: 'Pending', type: 'Transfer', recipientName: 'ACC3001 - Finance Dept', recipientAmount: 2100 },
    { id: 'TXN007', accountId: 'ACC1007', user: 'Robert Taylor', date: new Date('2025-12-19'), amount: 5600, status: 'Approved', type: 'Deposit', recipientName: 'N/A', recipientAmount: 5600 },
    { id: 'TXN008', accountId: 'ACC1008', user: 'Jennifer Lee', date: new Date('2025-12-18'), amount: 1200, status: 'Approved', type: 'Withdrawal', recipientName: 'Savings Account', recipientAmount: 1200 },
    { id: 'TXN009', accountId: 'ACC1009', user: 'David Martinez', date: new Date('2025-12-17'), amount: 3800, status: 'Pending', type: 'Transfer', recipientName: 'ACC2008 - Operations Team', recipientAmount: 3800 },
    { id: 'TXN010', accountId: 'ACC1010', user: 'Amanda Clark', date: new Date('2025-12-16'), amount: 2900, status: 'Approved', type: 'Deposit', recipientName: 'N/A', recipientAmount: 2900 }
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
    { bracket: 'Under $100', volume: 2150, percentage: 24 },
    { bracket: '$100 - $500', volume: 3420, percentage: 38 },
    { bracket: '$500 - $1000', volume: 1890, percentage: 21 },
    { bracket: '$1000 - $5000', volume: 890, percentage: 10 },
    { bracket: 'Over $5000', volume: 574, percentage: 7 }
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
      message: 'Unusual transaction detected: $5,600 transfer from ACC1007 to ACC2015. Please review.',
      status: 'Unread',
      createdDate: new Date('2025-12-30T14:30:00')
    },
    {
      notificationId: 'NOT002',
      userId: 'USER1002',
      type: 'ApprovalReminder',
      message: 'Transaction TXN006 ($2,100) is pending your approval. Account: ACC1006',
      status: 'Unread',
      createdDate: new Date('2025-12-30T13:15:00')
    },
    {
      notificationId: 'NOT003',
      userId: 'USER1001',
      type: 'ApprovalReminder',
      message: 'Reminder: Transaction TXN009 ($3,800) awaits your approval. Account: ACC1009',
      status: 'Unread',
      createdDate: new Date('2025-12-30T12:45:00')
    },
    {
      notificationId: 'NOT004',
      userId: 'USER1003',
      type: 'SuspiciousActivity',
      message: 'High-value withdrawal detected: $5,600 from ACC1007. Verification required.',
      status: 'Read',
      createdDate: new Date('2025-12-29T16:20:00')
    },
    {
      notificationId: 'NOT005',
      userId: 'USER1002',
      type: 'SuspiciousActivity',
      message: 'Multiple transactions from ACC1004 in 10 minutes. Potential fraud detected.',
      status: 'Read',
      createdDate: new Date('2025-12-29T11:05:00')
    },
    {
      notificationId: 'NOT006',
      userId: 'USER1001',
      type: 'ApprovalReminder',
      message: 'You have 5 pending approvals. Please review them at your earliest convenience.',
      status: 'Read',
      createdDate: new Date('2025-12-28T09:30:00')
    }
  ];

  private approvals: Approval[] = [
    { approvalId: 'APR001', transactionId: 'TXN002', reviewerId: 'REV001', decision: 'Pending', comments: '', approvalDate: new Date('2025-12-30T10:00:00') },
    { approvalId: 'APR002', transactionId: 'TXN006', reviewerId: 'REV001', decision: 'Pending', comments: '', approvalDate: new Date('2025-12-30T09:30:00') },
    { approvalId: 'APR003', transactionId: 'TXN009', reviewerId: 'REV002', decision: 'Pending', comments: '', approvalDate: new Date('2025-12-30T09:15:00') },
    { approvalId: 'APR004', transactionId: 'TXN007', reviewerId: 'REV001', decision: 'Approved', comments: 'High-value deposit approved after verification', approvalDate: new Date('2025-12-29T14:20:00') },
    { approvalId: 'APR005', transactionId: 'TXN001', reviewerId: 'REV002', decision: 'Approved', comments: 'Standard deposit accepted', approvalDate: new Date('2025-12-28T16:45:00') },
    { approvalId: 'APR006', transactionId: 'TXN005', reviewerId: 'REV001', decision: 'Approved', comments: 'Verified account holder', approvalDate: new Date('2025-12-27T11:30:00') },
    { approvalId: 'APR007', transactionId: 'TXN004', reviewerId: 'REV003', decision: 'Rejected', comments: 'Insufficient account balance', approvalDate: new Date('2025-12-28T13:10:00') },
    { approvalId: 'APR008', transactionId: 'TXN003', reviewerId: 'REV002', decision: 'Rejected', comments: 'Failed fraud detection checks', approvalDate: new Date('2025-12-27T09:45:00') }
  ];

  private dataChangeApprovals: DataChangeApproval[] = [
    { changeId: 'DCH001', accountId: 'ACC1001', changeType: 'Name', oldValue: 'John Smith', newValue: 'John Robert Smith', requestedBy: 'ACC1001', decision: 'Pending', comments: '', requestDate: new Date('2025-12-30T08:00:00'), decisionDate: new Date('2025-12-30T08:00:00') },
    { changeId: 'DCH002', accountId: 'ACC1002', changeType: 'Address', oldValue: '123 Main St', newValue: '456 Oak Avenue', requestedBy: 'ACC1002', decision: 'Pending', comments: '', requestDate: new Date('2025-12-30T07:30:00'), decisionDate: new Date('2025-12-30T07:30:00') },
    { changeId: 'DCH003', accountId: 'ACC1003', changeType: 'Email', oldValue: 'mike.d@email.com', newValue: 'michael.davis@email.com', requestedBy: 'ACC1003', decision: 'Pending', comments: '', requestDate: new Date('2025-12-30T06:45:00'), decisionDate: new Date('2025-12-30T06:45:00') },
    { changeId: 'DCH004', accountId: 'ACC1004', changeType: 'Phone', oldValue: '555-1234', newValue: '555-5678', requestedBy: 'ACC1004', decision: 'Approved', comments: 'Identity verified', decisionDate: new Date('2025-12-29T15:30:00'), requestDate: new Date('2025-12-29T10:00:00') },
    { changeId: 'DCH005', accountId: 'ACC1005', changeType: 'Name', oldValue: 'James Wilson', newValue: 'James Michael Wilson', requestedBy: 'ACC1005', decision: 'Approved', comments: 'Documentation verified', decisionDate: new Date('2025-12-28T14:20:00'), requestDate: new Date('2025-12-28T09:00:00') },
    { changeId: 'DCH006', accountId: 'ACC1006', changeType: 'Address', oldValue: '789 Pine Rd', newValue: '321 Elm Street', requestedBy: 'ACC1006', decision: 'Rejected', comments: 'Address not verified', decisionDate: new Date('2025-12-27T16:45:00'), requestDate: new Date('2025-12-27T11:00:00') }
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
    return new BehaviorSubject(this.notifications).asObservable();
  }

  getUnreadNotificationsCount(): number {
    return this.notifications.filter(n => n.status === 'Unread').length;
  }

  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.notificationId === notificationId);
    if (notification) {
      notification.status = 'Read';
    }
  }

  deleteNotification(notificationId: string): void {
    const index = this.notifications.findIndex(n => n.notificationId === notificationId);
    if (index > -1) {
      this.notifications.splice(index, 1);
    }
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
      return transaction && transaction.amount > 3000;
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
   * Count high-value pending transactions (approvals linked to transactions > 3000 and still pending)
   */
  getHighValuePendingCount(): number {
    return this.approvals.filter(a => {
      if (a.decision !== 'Pending') { return false; }
      const transaction = this.transactions.find(t => t.id === a.transactionId);
      return !!transaction && transaction.amount > 3000;
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
