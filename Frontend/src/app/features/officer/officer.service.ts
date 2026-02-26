import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, interval, Subscription } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { Account, Transaction, UpdateRequest, TxnType, AlertMsg, Notification, OfficerProfile, AccountType } from './model';
import { AuthService } from '../../auth/auth.service';
import { AccountApiService } from '../../core/services/account-api.service';
import { TransactionApiService } from '../../core/services/transaction-api.service';
import { ApprovalApiService } from '../../core/services/approval-api.service';
import { 
  CreateAccountDto, 
  CreateTransactionDto, 
  TransactionType as ApiTransactionType,
  AccountType as ApiAccountType,
  AccountStatus as ApiAccountStatus
} from '../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class OfficerService implements OnDestroy {
  private accountApi = inject(AccountApiService);
  private transactionApi = inject(TransactionApiService);
  private approvalApi = inject(ApprovalApiService);
  private auth = inject(AuthService);

  // State streams
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private updateReqsSubject = new BehaviorSubject<UpdateRequest[]>([]);
  private alertSubject = new BehaviorSubject<AlertMsg | null>(null);
  private localNotificationsSubject = new BehaviorSubject<Notification[]>([]);
  private dismissedIds = new Set<string>();
  private pollSub?: Subscription;
 
  accounts$ = this.accountsSubject.asObservable();
  transactions$ = this.transactionsSubject.asObservable();
  updateRequests$ = this.updateReqsSubject.asObservable();
  alert$ = this.alertSubject.asObservable();
  /** Notifications shown in the bell icon — only officer's own actions + manager decisions */
  notifications$ = this.localNotificationsSubject.asObservable();
 
  readonly highValueThreshold = 100000;

  constructor() {
    this.loadDismissedIds();
    this.loadLocalNotifications();
    this.loadAccounts();
    this.loadTransactions();
    this.loadUpdateRequests();
    this.startApprovalPolling();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  // ========== API Integration Methods ==========

  /**
   * Load accounts from API
   */
  loadAccounts(): void {
    console.log('Loading accounts from API...');
    this.accountApi.getAccounts(1, 100).pipe( // Load all accounts regardless of status
      map(apiAccounts => this.mapAccountsFromApi(apiAccounts)),
      catchError(error => {
        console.error('Error loading accounts:', error);
        this.setError('Failed to connect to the server. Please check if the backend is running.');
        return of([]);
      })
    ).subscribe(accounts => {
      console.log(`Loaded ${accounts.length} accounts successfully`);
      this.accountsSubject.next(accounts);
    });
  }

  /**
   * Load transactions from API
   */
  loadTransactions(): void {
    console.log('Loading transactions from API...');
    this.transactionApi.getTransactions(1, 100).pipe(
      map(pagedResult => this.mapTransactionsFromApi(pagedResult.items)),
      catchError(error => {
        console.error('Error loading transactions:', error);
        this.setError('Failed to connect to the server. Please check if the backend is running.');
        return of([]);
      })
    ).subscribe(transactions => {
      console.log(`Loaded ${transactions.length} transactions successfully`);
      this.transactionsSubject.next(transactions);
    });
  }



  /**
   * Load update requests from Approvals API (AccountUpdate + AccountCreation approvals)
   */
  loadUpdateRequests(): void {
    console.log('Loading update requests from Approvals API...');
    this.approvalApi.getApprovals(1, 100).pipe(
      map(result => {
        if (!result || !result.items) return [];
        return result.items
          .filter((a: any) => a.type === 'AccountUpdate' || a.type === 'AccountCreation')
          .map((a: any) => this.mapApprovalToUpdateRequest(a));
      }),
      catchError(error => {
        console.error('Error loading update requests:', error);
        return of([]);
      })
    ).subscribe(requests => {
      console.log(`Loaded ${requests.length} update requests`);
      this.updateReqsSubject.next(requests);
    });
  }

  /**
   * Map an Approval object to an UpdateRequest for the table
   */
  private mapApprovalToUpdateRequest(approval: any): UpdateRequest {
    // Parse pendingChanges JSON if available
    let changeSummary = '';
    let customerName = '';
    let customerId = '';
    let accountType: AccountType = 'SAVINGS';

    if (approval.pendingChanges) {
      try {
        const changes = JSON.parse(approval.pendingChanges);
        const parts: string[] = [];
        if (changes.CustomerName) { customerName = changes.CustomerName; parts.push(`Name: ${changes.CustomerName}`); }
        if (changes.CustomerId) { customerId = changes.CustomerId; parts.push(`CID: ${changes.CustomerId}`); }
        if (changes.AccountType !== undefined) {
          const typeStr = changes.AccountType === 0 ? 'SAVINGS' : changes.AccountType === 1 ? 'CURRENT' : 'FIXED_DEPOSIT';
          accountType = typeStr as AccountType;
          parts.push(`Type: ${typeStr}`);
        }
        if (changes.Status !== undefined) {
          parts.push(`Status: ${changes.Status === 0 ? 'Active' : 'Closed'}`);
        }
        changeSummary = parts.length > 0 ? parts.join(', ') : 'No changes';
      } catch {
        changeSummary = approval.pendingChanges;
      }
    } else {
      changeSummary = approval.type === 'AccountCreation' ? 'New account creation' : 'Account update';
    }

    // Map decision string to status
    let status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
    if (approval.decision === 'Approve') status = 'APPROVED';
    else if (approval.decision === 'Reject') status = 'REJECTED';

    return {
      updateId: approval.approvalId?.toString() || '',
      accountId: approval.accountId?.toString() || '',
      customerName: customerName || approval.accountCustomerName || '',
      customerId: customerId,
      accountType: accountType,
      changeSummary: changeSummary,
      status: status,
      time: approval.approvalDate || new Date().toISOString()
    };
  }

  /**
   * Load local notifications from localStorage
   */
  private loadLocalNotifications(): void {
    try {
      const stored = localStorage.getItem('officer_local_notifications');
      if (stored) {
        const localNotifications = (JSON.parse(stored) as Notification[])
          .filter(n => !this.dismissedIds.has(n.id)); // Skip dismissed
        this.localNotificationsSubject.next(localNotifications);
        this.saveLocalNotifications(localNotifications); // Clean up storage
      }
    } catch (error) {
      console.error('Error loading local notifications:', error);
    }
  }

  /**
   * Save local notifications to localStorage
   */
  private saveLocalNotifications(notifications: Notification[]): void {
    try {
      localStorage.setItem('officer_local_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving local notifications:', error);
    }
  }

  /**
   * Load dismissed notification IDs from localStorage
   */
  private loadDismissedIds(): void {
    try {
      const stored = localStorage.getItem('officer_dismissed_notifications');
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        ids.forEach(id => this.dismissedIds.add(id));
      }
    } catch (error) {
      console.error('Error loading dismissed notifications:', error);
    }
  }

  /**
   * Save dismissed notification IDs to localStorage
   */
  private saveDismissedIds(): void {
    try {
      localStorage.setItem('officer_dismissed_notifications', JSON.stringify([...this.dismissedIds]));
    } catch (error) {
      console.error('Error saving dismissed notifications:', error);
    }
  }

  /**
   * Add a local notification (for officer's own submissions)
   */
  addLocalNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: `local_${Date.now()}`,
      timestamp: new Date().toISOString(),
      time: new Date().toISOString(),
      read: false
    };

    const currentLocal = this.localNotificationsSubject.value;
    const updatedLocal = [newNotification, ...currentLocal];
    this.localNotificationsSubject.next(updatedLocal);
    this.saveLocalNotifications(updatedLocal);
  }

  /**
   * Update a local notification (for approval/rejection updates)
   */
  updateLocalNotification(approvalId: number, updates: Partial<Notification>): void {
    const currentLocal = this.localNotificationsSubject.value;
    const updatedLocal = currentLocal.map(notification => {
      // Find notification by approvalId in meta
      if (notification.meta?.approvalId === approvalId) {
        return {
          ...notification,
          ...updates,
          meta: {
            ...notification.meta,
            ...updates.meta
          },
          timestamp: new Date().toISOString(),
          time: new Date().toISOString(),
          read: false // Mark as unread so officer sees the update
        };
      }
      return notification;
    });

    this.localNotificationsSubject.next(updatedLocal);
    this.saveLocalNotifications(updatedLocal);
  }

  // ========== Approval Polling ==========

  /**
   * Poll approvals every 30 seconds to detect manager decisions.
   * When a local notification has a pending approvalId and the approval
   * is now Approved/Rejected, update the notification with the decision & comments.
   */
  private startApprovalPolling(): void {
    // Poll every 30 seconds
    this.pollSub = interval(30000).pipe(
      switchMap(() => {
        const localNotifications = this.localNotificationsSubject.value;
        // Find local notifications that have an approvalId and are still pending
        const pendingApprovalIds = localNotifications
          .filter(n => n.meta?.approvalId && (!n.meta?.decision || n.meta.decision === 'Pending'))
          .map(n => n.meta!.approvalId!);

        if (pendingApprovalIds.length === 0) {
          return of(null);
        }

        // Fetch all approvals (both approved and rejected) to check for updates
        return this.approvalApi.getApprovals(1, 100).pipe(
          catchError(() => of(null))
        );
      })
    ).subscribe(result => {
      if (!result || !result.items) return;

      const localNotifications = this.localNotificationsSubject.value;
      let hasUpdates = false;

      const updatedLocal = localNotifications.map(notification => {
        if (!notification.meta?.approvalId) return notification;
        if (notification.meta?.decision && notification.meta.decision !== 'Pending') return notification;

        // Find matching approval
        const approval = result.items.find(
          (a: any) => a.approvalId === notification.meta!.approvalId
        );

        if (!approval) return notification;

        // Check if the approval has been decided
        const decision = approval.decision;
        // decision: 'Pending' | 'Approve' | 'Reject'
        if (decision === 'Pending') return notification; // Still pending

        hasUpdates = true;
        const isApproved = decision === 'Approve';
        const decisionStr = isApproved ? 'Approved' : 'Rejected';

        // Build updated message
        let updatedMessage = notification.message;
        if (notification.type === 'ACCOUNT_CREATION') {
          updatedMessage = isApproved
            ? `Account creation request for ${notification.meta?.customerName || 'account'} has been approved`
            : `Account creation request for ${notification.meta?.customerName || 'account'} has been rejected`;
        } else if (notification.type === 'UPDATE_REQUEST') {
          updatedMessage = isApproved
            ? `Account update request for Account ${notification.meta?.accountId || ''} has been approved`
            : `Account update request for Account ${notification.meta?.accountId || ''} has been rejected`;
        } else if (notification.type === 'TRANSACTION') {
          updatedMessage = isApproved
            ? `Transaction of ₹${notification.meta?.amount?.toFixed(2) || '0.00'} has been approved`
            : `Transaction of ₹${notification.meta?.amount?.toFixed(2) || '0.00'} has been rejected`;
        }

        return {
          ...notification,
          message: updatedMessage,
          title: isApproved ? '✅ ' + (notification.title || 'Request') + ' — Approved' : '❌ ' + (notification.title || 'Request') + ' — Rejected',
          severity: (isApproved ? 'success' : 'error') as 'success' | 'error',
          timestamp: new Date().toISOString(),
          time: new Date().toISOString(),
          read: false, // Mark unread so officer sees the update
          meta: {
            ...notification.meta,
            status: decisionStr,
            decision: decisionStr,
            comments: approval.comments || ''
          }
        };
      });

      if (hasUpdates) {
        this.localNotificationsSubject.next(updatedLocal);
        this.saveLocalNotifications(updatedLocal);

        // Also refresh accounts in case approval changed account status
        this.loadAccounts();
        this.loadTransactions();
      }
    });
  }

  /**
   * Force-check approvals immediately (e.g. when user opens notifications)
   */
  checkApprovalUpdates(): void {
    const localNotifications = this.localNotificationsSubject.value;
    const pendingApprovalIds = localNotifications
      .filter(n => n.meta?.approvalId && (!n.meta?.decision || n.meta.decision === 'Pending'))
      .map(n => n.meta!.approvalId!);

    if (pendingApprovalIds.length === 0) return;

    this.approvalApi.getApprovals(1, 100).pipe(
      catchError(() => of(null))
    ).subscribe(result => {
      if (!result || !result.items) return;

      let hasUpdates = false;
      const updatedLocal = localNotifications.map(notification => {
        if (!notification.meta?.approvalId) return notification;
        if (notification.meta?.decision && notification.meta.decision !== 'Pending') return notification;

        const approval = result.items.find(
          (a: any) => a.approvalId === notification.meta!.approvalId
        );
        if (!approval || approval.decision === 'Pending') return notification;

        hasUpdates = true;
        const isApproved = approval.decision === 'Approve';
        const decisionStr = isApproved ? 'Approved' : 'Rejected';

        let updatedMessage = notification.message;
        if (notification.type === 'ACCOUNT_CREATION') {
          updatedMessage = isApproved
            ? `Account creation for ${notification.meta?.customerName || 'account'} has been approved`
            : `Account creation for ${notification.meta?.customerName || 'account'} has been rejected`;
        } else if (notification.type === 'UPDATE_REQUEST') {
          updatedMessage = isApproved
            ? `Update request for Account ${notification.meta?.accountId || ''} has been approved`
            : `Update request for Account ${notification.meta?.accountId || ''} has been rejected`;
        } else if (notification.type === 'TRANSACTION') {
          updatedMessage = isApproved
            ? `Transaction of ₹${notification.meta?.amount?.toFixed(2) || '0.00'} has been approved`
            : `Transaction of ₹${notification.meta?.amount?.toFixed(2) || '0.00'} has been rejected`;
        }

        return {
          ...notification,
          message: updatedMessage,
          title: isApproved ? '✅ ' + (notification.title || 'Request') + ' — Approved' : '❌ ' + (notification.title || 'Request') + ' — Rejected',
          severity: (isApproved ? 'success' : 'error') as 'success' | 'error',
          timestamp: new Date().toISOString(),
          time: new Date().toISOString(),
          read: false,
          meta: {
            ...notification.meta,
            status: decisionStr,
            decision: decisionStr,
            comments: approval.comments || ''
          }
        };
      });

      if (hasUpdates) {
        this.localNotificationsSubject.next(updatedLocal);
        this.saveLocalNotifications(updatedLocal);
        this.loadAccounts();
        this.loadTransactions();
      }
    });
  }

  // ========== Mapping Functions ==========

  private mapAccountsFromApi(apiAccounts: any[]): Account[] {
    return apiAccounts.map(apiAcc => ({
      accountId: apiAcc.accountId?.toString() || '',
      customerName: apiAcc.customerName || '',
      customerId: apiAcc.customerId || '',
      accountType: apiAcc.accountType === 0 ? 'SAVINGS' : apiAcc.accountType === 1 ? 'CURRENT' : 'FIXED_DEPOSIT',
      balance: apiAcc.balance || 0,
      status: apiAcc.status === 0 ? 'ACTIVE' : apiAcc.status === 1 ? 'CLOSED' : 'PENDING',
      openedAt: apiAcc.openedAt || new Date().toISOString()
    }));
  }

  private mapTransactionsFromApi(apiTransactions: any[]): Transaction[] {
    return apiTransactions.map(apiTxn => ({
      id: apiTxn.transactionId?.toString() || cryptoRandomId(),
      time: apiTxn.date || new Date().toISOString(),
      type: this.mapTransactionType(apiTxn.type),
      amount: apiTxn.amount || 0,
      accountId: apiTxn.accountId?.toString() || '',
      toAccountId: apiTxn.toAccountId?.toString(),
      flagged: apiTxn.flag === 'High' || apiTxn.flag === 'Suspicious',
      narrative: apiTxn.narrative || '',
      status: apiTxn.status || 'Completed',
      flag: apiTxn.flag || 'Normal'
    }));
  }

  private mapTransactionType(type: string): TxnType {
    if (type === 'Deposit') return 'DEPOSIT';
    if (type === 'Withdrawal') return 'WITHDRAWAL';
    if (type === 'Transfer') return 'TRANSFER';
    return 'DEPOSIT';
  }

  // for alerts subject
  clearAlert() { this.alertSubject.next(null); }
  setSuccess(message: string) { this.alertSubject.next({ type: 'success', message }); }
  setError(message: string) {
    // Prevent duplicate consecutive error messages
    const current = this.alertSubject.value;
    if (current && current.type === 'error' && current.message === message) {
      return;
    }
    this.alertSubject.next({ type: 'error', message });
  }
 
 
  getAccountById(accountId: string): Account | undefined {
    return this.accountsSubject.value.find(a => a.accountId === accountId);
  }
 
  /**
   * Create account via API (requires approval)
   */
  createAccount(input: { accountId: string; customerName: string; customerId: string; accountType: AccountType }): void {
    const dto: CreateAccountDto = {
      accountId: input.accountId,
      customerName: input.customerName,
      customerId: input.customerId,
      accountType: input.accountType === 'SAVINGS' ? 0 : input.accountType === 'CURRENT' ? 1 : 2
    };

    this.accountApi.createAccount(dto).pipe(
      tap((response) => {
        this.setSuccess(response.message || 'Account creation request submitted for approval.');
        
        // Add local notification
        this.addLocalNotification({
          type: 'ACCOUNT_CREATION',
          title: 'Account Creation Request',
          message: `Account creation request submitted for ${input.customerName} (${input.accountId})`,
          severity: 'info',
          meta: {
            accountId: response.accountId,
            approvalId: response.approvalId,
            customerName: input.customerName,
            customerId: input.customerId,
            accountType: input.accountType,
            status: 'Pending'
          }
        });
        
        this.loadAccounts(); // Refresh account list
        this.loadUpdateRequests(); // Refresh update requests table
      }),
      catchError(error => {
        console.error('Error creating account:', error);
        this.setError(error.message || 'Failed to create account');
        return of(null);
      })
    ).subscribe();
  }
 
  // ---------- Update Requests ----------
  submitUpdateRequest(newValues: Account): void {
    const existing = this.getAccountById(newValues.accountId);
    if (!existing) {
      this.setError('Account not found.');
      return;
    }
    if (existing.status === 'PENDING') {
      this.setError('Account is still pending approval. Cannot modify until approved.');
      return;
    }

    // Build change summary
    const changes: string[] = [];
    if (existing.customerName !== newValues.customerName)
      changes.push(`Customer Name: "${existing.customerName}" → "${newValues.customerName}"`);
    if (existing.customerId !== newValues.customerId)
      changes.push(`Customer ID: "${existing.customerId}" → "${newValues.customerId}"`);
    if (existing.accountType !== newValues.accountType)
      changes.push(`Account Type: ${existing.accountType} → ${newValues.accountType}`);
    if (existing.status !== newValues.status)
      changes.push(`Status: ${existing.status} → ${newValues.status}`);

    const updateDto = {
      customerName: newValues.customerName,
      customerId: newValues.customerId,
      accountType: newValues.accountType === 'SAVINGS' ? 0 : newValues.accountType === 'CURRENT' ? 1 : 2,
      status: newValues.status === 'ACTIVE' ? 0 : 1
    };

    const accountId = newValues.accountId;
    this.accountApi.updateAccount(accountId, updateDto).pipe(
      tap((response) => {
        this.setSuccess(response.message || `Update request submitted for Account ${newValues.accountId}.`);
        
        // Add local notification
        this.addLocalNotification({
          type: 'UPDATE_REQUEST',
          title: 'Account Update Request',
          message: `Update request submitted for Account ${newValues.accountId}`,
          severity: 'info',
          meta: {
            accountId: newValues.accountId,
            approvalId: response.approvalId,
            updateId: response.approvalId,
            customerName: newValues.customerName,
            changes: changes,
            status: 'Pending'
          }
        });
        
        this.loadAccounts();
        this.loadUpdateRequests();
      }),
      catchError(error => {
        console.error('Error submitting update request:', error);
        this.setError(error.message || 'Failed to submit update request');
        return of(null);
      })
    ).subscribe();
  }
 
 
  /**
   * Record transaction via API
   * High-value transactions (>100k) will automatically create approval
   */
  recordTransaction(
    sourceAccountId: string,
    form: { type: TxnType; amount: number; toAccountId?: string; narrative?: string }
  ): void {
    const { type, amount, toAccountId, narrative } = form;
    if (!sourceAccountId) {
      this.setError('Select an account to record transactions.');
      return;
    }

    const source = this.getAccountById(sourceAccountId);
    if (!source) {
      this.setError('Account not found.');
      return;
    }
    if (source.status === 'CLOSED') {
      this.setError('Cannot record transactions on CLOSED accounts.');
      return;
    }
    if (source.status === 'PENDING') {
      this.setError('Cannot record transactions on PENDING accounts. Wait for approval first.');
      return;
    }
    if (amount <= 0) {
      this.setError('Amount must be greater than zero.');
      return;
    }

    // Check balance for withdrawals/transfers
    if ((type === 'WITHDRAWAL' || type === 'TRANSFER') && source.balance < amount) {
      this.setError('Insufficient balance.');
      return;
    }

    // Map transaction type
    let apiTxnType: number;
    if (type === 'DEPOSIT') apiTxnType = ApiTransactionType.Deposit;
    else if (type === 'WITHDRAWAL') apiTxnType = ApiTransactionType.Withdrawal;
    else apiTxnType = ApiTransactionType.Transfer;

    const dto: CreateTransactionDto = {
      accountId: sourceAccountId,
      transactionType: apiTxnType,
      amount: amount,
      narrative: narrative || '',
      toAccountId: toAccountId || undefined
    };

    this.transactionApi.createTransaction(dto).pipe(
      tap((response) => {
        // Show appropriate success message based on transaction status
        const statusMsg = response.status === 'Pending' ? ' (Pending approval)' : '';

        if (type === 'DEPOSIT') {
          this.setSuccess(`Deposited ₹${amount.toFixed(2)} to ${source.accountId}.${statusMsg}`);
        } else if (type === 'WITHDRAWAL') {
          this.setSuccess(`Withdrew ₹${amount.toFixed(2)} from ${source.accountId}.${statusMsg}`);
        } else {
          this.setSuccess(`Transferred ₹${amount.toFixed(2)} from ${source.accountId} to ${toAccountId}.${statusMsg}`);
        }

        // Add notification if transaction requires approval
        if (response.approvalId || response.requiresApproval || response.status === 'Pending') {
          this.addLocalNotification({
            type: 'TRANSACTION',
            title: 'Transaction Pending Approval',
            message: `${type} transaction of ₹${amount.toFixed(2)} on Account ${sourceAccountId} requires manager approval`,
            severity: 'warning',
            meta: {
              txnId: response.transactionId,
              accountId: sourceAccountId,
              amount: amount,
              type: type,
              toAccountId: toAccountId,
              approvalId: response.approvalId,
              status: 'Pending'
            }
          });
        }

        // Refresh data
        this.loadAccounts();
        this.loadTransactions();
      }),
      catchError(error => {
        console.error('Error recording transaction:', error);
        this.setError(error.message || 'Failed to record transaction');
        return of(null);
      })
    ).subscribe();
  }

  // ---------- Notifications (API-based) ----------
 
  markAsRead(id: string): void {
    const localNotifications = this.localNotificationsSubject.value;
    const updated = localNotifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.localNotificationsSubject.next(updated);
    this.saveLocalNotifications(updated);
  }
 
  markAsUnread(id: string): void {
    const localNotifications = this.localNotificationsSubject.value;
    const updated = localNotifications.map(n => 
      n.id === id ? { ...n, read: false } : n
    );
    this.localNotificationsSubject.next(updated);
    this.saveLocalNotifications(updated);
  }
 
  deleteNotification(id: string): void {
    // Track this ID as dismissed so it never reappears
    this.dismissedIds.add(id);
    this.saveDismissedIds();

    const localNotifications = this.localNotificationsSubject.value;
    const updated = localNotifications.filter(n => n.id !== id);
    this.localNotificationsSubject.next(updated);
    this.saveLocalNotifications(updated);
  }
 
  markAllAsRead(): void {
    const localNotifications = this.localNotificationsSubject.value;
    const updated = localNotifications.map(n => ({ ...n, read: true }));
    this.localNotificationsSubject.next(updated);
    this.saveLocalNotifications(updated);
  }
 
  clearAllNotifications(): void {
    // Track all current notification IDs as dismissed
    const all = this.localNotificationsSubject.value;
    all.forEach(n => this.dismissedIds.add(n.id));
    this.saveDismissedIds();

    this.localNotificationsSubject.next([]);
    this.saveLocalNotifications([]);
  }

  // ---------- Officer Profile ----------
  getOfficerProfile(): Observable<OfficerProfile> {
    // Prefer authenticated user data; fallback to a minimal empty profile
    const user = this.auth.getCurrentUser();
    if (user) {
      const parts = (user.name || '').trim().split(/\s+/);
      const firstName = parts.length ? parts[0] : '';
      const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
      const profile: OfficerProfile = {
        id: user.userId ? `OFF-${user.userId}` : 'OFF-UNKNOWN',
        firstName,
        lastName,
        email: user.email || '',
        phone: '',
        designation: user.role === 'bankOfficer' ? 'Banking Officer' : (user.role || ''),
        role: user.role || '',
        status: user.status || '',
        employeeId: user.userId || '',
        joinDate: '',
        department: user.branch || '',
        address: '',
        city: '',
        state: '',
        zipCode: ''
      };
      return of(profile);
    }

    // No authenticated user found; return a safe empty profile rather than a hardcoded demo
    const empty: OfficerProfile = {
      id: 'OFF-UNKNOWN',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      designation: '',
      role: '',
      status: '',
      employeeId: '',
      joinDate: '',
      department: '',
      address: '',
      city: '',
      state: '',
      zipCode: ''
    };
    return of(empty);
  }
}
 
// Utilities
function cryptoRandomId(): string {
  try {
    const buf = new Uint8Array(8);
    (window.crypto || (window as any).msCrypto).getRandomValues(buf);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  }
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
 
 