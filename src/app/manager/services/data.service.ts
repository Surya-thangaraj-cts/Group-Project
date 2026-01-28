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

  private transactions: Transaction[] = [];

  constructor() {
    this.generateComprehensiveTransactions();
  }

  private generateComprehensiveTransactions(): void {
    const customerNames = ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'Robert Wilson', 
                          'Jessica Miller', 'David Anderson', 'Lisa Taylor', 'James Thomas', 'Maria Garcia',
                          'Christopher Lee', 'Jennifer Martinez', 'Daniel Rodriguez', 'Patricia Lee', 'Matthew White'];
    
    const accounts = ['ACC1001', 'ACC1002', 'ACC1003', 'ACC1004', 'ACC1005', 'ACC1006', 'ACC1007', 'ACC1008', 'ACC1009', 'ACC1010'];
    const transactionTypes: Array<'Deposit' | 'Withdrawal' | 'Transfer'> = ['Deposit', 'Withdrawal', 'Transfer'];
    const statuses: Array<'Approved' | 'Pending' | 'Rejected'> = ['Approved', 'Pending', 'Rejected'];

    // Generate 150 comprehensive transactions
    for (let i = 1; i <= 150; i++) {
      const randomDay = Math.floor(Math.random() * 28) + 1;
      const randomMonth = Math.floor(Math.random() * 12);
      const randomYear = 2025;
      
      const date = new Date(randomYear, randomMonth, randomDay);
      const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
      const accountId = accounts[Math.floor(Math.random() * accounts.length)];
      
      let amount: number;
      if (transactionType === 'Deposit') {
        amount = Math.floor(Math.random() * 500000) + 1000;
      } else if (transactionType === 'Withdrawal') {
        amount = Math.floor(Math.random() * 100000) + 500;
      } else {
        amount = Math.floor(Math.random() * 250000) + 1000;
      }

      this.transactions.push({
        id: `TXN${String(i).padStart(6, '0')}`,
        accountId: accountId,
        user: customerName,
        date: date,
        amount: amount,
        status: status,
        type: transactionType,
        recipientName: customerName,
        recipientAmount: amount
      });
    }
  }

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
    // PENDING HIGH-VALUE TRANSACTION NOTIFICATIONS
    {
      notificationId: 'NOT001',
      userId: 'USER1001',
      type: 'ApprovalReminder',
      message: 'Transaction TXN000001 (High-value Deposit ₹125,500) requires your approval. Account: ACC1001',
      status: 'Unread',
      createdDate: new Date('2025-12-30T10:30:00')
    },
    {
      notificationId: 'NOT002',
      userId: 'USER1002',
      type: 'ApprovalReminder',
      message: 'Transaction TXN000002 (High-value Transfer ₹156,000) awaits approval. Account: ACC1002',
      status: 'Unread',
      createdDate: new Date('2025-12-30T09:45:00')
    },
    {
      notificationId: 'NOT003',
      userId: 'USER1003',
      type: 'ApprovalReminder',
      message: 'Account change request DCH001 for ACC1001 (Name change: John Smith → John Robert Smith) awaits approval.',
      status: 'Unread',
      createdDate: new Date('2025-12-30T08:30:00')
    },
    {
      notificationId: 'NOT004',
      userId: 'USER1001',
      type: 'ApprovalReminder',
      message: 'Transaction TXN000005 (High-value Withdrawal ₹98,750) requires approval. Account: ACC1005',
      status: 'Unread',
      createdDate: new Date('2025-12-30T07:15:00')
    },
    {
      notificationId: 'NOT005',
      userId: 'USER1002',
      type: 'ApprovalReminder',
      message: 'Transaction TXN000007 (High-value Deposit ₹210,000) pending your review. Account: ACC1007',
      status: 'Unread',
      createdDate: new Date('2025-12-30T06:00:00')
    },
    
    // DATA CHANGE NOTIFICATIONS
    {
      notificationId: 'NOT006',
      userId: 'USER1001',
      type: 'ApprovalReminder',
      message: 'Account change request DCH002 for ACC1002 (Address update) is pending review and requires approval.',
      status: 'Unread',
      createdDate: new Date('2025-12-29T17:45:00')
    },
    {
      notificationId: 'NOT007',
      userId: 'USER1003',
      type: 'ApprovalReminder',
      message: 'Account change request DCH003 for ACC1003 (Email update: michael.d@email.com → michael.davis.business@email.com) requires decision.',
      status: 'Unread',
      createdDate: new Date('2025-12-29T16:30:00')
    },
    {
      notificationId: 'NOT008',
      userId: 'USER1002',
      type: 'ApprovalReminder',
      message: 'Account change request DCH004 for ACC1004 (Phone number update) is awaiting approval.',
      status: 'Unread',
      createdDate: new Date('2025-12-29T15:15:00')
    },
    
    // SUSPICIOUS ACTIVITY NOTIFICATIONS
    {
      notificationId: 'NOT009',
      userId: 'USER1001',
      type: 'SuspiciousActivity',
      message: 'High-value deposit detected: ₹225,000 to ACC1005 (TXN000010). Multiple verifications required.',
      status: 'Unread',
      createdDate: new Date('2025-12-29T14:00:00')
    },
    {
      notificationId: 'NOT010',
      userId: 'USER1004',
      type: 'SuspiciousActivity',
      message: 'Unusual pattern detected: Multiple high-value transfers from ACC1003 within 2 hours. Flagged for immediate review.',
      status: 'Unread',
      createdDate: new Date('2025-12-29T13:30:00')
    },
    
    // APPROVED TRANSACTION NOTIFICATIONS
    {
      notificationId: 'NOT011',
      userId: 'USER1001',
      type: 'ApprovalReminder',
      message: 'Transaction TXN000015 (Approved) - High-value deposit ₹180,500 approved after identity confirmation.',
      status: 'Read',
      createdDate: new Date('2025-12-29T11:00:00')
    },
    {
      notificationId: 'NOT012',
      userId: 'USER1002',
      type: 'ApprovalReminder',
      message: 'Transaction TXN000018 (Approved) - Transfer of ₹145,000 approved with fraud check clearance.',
      status: 'Read',
      createdDate: new Date('2025-12-28T16:30:00')
    },
    {
      notificationId: 'NOT013',
      userId: 'USER1001',
      type: 'ApprovalReminder',
      message: 'Account change request DCH006 (Approved) - Address change verified with government ID. Decision finalized.',
      status: 'Read',
      createdDate: new Date('2025-12-28T14:00:00')
    },
    
    // REJECTED TRANSACTION NOTIFICATIONS
    {
      notificationId: 'NOT014',
      userId: 'USER1003',
      type: 'SuspiciousActivity',
      message: 'Transaction TXN000035 (Rejected) - High-value withdrawal flagged for suspicious activity patterns.',
      status: 'Read',
      createdDate: new Date('2025-12-28T13:15:00')
    },
    {
      notificationId: 'NOT015',
      userId: 'USER1002',
      type: 'ApprovalReminder',
      message: 'Account change request DCH010 (Rejected) - Address change could not be verified with postal database.',
      status: 'Read',
      createdDate: new Date('2025-12-27T15:00:00')
    }
  ];
  private notificationsSubject = new BehaviorSubject<Notification[]>(this.notifications);
  private unreadCountSubject = new BehaviorSubject<number>(this.getUnreadNotificationsCountInternal());

  // High-value transaction IDs for consistent linking (amounts > 100,000)
  private highValueTransactionIds = [
    'TXN000001', 'TXN000002', 'TXN000005', 'TXN000007', 'TXN000010',
    'TXN000015', 'TXN000018', 'TXN000022', 'TXN000028', 'TXN000031',
    'TXN000035', 'TXN000042', 'TXN000048', 'TXN000055', 'TXN000062'
  ];

  private approvals: Approval[] = [
    // PENDING APPROVALS - High-Value Transactions
    { approvalId: 'APR001', transactionId: 'TXN000001', reviewerId: 'REV001', decision: 'Pending', comments: '', approvalDate: new Date('2025-12-30T10:00:00') },
    { approvalId: 'APR002', transactionId: 'TXN000002', reviewerId: 'REV002', decision: 'Pending', comments: '', approvalDate: new Date('2025-12-30T09:30:00') },
    { approvalId: 'APR003', transactionId: 'TXN000005', reviewerId: 'REV003', decision: 'Pending', comments: '', approvalDate: new Date('2025-12-30T09:15:00') },
    { approvalId: 'APR004', transactionId: 'TXN000007', reviewerId: 'REV001', decision: 'Pending', comments: '', approvalDate: new Date('2025-12-30T08:45:00') },
    { approvalId: 'APR005', transactionId: 'TXN000010', reviewerId: 'REV002', decision: 'Pending', comments: '', approvalDate: new Date('2025-12-30T08:15:00') },
    
    // APPROVED APPROVALS - High-Value Transactions
    { approvalId: 'APR006', transactionId: 'TXN000015', reviewerId: 'REV001', decision: 'Approved', comments: 'High-value deposit verified and approved after identity confirmation', approvalDate: new Date('2025-12-29T14:20:00') },
    { approvalId: 'APR007', transactionId: 'TXN000018', reviewerId: 'REV002', decision: 'Approved', comments: 'Transfer approved after fraud check clearance', approvalDate: new Date('2025-12-28T16:45:00') },
    { approvalId: 'APR008', transactionId: 'TXN000022', reviewerId: 'REV003', decision: 'Approved', comments: 'High-value deposit approved with account holder confirmation', approvalDate: new Date('2025-12-27T11:30:00') },
    { approvalId: 'APR009', transactionId: 'TXN000028', reviewerId: 'REV001', decision: 'Approved', comments: 'Large withdrawal approved after verification of beneficiary details', approvalDate: new Date('2025-12-27T10:15:00') },
    { approvalId: 'APR010', transactionId: 'TXN000031', reviewerId: 'REV002', decision: 'Approved', comments: 'High-value transfer approved with compliance checks complete', approvalDate: new Date('2025-12-26T14:30:00') },
    
    // REJECTED APPROVALS - High-Value Transactions
    { approvalId: 'APR011', transactionId: 'TXN000035', reviewerId: 'REV003', decision: 'Rejected', comments: 'Rejected due to suspicious activity flags and KYC verification failure', approvalDate: new Date('2025-12-28T13:10:00') },
    { approvalId: 'APR012', transactionId: 'TXN000042', reviewerId: 'REV001', decision: 'Rejected', comments: 'Rejected - Account has insufficient balance for this transaction', approvalDate: new Date('2025-12-27T09:45:00') }
  ];

  private dataChangeApprovals: DataChangeApproval[] = [
    // PENDING DATA CHANGES
    { changeId: 'DCH001', accountId: 'ACC1001', changeType: 'Name', oldValue: 'John Smith', newValue: 'John Robert Smith', requestedBy: 'ACC1001', decision: 'Pending', comments: '', requestDate: new Date('2025-12-30T08:00:00'), decisionDate: new Date('2025-12-30T08:00:00') },
    { changeId: 'DCH002', accountId: 'ACC1002', changeType: 'Address', oldValue: '123 Main Street, New York, NY 10001', newValue: '456 Oak Avenue, Brooklyn, NY 11201', requestedBy: 'ACC1002', decision: 'Pending', comments: '', requestDate: new Date('2025-12-30T07:30:00'), decisionDate: new Date('2025-12-30T07:30:00') },
    { changeId: 'DCH003', accountId: 'ACC1003', changeType: 'Email', oldValue: 'michael.d@email.com', newValue: 'michael.davis.business@email.com', requestedBy: 'ACC1003', decision: 'Pending', comments: '', requestDate: new Date('2025-12-30T06:45:00'), decisionDate: new Date('2025-12-30T06:45:00') },
    { changeId: 'DCH004', accountId: 'ACC1004', changeType: 'Phone', oldValue: '+1-555-0001', newValue: '+1-555-0004', requestedBy: 'ACC1004', decision: 'Pending', comments: '', requestDate: new Date('2025-12-30T06:00:00'), decisionDate: new Date('2025-12-30T06:00:00') },
    { changeId: 'DCH005', accountId: 'ACC1005', changeType: 'Email', oldValue: 'james.wilson@email.com', newValue: 'james.michael.wilson@email.com', requestedBy: 'ACC1005', decision: 'Pending', comments: '', requestDate: new Date('2025-12-29T17:15:00'), decisionDate: new Date('2025-12-29T17:15:00') },
    
    // APPROVED DATA CHANGES
    { changeId: 'DCH006', accountId: 'ACC1006', changeType: 'Address', oldValue: '789 Elm Street, Queens, NY 11354', newValue: '321 Park Lane, Manhattan, NY 10019', requestedBy: 'ACC1006', decision: 'Approved', comments: 'Address change verified with government-issued ID and utility bill', decisionDate: new Date('2025-12-29T15:45:00'), requestDate: new Date('2025-12-29T10:00:00') },
    { changeId: 'DCH007', accountId: 'ACC1007', changeType: 'Name', oldValue: 'Jennifer Lee', newValue: 'Jennifer Marie Lee-Anderson', requestedBy: 'ACC1007', decision: 'Approved', comments: 'Legal marriage certificate provided and verified successfully', decisionDate: new Date('2025-12-28T14:20:00'), requestDate: new Date('2025-12-28T09:00:00') },
    { changeId: 'DCH008', accountId: 'ACC1008', changeType: 'Email', oldValue: 'david.martinez@email.com', newValue: 'david.m.martinez.operations@email.com', requestedBy: 'ACC1008', decision: 'Approved', comments: 'Email change verified through OTP confirmation and identity check', decisionDate: new Date('2025-12-27T16:10:00'), requestDate: new Date('2025-12-27T11:00:00') },
    { changeId: 'DCH009', accountId: 'ACC1009', changeType: 'Phone', oldValue: '+1-555-0005', newValue: '+1-555-0009', requestedBy: 'ACC1009', decision: 'Approved', comments: 'Phone number updated with SMS and call verification completed', decisionDate: new Date('2025-12-26T13:35:00'), requestDate: new Date('2025-12-26T10:30:00') },
    
    // REJECTED DATA CHANGES
    { changeId: 'DCH010', accountId: 'ACC1010', changeType: 'Address', oldValue: '555 Beach Avenue, Brooklyn, NY 11218', newValue: 'Invalid Address Format - (incomplete)', requestedBy: 'ACC1010', decision: 'Rejected', comments: 'Rejected - Address format incomplete and could not be verified with postal database', decisionDate: new Date('2025-12-27T14:30:00'), requestDate: new Date('2025-12-27T09:15:00') },
    { changeId: 'DCH011', accountId: 'ACC1011', changeType: 'Email', oldValue: 'robert.johnson@email.com', newValue: 'robert.johnson99999@email.com', requestedBy: 'ACC1011', decision: 'Rejected', comments: 'Rejected - Email format suspicious and OTP verification failed after 3 attempts', decisionDate: new Date('2025-12-26T15:45:00'), requestDate: new Date('2025-12-26T10:30:00') }
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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const accountsByMonth = Array(12).fill(0);

    // Count transactions per month
    this.transactions.forEach(txn => {
      const monthIndex = txn.date.getMonth();
      accountsByMonth[monthIndex]++;
    });

    // Calculate progressive account growth based on transaction distribution
    return months.map((month, index) => {
      const baseAccounts = 500 + (index * 80);
      const newAccountsThisMonth = Math.floor(accountsByMonth[index] * 0.15) + 30;
      return {
        month,
        newAccounts: newAccountsThisMonth,
        activeAccounts: baseAccounts
      };
    });
  }

  getTransactionVolumeAnalysis() {
    const brackets = [
      { bracket: 'Under ₹50,000', min: 0, max: 50000 },
      { bracket: '₹50K - ₹100K', min: 50000, max: 100000 },
      { bracket: '₹100K - ₹150K', min: 100000, max: 150000 },
      { bracket: '₹150K - ₹200K', min: 150000, max: 200000 },
      { bracket: 'Over ₹200K', min: 200000, max: Infinity }
    ];

    const total = this.transactions.length;
    const analysis = brackets.map(b => {
      const count = this.transactions.filter(t => t.amount >= b.min && t.amount < b.max).length;
      return {
        bracket: b.bracket,
        volume: count,
        percentage: Math.round((count / total) * 100)
      };
    });

    return analysis;
  }

  getMonthlyTransactionVolumes() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyVolumes = Array(12).fill(0);
    const monthlyAmounts = Array(12).fill(0);

    // Calculate transaction counts and amounts per month
    this.transactions.forEach(txn => {
      const monthIndex = txn.date.getMonth();
      monthlyVolumes[monthIndex]++;
      monthlyAmounts[monthIndex] += txn.amount;
    });

    return months.map((month, index) => ({
      month,
      volume: monthlyVolumes[index],
      expenditure: Math.round(monthlyAmounts[index] / 1000) // in thousands
    }));
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
      if (a.decision !== 'Pending') { return false; }
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

  approveHighValueTransaction(transactionId: string, comments: string): boolean {
    const approval = this.approvals.find(a => a.transactionId === transactionId);
    if (approval) {
      approval.decision = 'Approved';
      approval.comments = comments;
      approval.approvalDate = new Date();
      
      // Update transaction status
      const transaction = this.transactions.find(t => t.id === transactionId);
      if (transaction) {
        transaction.status = 'Approved';
      }
      
      // Add notification
      this.createHighValueApprovalNotification(transactionId, 'Approved', comments);
      this.notificationsSubject.next([...this.notifications]);
      this.unreadCountSubject.next(this.getUnreadNotificationsCountInternal());
      
      return true;
    }
    return false;
  }

  rejectHighValueTransaction(transactionId: string, comments: string): boolean {
    const approval = this.approvals.find(a => a.transactionId === transactionId);
    if (approval) {
      approval.decision = 'Rejected';
      approval.comments = comments;
      approval.approvalDate = new Date();
      
      // Update transaction status
      const transaction = this.transactions.find(t => t.id === transactionId);
      if (transaction) {
        transaction.status = 'Rejected';
      }
      
      // Add notification
      this.createHighValueApprovalNotification(transactionId, 'Rejected', comments);
      this.notificationsSubject.next([...this.notifications]);
      this.unreadCountSubject.next(this.getUnreadNotificationsCountInternal());
      
      return true;
    }
    return false;
  }

  private createHighValueApprovalNotification(transactionId: string, decision: string, comments: string): void {
    const transaction = this.transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    const notificationId = `NOT${String(this.notifications.length + 1).padStart(3, '0')}`;
    const message = `High-value transaction ${transactionId} (₹${transaction.amount.toLocaleString('en-IN')}) has been ${decision.toLowerCase()}. ${comments ? 'Reason: ' + comments : ''}`;
    
    this.notifications.push({
      notificationId,
      userId: 'MANAGER001',
      type: 'ApprovalReminder',
      message,
      status: 'Unread',
      createdDate: new Date()
    });
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

  // Methods to fetch notification details
  getTransactionById(transactionId: string): Transaction | undefined {
    return this.transactions.find(t => t.id === transactionId);
  }

  getApprovalByTransactionId(transactionId: string): Approval | undefined {
    return this.approvals.find(a => a.transactionId === transactionId);
  }

  getDataChangeApprovalByChangeId(changeId: string): DataChangeApproval | undefined {
    return this.dataChangeApprovals.find(d => d.changeId === changeId);
  }

  getNotificationById(notificationId: string): Notification | undefined {
    return this.notifications.find(n => n.notificationId === notificationId);
  }

  /**
   * Extract IDs from notification message
   * Returns { type, key, value } to identify what should be displayed
   */
  extractNotificationDetailsFromMessage(message: string): { type: 'transaction' | 'datachange' | 'suspicious', key: string, value: string } {
    const txnMatch = message.match(/TXN\d+/);
    if (txnMatch) {
      return { type: 'transaction', key: 'transactionId', value: txnMatch[0] };
    }

    const dchMatch = message.match(/DCH\d+/);
    if (dchMatch) {
      return { type: 'datachange', key: 'changeId', value: dchMatch[0] };
    }

    const accMatch = message.match(/ACC\d+/);
    if (accMatch) {
      return { type: 'suspicious', key: 'accountId', value: accMatch[0] };
    }

    return { type: 'suspicious', key: '', value: '' };
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