import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ManagerService } from '../../services/manager.service';
import { ManagerNotificationService } from '../../services/manager-notification.service';
import { ApprovalDetailsDto, PagedApprovalDetails } from '../../services/manager-dtos';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.css']
})
export class ApprovalsComponent implements OnInit {
  // Filter for approval type
  typeFilter: 'all' | 'AccountCreation' | 'AccountUpdate' | 'HighValue' = 'all';
  // List of approval details
  approvalDetails: ApprovalDetailsDto[] = [];
  // Pagination controls
  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;
  // Active tab for approvals
  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';
  // Filtered approvals for display
  filteredItems: ApprovalDetailsDto[] = [];
  // Modal controls
  showApprovalModal = false;
  selectedApproval: ApprovalDetailsDto | null = null;
  approvalDecision: 'Approved' | 'Rejected' | null = null;
  approvalComments = '';
  commentError = '';
  // Alert controls
  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' = 'info';
  // Search query for filtering
  searchQuery = '';

  // Counts for each approval status
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;

  // ManagerNotificationService for refreshing notifications
  private notifService = inject(ManagerNotificationService);

  // Inject ManagerService and ActivatedRoute
  constructor(
    private managerService: ManagerService,
    private route: ActivatedRoute
  ) {}

  // Initialize approval counts and load approvals
  ngOnInit(): void {
    this.loadAllCounts();
    this.loadApprovals();
    this.handleQueryParams();
  }

  // Handle query params if needed
  handleQueryParams(): void {
    // Optionally implement query param handling for backend DTOs if needed
  }

  /**
   * Chooses a server-side sort field based on the active tab.
   * Ensure these map to valid backend sort fields.
   */
  private getServerSortBy(): string {
    const sortMap: Record<'pending' | 'approved' | 'rejected', string> = {
      pending: 'RequestedOn',   // or 'CreatedDate' on your backend
      approved: 'ApprovalDate',
      rejected: 'DecisionDate'  // or 'RejectedOn' on your backend
    };
    return sortMap[this.activeTab];
  }

  /**
   * Client-side fallback sorting: newest first using the most relevant date per tab.
   * This still helps if backend sorting isn't implemented yet.
   */
  private getComparableDate(a: ApprovalDetailsDto): number {
    let d: string | Date | undefined;

    if (this.activeTab === 'pending') {
      d = (a as any).requestedOn ?? (a as any).createdDate ?? (a as any).submittedOn ?? (a as any).requestDate;
    } else if (this.activeTab === 'approved') {
      d = (a as any).approvalDate ?? (a as any).decisionDate ?? (a as any).updatedAt;
    } else if (this.activeTab === 'rejected') {
      d = (a as any).decisionDate ?? (a as any).rejectedOn ?? (a as any).updatedAt;
    }

    // Generic fallbacks
    d = d ?? (a as any).updatedAt ?? (a as any).createdAt;

    if (!d) return 0;

    const t = new Date(d).getTime();
    return Number.isFinite(t) ? t : 0;
  }

  // Load approvals from backend and sort/filter
  loadApprovals(): void {
    let decision = '';
    if (this.activeTab === 'pending') decision = 'Pending';
    else if (this.activeTab === 'approved') decision = 'Approve';
    else if (this.activeTab === 'rejected') decision = 'Reject';

    const typeParam = this.typeFilter !== 'all' ? this.typeFilter : undefined;

    this.managerService
      .getApprovalDetails(this.pageNumber, this.pageSize, decision, typeParam)
      .subscribe((paged: PagedApprovalDetails) => {
        // Always sort by newest relevant date first
        const items = (paged.items || []).sort((a, b) => this.getComparableDate(b) - this.getComparableDate(a));
        if (this.pageNumber === 1) {
          this.approvalDetails = items;
        } else {
          this.approvalDetails = [...items, ...this.approvalDetails].sort((a, b) => this.getComparableDate(b) - this.getComparableDate(a));
        }
        this.totalCount = paged.totalCount;
        this.totalPages = paged.totalPages;

        this.filterApprovals();

        this.loadAllCounts();
      });
  }

  // Load counts for each approval status
  loadAllCounts(): void {
    // Fetch counts for each status separately from the backend
    this.managerService.getApprovalDetails(1, 1, 'Pending')
      .subscribe((paged: PagedApprovalDetails) => {
        this.pendingCount = paged.totalCount;
      });
    this.managerService.getApprovalDetails(1, 1, 'Approve')
      .subscribe((paged: PagedApprovalDetails) => {
        this.approvedCount = paged.totalCount;
      });
    this.managerService.getApprovalDetails(1, 1, 'Reject')
      .subscribe((paged: PagedApprovalDetails) => {
        this.rejectedCount = paged.totalCount;
      });
  }

  // Select tab and reload approvals
  selectTab(tab: 'pending' | 'approved' | 'rejected'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    this.pageNumber = 1;
    this.loadApprovals();
    // Do not reload all counts here to keep them stable
  }

  // Filter approvals by type and search
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

    // Always sort by approvalDate descending (newest first)
    items = items.slice().sort((a, b) => new Date(b.approvalDate).getTime() - new Date(a.approvalDate).getTime());

    this.filteredItems = items;
  }

  // Open modal to review approval
  openApprovalModal(approval: ApprovalDetailsDto): void {
    // Extract customerId from pendingChanges if not directly available
    let customerId = approval.customerId;
    if (!customerId && approval.pendingChanges) {
      try {
        const changes = JSON.parse(approval.pendingChanges as any);
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

  // Close approval modal
  closeApprovalModal(): void {
    this.showApprovalModal = false;
    this.selectedApproval = null;
    this.approvalDecision = null;
    this.approvalComments = '';
    this.commentError = '';
  }

  // Set approval decision
  setDecision(decision: 'Approved' | 'Rejected'): void {
    this.approvalDecision = decision;
  }

  // Submit approval decision to backend
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
        this.alertMessage =
          err?.error?.error || err?.error?.message || err?.message || 'Failed to update approval.';
      }
    });
  }

  // Show success alert and auto-hide
  showSuccessAlert(message: string): void {
    this.alertMessage = message;
    this.alertType = 'success';
    this.showAlert = true;

    // Auto-hide alert after 4 seconds
    setTimeout(() => {
      this.showAlert = false;
    }, 4000);
  }

  // Close alert
  closeAlert(): void {
    this.showAlert = false;
  }

  // Format date for display
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}