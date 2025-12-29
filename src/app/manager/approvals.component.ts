import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApprovalService, ApprovalRequest } from '../services/approval.service';

@Component({
  selector: 'app-manager-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.scss']
})
export class ApprovalsComponent implements OnInit {
  private approvalService = inject(ApprovalService);
  approvals: ApprovalRequest[] = [];
  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';
  
  // Modal state
  isModalOpen = false;
  selectedApproval: ApprovalRequest | null = null;
  comment = '';
  action: 'approve' | 'reject' | null = null;
  
  // Reason dropdowns
  selectedApproveReason: string = '';
  selectedRejectReason: string = '';
  
  // Approval and rejection reason options
  approveReasons = [
    'Customer request verified',
    'Compliance check passed',
    'Account details confirmed',
    'Risk assessment cleared',
    'Other'
  ];
  
  rejectReasons = [
    'Missing documents',
    'Compliance check failed',
    'Incorrect account details',
    'Risk assessment failed',
    'Other'
  ];

  ngOnInit(): void {
    this.loadApprovals();
  }

  switchTab(tab: 'pending' | 'approved' | 'rejected'): void {
    this.activeTab = tab;
  }

  getFilteredApprovals(): ApprovalRequest[] {
    return this.approvals.filter(a => a.status.toLowerCase() === this.activeTab);
  }

  loadApprovals(): void {
    this.approvals = this.approvalService.getAll() || [];
  }

  openModal(approval: ApprovalRequest, action: 'approve' | 'reject'): void {
    this.selectedApproval = approval;
    this.action = action;
    this.comment = '';
    this.selectedApproveReason = '';
    this.selectedRejectReason = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedApproval = null;
    this.comment = '';
    this.action = null;
    this.selectedApproveReason = '';
    this.selectedRejectReason = '';
  }

  isReasonOther(): boolean {
    if (this.action === 'approve') {
      return this.selectedApproveReason === 'Other';
    }
    return this.selectedRejectReason === 'Other';
  }

  getSelectedReason(): string {
    return this.action === 'approve' ? this.selectedApproveReason : this.selectedRejectReason;
  }

  isSubmitDisabled(): boolean {
    if (!this.getSelectedReason()) {
      return true;
    }
    if (this.isReasonOther() && !this.comment.trim()) {
      return true;
    }
    return false;
  }

  submitAction(): void {
    if (!this.selectedApproval || !this.action) return;

    // Validation
    const selectedReason = this.getSelectedReason();
    if (!selectedReason) {
      alert(`Please select a ${this.action === 'approve' ? 'approval' : 'rejection'} reason.`);
      return;
    }

    if (this.isReasonOther() && !this.comment.trim()) {
      alert(`Please provide a reason for ${this.action}.`);
      return;
    }

    // Prepare final comment
    let finalComment = this.comment.trim();
    if (!finalComment) {
      finalComment = this.action === 'approve' ? 'Approved by manager.' : 'Rejected by manager.';
    } else {
      finalComment = `${selectedReason}: ${finalComment}`;
    }

    // Submit action
    if (this.action === 'approve') {
      this.approvalService.updateStatus(this.selectedApproval.approvalId, 'Approved', finalComment);
    } else {
      this.approvalService.updateStatus(this.selectedApproval.approvalId, 'Rejected', finalComment);
    }

    this.loadApprovals();
    this.closeModal();
  }

  approve(approval: ApprovalRequest): void {
    this.openModal(approval, 'approve');
  }

  reject(approval: ApprovalRequest): void {
    this.openModal(approval, 'reject');
  }
}
