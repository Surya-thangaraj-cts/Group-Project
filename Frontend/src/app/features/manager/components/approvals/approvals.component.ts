import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ManagerService } from '../../services/manager.service';
import { ManagerNotificationService } from '../../services/manager-notification.service';
import { ApprovalDto, ApprovalDetailsDto, PagedApprovals, PagedApprovalDetails } from '../../services/manager-dtos';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.css']
})
export class ApprovalsComponent implements OnInit {
    typeFilter: 'all' | 'AccountCreation' | 'AccountUpdate' | 'HighValue' = 'all';
  approvalDetails: ApprovalDetailsDto[] = [];
  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;
  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';
  filteredItems: ApprovalDetailsDto[] = [];
  showApprovalModal = false;
  selectedApproval: ApprovalDetailsDto | null = null;
  approvalDecision: 'Approved' | 'Rejected' | null = null;
  approvalComments = '';
  commentError = '';
  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' = 'info';
  searchQuery = '';

  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;


  private notifService = inject(ManagerNotificationService);

  constructor(
    private managerService: ManagerService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadAllCounts();
    this.loadApprovals();
    this.handleQueryParams();
  }

  handleQueryParams(): void {
    // Optionally implement query param handling for backend DTOs if needed
  }

  loadApprovals(): void {
    let decision = '';
    if (this.activeTab === 'pending') decision = 'Pending';
    else if (this.activeTab === 'approved') decision = 'Approve';
    else if (this.activeTab === 'rejected') decision = 'Reject';
    this.managerService.getApprovalDetails(this.pageNumber, this.pageSize, decision)
      .subscribe((paged: PagedApprovalDetails) => {
        let items = paged.items || [];
        // Sort approved tab in descending order by approvalDate
        if (this.activeTab === 'approved') {
          items = items.slice().sort((a, b) => new Date(b.approvalDate).getTime() - new Date(a.approvalDate).getTime());
        }
        this.approvalDetails = items;
        this.totalCount = paged.totalCount;
        this.totalPages = paged.totalPages;
        this.filterApprovals();
        // Update counts after each load to stay in sync
        this.loadAllCounts();
      });
  }


  loadAllCounts(): void {
    // Fetch counts for each status separately from the backend
    this.managerService.getApprovalDetails(1, 1, 'Pending').subscribe((paged: PagedApprovalDetails) => {
      this.pendingCount = paged.totalCount;
    });
    this.managerService.getApprovalDetails(1, 1, 'Approve').subscribe((paged: PagedApprovalDetails) => {
      this.approvedCount = paged.totalCount;
    });
    this.managerService.getApprovalDetails(1, 1, 'Reject').subscribe((paged: PagedApprovalDetails) => {
      this.rejectedCount = paged.totalCount;
    });
  }


// (Removed duplicate method implementations below. Only the first occurrence of each method is kept.)

  selectTab(tab: 'pending' | 'approved' | 'rejected'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    this.pageNumber = 1;
    this.loadApprovals();
    // Do not reload all counts here to keep them stable
  }

  // Removed: setPendingFilter, getPendingCountAll, getPendingCountAccountChanges, getTransaction, getNullableDate, getSelectedTransaction, getSelectedDataChange, and all data change logic

  // All references to getSelectedTransaction and related methods have been removed. Only backend DTO logic remains.

  filterApprovals(): void {
    let items = this.approvalDetails;
    // Filter by type
    if (this.typeFilter !== 'all') {
      items = items.filter(a => a.type === this.typeFilter);
    }
    // Filter by search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      items = items.filter(a =>
        (a.accountId && a.accountId.toString().includes(query)) ||
        (a.customerName && a.customerName.toLowerCase().includes(query)) ||
        (a.approvalId && a.approvalId.toString().includes(query)) ||
        (a.decision && a.decision.toLowerCase().includes(query))
      );
    }
    this.filteredItems = items;
  }

  openApprovalModal(approval: ApprovalDetailsDto): void {
    // Extract customerId from pendingChanges if not directly available
    let customerId = approval.customerId;
    if (!customerId && approval.pendingChanges) {
      try {
        const changes = JSON.parse(approval.pendingChanges);
        customerId = changes['CustomerId'] || changes['customerId'];
      } catch {}
    }
    
    this.selectedApproval = approval;
    if (customerId) {
      this.selectedApproval = { ...approval, customerId };
    }
    this.showApprovalModal = true;
    this.approvalDecision = null;
    this.approvalComments = '';
    this.commentError = '';
  }

  closeApprovalModal(): void {
    this.showApprovalModal = false;
    this.selectedApproval = null;
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
    if (!this.approvalDecision || !this.selectedApproval) {
      return;
    }

    const approvalId = this.selectedApproval.approvalId;

    if (!approvalId) {
      this.showAlert = true;
      this.alertType = 'error';
      this.alertMessage = 'Cannot process: approval ID is missing. Please refresh and try again.';
      return;
    }

    this.managerService.updateApprovalDecision(
      approvalId,
      this.approvalDecision === 'Approved' ? 1 : 2,
      this.approvalComments
    )
      .subscribe({
        next: () => {
          const isApproved = this.approvalDecision === 'Approved';
          const message = isApproved 
            ? `✓ Successfully approved! Item moved to Approved list.`
            : `✓ Successfully rejected! Item moved to Rejected list.`;
          this.showSuccessAlert(message);
          this.notifService.refresh();
          this.selectTab(isApproved ? 'approved' : 'rejected');
          this.loadApprovals();
          this.closeApprovalModal();
        },
        error: (err) => {
          this.showAlert = true;
          this.alertType = 'error';
          this.alertMessage = err?.error?.error || err?.error?.message || err?.message || 'Failed to update approval.';
        }
      });
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

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Removed all getSelectedTransaction, getSelectedDataChange, getApprovalDetails, and related helpers. Only backend DTO logic remains.

  // getApprovalId and getTransactionId methods removed as getSelectedTransaction no longer exists.

  // Removed getApprovalDetailsWithDefaults and all references to Approval, Transaction, and getApprovalDetails. Only backend DTO logic remains.

  // No longer needed: getSelectedDataChange, getSelectedTransaction
}

