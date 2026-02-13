import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService, Approval, DataChangeApproval, Transaction } from '../../services/data.service';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.css']
})
export class ApprovalsComponent implements OnInit {
  approvals: Approval[] = [];
  dataChangeApprovals: DataChangeApproval[] = [];
  transactions: Transaction[] = [];
  
  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';
  filteredItems: any[] = [];
  approvalType: 'transaction' | 'datachange' = 'datachange';
  pendingFilter: 'all' | 'accountchanges' | 'highvalue' = 'all';
  approvedFilter: 'all' | 'accountchanges' | 'highvalue' = 'all';
  rejectedFilter: 'all' | 'accountchanges' | 'highvalue' = 'all';
  
  showApprovalModal = false;
  selectedItemId: string | null = null;
  approvalDecision: 'Approved' | 'Rejected' | null = null;
  approvalComments = '';
  commentError = '';
  
  // Alert system
  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' = 'info';
  
  searchQuery = '';


  constructor(
    public dataService: DataService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadApprovals();
    this.handleQueryParams();
  }

  handleQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['transactionId']) {
        // Find transaction and open its approval modal
        const approval = this.approvals.find(a => a.transactionId === params['transactionId']);
        if (approval) {
          this.activeTab = 'pending';
          this.approvalType = 'transaction';
          this.filterApprovals();
          setTimeout(() => {
            this.selectedItemId = approval.approvalId;
            this.showApprovalModal = true;
          }, 100);
        }
      } else if (params['changeId']) {
        // Find data change and open its approval modal
        const changeApproval = this.dataChangeApprovals.find(d => d.changeId === params['changeId']);
        if (changeApproval) {
          this.activeTab = 'pending';
          this.approvalType = 'datachange';
          this.filterApprovals();
          setTimeout(() => {
            this.selectedItemId = changeApproval.changeId;
            this.showApprovalModal = true;
          }, 100);
        }
      } else if (params['accountId']) {
        // Filter by account ID
        this.searchQuery = params['accountId'];
        this.filterApprovals();
      }
    });
  }

  loadApprovals(): void {
    this.dataService.getDataChangeApprovals().subscribe((data: DataChangeApproval[]) => {
      this.dataChangeApprovals = data;
      this.filterApprovals();
    });

    this.dataService.getApprovals().subscribe((data: Approval[]) => {
      this.approvals = data;
      this.filterApprovals();
    });
    
    this.dataService.getTransactions().subscribe((data: Transaction[]) => {
      this.transactions = data;
    });
  }

  selectTab(tab: 'pending' | 'approved' | 'rejected'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    this.pendingFilter = 'all';
    this.approvedFilter = 'all';
    this.rejectedFilter = 'all';
    this.filterApprovals();
  }

  setPendingFilter(filter: 'all' | 'accountchanges' | 'highvalue'): void {
    this.pendingFilter = filter;
    this.filterApprovals();
  }

  getPendingCountAll(): number {
    const pendingTransactions = this.approvals.filter(a => a.decision === 'Pending').length;
    const pendingDataChanges = this.dataChangeApprovals.filter(d => d.decision === 'Pending').length;
    return pendingTransactions + pendingDataChanges;
  }

  getPendingCountAccountChanges(): number {
    return this.dataChangeApprovals.filter(d => d.decision === 'Pending').length;
  }

  getPendingCountHighValue(): number {
    return this.approvals.filter(a => {
      if (a.decision !== 'Pending') return false;
      const transaction = this.transactions.find(t => t.id === a.transactionId);
      return transaction && transaction.amount > 100000;
    }).length;
  }

    setApprovedFilter(filter: 'all' | 'accountchanges' | 'highvalue'): void {
      this.approvedFilter = filter;
      this.filterApprovals();
    }

    getApprovedCountAll(): number {
      const approvedTransactions = this.approvals.filter(a => a.decision === 'Approved').length;
      const approvedDataChanges = this.dataChangeApprovals.filter(d => d.decision === 'Approved').length;
      return approvedTransactions + approvedDataChanges;
    }

    getApprovedCountAccountChanges(): number {
      return this.dataChangeApprovals.filter(d => d.decision === 'Approved').length;
    }

    getApprovedCountHighValue(): number {
      return this.approvals.filter(a => {
        if (a.decision !== 'Approved') return false;
        const transaction = this.transactions.find(t => t.id === a.transactionId);
        return transaction && transaction.amount > 100000;
      }).length;
    }

    setRejectedFilter(filter: 'all' | 'accountchanges' | 'highvalue'): void {
      this.rejectedFilter = filter;
      this.filterApprovals();
    }

    getRejectedCountAll(): number {
      const rejectedTransactions = this.approvals.filter(a => a.decision === 'Rejected').length;
      const rejectedDataChanges = this.dataChangeApprovals.filter(d => d.decision === 'Rejected').length;
      return rejectedTransactions + rejectedDataChanges;
    }

    getRejectedCountAccountChanges(): number {
      return this.dataChangeApprovals.filter(d => d.decision === 'Rejected').length;
    }

    getRejectedCountHighValue(): number {
      return this.approvals.filter(a => {
        if (a.decision !== 'Rejected') return false;
        const transaction = this.transactions.find(t => t.id === a.transactionId);
        return transaction && transaction.amount > 100000;
      }).length;
    }

  filterApprovals(): void {
    let filtered: any[] = [];

    if (this.activeTab === 'pending') {
      // Show both pending transaction approvals and pending data change approvals
      const pendingTransactions = this.approvals.filter(a => a.decision === 'Pending');
      const pendingDataChanges = this.dataChangeApprovals.filter(d => d.decision === 'Pending');
      
      // Apply pending filter
      if (this.pendingFilter === 'accountchanges') {
        filtered = pendingDataChanges;
      } else if (this.pendingFilter === 'highvalue') {
        filtered = pendingTransactions.filter(a => {
          const transaction = this.transactions.find(t => t.id === a.transactionId);
          return transaction && transaction.amount > 100000;
        });
      } else {
        filtered = [...pendingTransactions, ...pendingDataChanges];
      }
    } else if (this.activeTab === 'approved') {
      this.approvalType = 'transaction';
      // Show both approved data changes and approved transactions
      const approvedTransactions = this.approvals.filter(a => a.decision === 'Approved');
      const approvedDataChanges = this.dataChangeApprovals.filter(d => d.decision === 'Approved');
  
      // Apply approved filter
      if (this.approvedFilter === 'accountchanges') {
        filtered = approvedDataChanges;
      } else if (this.approvedFilter === 'highvalue') {
        filtered = approvedTransactions.filter(a => {
          const transaction = this.transactions.find(t => t.id === a.transactionId);
          return transaction && transaction.amount > 100000;
        });
      } else {
        filtered = [...approvedTransactions, ...approvedDataChanges];
      }
    } else if (this.activeTab === 'rejected') {
      this.approvalType = 'transaction';
      // Show both rejected data changes and rejected transactions
      const rejectedTransactions = this.approvals.filter(a => a.decision === 'Rejected');
      const rejectedDataChanges = this.dataChangeApprovals.filter(d => d.decision === 'Rejected');
  
      // Apply rejected filter
      if (this.rejectedFilter === 'accountchanges') {
        filtered = rejectedDataChanges;
      } else if (this.rejectedFilter === 'highvalue') {
        filtered = rejectedTransactions.filter(a => {
          const transaction = this.transactions.find(t => t.id === a.transactionId);
          return transaction && transaction.amount > 100000;
        });
      } else {
        filtered = [...rejectedTransactions, ...rejectedDataChanges];
      }
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      if (this.approvalType === 'datachange') {
        filtered = filtered.filter(d => 
          d.changeId.toLowerCase().includes(query) ||
          d.accountId.toLowerCase().includes(query) ||
          d.changeType.toLowerCase().includes(query)
        );
      } else {
        filtered = filtered.filter(a => {
          const transaction = this.transactions.find(t => t.id === a.transactionId);
          return (
            a.transactionId?.toLowerCase().includes(query) ||
            a.approvalId?.toLowerCase().includes(query) ||
            a.changeId?.toLowerCase().includes(query) ||
            (transaction && transaction.user.toLowerCase().includes(query))
          );
        });
      }
    }

    this.filteredItems = filtered;
  }

  openApprovalModal(itemId: string): void {
    this.selectedItemId = itemId;
    this.showApprovalModal = true;
    this.approvalDecision = null;
    this.approvalComments = '';
    this.commentError = '';
  }

  closeApprovalModal(): void {
    this.showApprovalModal = false;
    this.selectedItemId = null;
    this.approvalDecision = null;
    this.approvalComments = '';
    this.commentError = '';
  }

  setDecision(decision: 'Approved' | 'Rejected'): void {
    this.approvalDecision = decision;
  }

  submitApproval(): void {
    if (!this.approvalComments.trim()) {
      this.commentError = 'Comments are mandatory for approval decisions';
      return;
    }

    if (!this.approvalDecision || !this.selectedItemId) {
      return;
    }

    if (this.approvalType === 'datachange') {
      this.dataService.updateDataChangeApproval(this.selectedItemId, this.approvalDecision, this.approvalComments);
      // Notify requester about the decision
      const dataChange = this.dataChangeApprovals.find(d => d.changeId === this.selectedItemId);
      if (dataChange) {
        const userId = dataChange.requestedBy || 'SYSTEM';
        const msg = `${this.approvalDecision} decision recorded for Change ${dataChange.changeId}. Comments: ${this.approvalComments}`;
        this.dataService.addNotification(userId, 'ApprovalReminder', msg);
      }
    } else {
      this.dataService.updateApproval(this.selectedItemId, this.approvalDecision, this.approvalComments);
      // Notify account owner about the decision
      const approvalObj = this.approvals.find(a => a.approvalId === this.selectedItemId);
      const txn = approvalObj ? this.getTransaction(approvalObj.transactionId) : undefined;
      const userId = txn?.accountId || approvalObj?.reviewerId || 'SYSTEM';
      const msg = `${this.approvalDecision} decision recorded for Transaction ${approvalObj?.transactionId || ''}. Comments: ${this.approvalComments}`;
      this.dataService.addNotification(userId, 'ApprovalReminder', msg);
    }

    // Show success alert
    const message = this.approvalDecision === 'Approved' 
      ? `✓ Successfully approved! Item moved to Approved list.`
      : `✓ Successfully rejected! Item moved to Rejected list.`;
    
    this.showSuccessAlert(message);

    // Navigate to appropriate tab based on decision
    if (this.approvalDecision === 'Approved') {
      this.selectTab('approved');
    } else if (this.approvalDecision === 'Rejected') {
      this.selectTab('rejected');
    }

    this.loadApprovals();
    this.closeApprovalModal();
  }

  showSuccessAlert(message: string): void {
    this.alertMessage = message;
    this.alertType = 'success';
    this.showAlert = true;
    
    // Auto-hide alert after 4 seconds
    setTimeout(() => {
      this.showAlert = false;
    }, 4000);
  }

  closeAlert(): void {
    this.showAlert = false;
  }

  getTransaction(transactionId: string): Transaction | undefined {
    return this.transactions.find(t => t.id === transactionId);
  }

  getApprovalDetails(approvalId: string): { approval: Approval; transaction: Transaction } | undefined {
    return this.dataService.getApprovalWithTransaction(approvalId);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getNullableDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return this.formatDate(date);
  }

  getTransactionDate(): string {
    const transaction = this.getSelectedTransaction();
    if (!transaction || !transaction.transaction || !transaction.transaction.date) {
      return 'N/A';
    }
    return this.formatDate(transaction.transaction.date);
  }

  getDataChangeDate(): string {
    const dataChange = this.getSelectedDataChange();
    if (!dataChange || !dataChange.requestDate) {
      return 'N/A';
    }
    return this.formatDate(dataChange.requestDate);
  }

  // Transaction display methods with null safety
  getTransactionType(): string {
    const transaction = this.getSelectedTransaction();
    return transaction?.transaction?.type || 'N/A';
  }

  getTransactionStatus(): string {
    const transaction = this.getSelectedTransaction();
    return transaction?.transaction?.status || 'N/A';
  }

  getTransactionAmount(): number {
    const transaction = this.getSelectedTransaction();
    return transaction?.transaction?.amount || 0;
  }

  getTransactionUser(): string {
    const transaction = this.getSelectedTransaction();
    return transaction?.transaction?.user || 'N/A';
  }

  getTransactionAccountId(): string {
    const transaction = this.getSelectedTransaction();
    return transaction?.transaction?.accountId || 'N/A';
  }

  getApprovalId(): string {
    const transaction = this.getSelectedTransaction();
    return transaction?.approval?.approvalId || 'N/A';
  }

  getTransactionId(): string {
    const transaction = this.getSelectedTransaction();
    return transaction?.approval?.transactionId || 'N/A';
  }

  getApprovalDetailsWithDefaults(approvalId: string): { approval: Approval; transaction: Transaction } {
    const details = this.getApprovalDetails(approvalId);
    if (!details) {
      return {
        approval: { approvalId: '', transactionId: '', reviewerId: '', decision: 'Pending', comments: '', approvalDate: new Date() },
        transaction: { id: '', accountId: '', user: 'N/A', amount: 0, type: 'Transfer', date: new Date(), status: 'Pending' }
      };
    }
    return details;
  }

  getSelectedDataChange(): DataChangeApproval | undefined {
    return this.dataChangeApprovals.find(d => d.changeId === this.selectedItemId);
  }

  getSelectedTransaction(): { approval: Approval; transaction: Transaction } | undefined {
    return this.getApprovalDetails(this.selectedItemId || '');
  }
}