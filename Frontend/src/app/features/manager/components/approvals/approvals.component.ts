import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ManagerService } from '../../services/manager.service';
import { ApprovalDto, ApprovalDetailsDto, PagedApprovals, PagedApprovalDetails } from '../../services/manager-dtos';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.css']
})
export class ApprovalsComponent implements OnInit {
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
        this.approvalDetails = paged.items;
        this.totalCount = paged.totalCount;
        this.totalPages = paged.totalPages;
        this.filteredItems = this.approvalDetails;
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
    if (!this.searchQuery.trim()) {
      this.filteredItems = this.approvalDetails;
      return;
    }
    const query = this.searchQuery.toLowerCase();
    this.filteredItems = this.approvalDetails.filter(a =>
      (a.accountId && a.accountId.toString().includes(query)) ||
      (a.customerName && a.customerName.toLowerCase().includes(query)) ||
      (a.approvalId && a.approvalId.toString().includes(query)) ||
      (a.decision && a.decision.toLowerCase().includes(query))
    );
  }

  openApprovalModal(approval: ApprovalDetailsDto): void {
    this.selectedApproval = approval;
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
    this.managerService.updateApprovalDecision(
      Number(this.selectedApproval.approvalId),
      this.approvalDecision === 'Approved' ? 1 : 2,
      this.approvalComments
    )
      .subscribe({
        next: () => {
          const message = this.approvalDecision === 'Approved' 
            ? `✓ Successfully approved! Item moved to Approved list.`
            : `✓ Successfully rejected! Item moved to Rejected list.`;
          this.showSuccessAlert(message);
          this.selectTab(this.approvalDecision === 'Approved' ? 'approved' : 'rejected');
          this.loadApprovals();
          this.closeApprovalModal();
        },
        error: (err) => {
          this.showAlert = true;
          this.alertType = 'error';
          this.alertMessage = err?.error?.error || 'Failed to update approval.';
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

