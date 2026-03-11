import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerService } from '../../services/manager.service';
import { ProfileService } from '../../services/profile.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ManagerDashboardOverviewDto } from '../../services/manager-dtos';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-overview.component.html',
  styleUrl: './dashboard-overview.component.css'
})
export class DashboardOverviewComponent implements OnInit, OnDestroy {
  // Manager's name for display
  managerName = '';
  // Count of pending approvals
  pendingApprovalsCount = 0;
  // Dashboard overview data
  dashboardOverview: ManagerDashboardOverviewDto | null = null;
  // Monthly labels for charts
  monthlyLabels: string[] = [];
  // Monthly transaction volume
  monthlyTxnVolume: number[] = [];
  // Monthly suspicious transactions
  monthlySuspicious: number[] = [];
  // Amount buckets for bar chart
  amountBuckets: { label: string; count: number }[] = [];
  // Account growth data for line chart
  accountGrowth: { month: string; newAccounts: number; activeAccounts: number }[] = [];
  // Chart dimensions
  lineChartWidth = 600;
  lineChartHeight = 220;
  lineChartPath = '';
  lineChartPoints: { x: number; y: number; val: number }[] = [];
  barChartWidth = 600;
  barChartHeight = 180;
  // Subject to handle unsubscription
  private destroy$ = new Subject<void>();

  // Inject ManagerService and ProfileService
  constructor(
    private managerService: ManagerService,
    private profileService: ProfileService
  ) {}

  // Initialize dashboard data and charts
  ngOnInit() {
    // Load manager name from ProfileService
    this.profileService.profile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((profile) => {
        this.managerName = `${profile.firstName} ${profile.lastName}`;
      });

    // Load dashboard overview data
    this.managerService.getManagerDashboardOverview()
      .pipe(takeUntil(this.destroy$))
      .subscribe((overview) => {
        this.dashboardOverview = overview;
        this.pendingApprovalsCount = overview.pendingApprovalsCount;
        this.monthlyLabels = overview.monthlyLabels;
        this.monthlyTxnVolume = overview.monthlyTxnVolume;
        this.monthlySuspicious = overview.monthlySuspicious;
        this.amountBuckets = overview.amountBuckets;
        this.accountGrowth = overview.monthlyLabels.map((label: string, idx: number) => ({
          month: label,
          newAccounts: overview.monthlyNewAccounts[idx],
          activeAccounts: overview.monthlyActiveAccounts[idx]
        }));
        this.buildLineChart();
      });
  }

  // Clean up subscriptions on destroy
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Build line chart data for account growth
  private buildLineChart(): void {
    if (!this.accountGrowth || this.accountGrowth.length === 0) return;
    const padding = 30;
    const width = this.lineChartWidth - padding * 2;
    const height = this.lineChartHeight - padding * 2;
    const values = this.accountGrowth.map(a => a.activeAccounts);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = width / (values.length - 1 || 1);

    // Calculate chart points
    const points: { x: number; y: number; val: number }[] = values.map((v, i) => {
      const x = Math.round(padding + i * stepX);
      const y = Math.round(padding + (1 - (v - min) / range) * height);
      return { x, y, val: v };
    });

    this.lineChartPoints = points;

    // Build SVG path for line chart
    let d = '';
    points.forEach((p, i) => {
      d += (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
    });
    this.lineChartPath = d;
  }

  // Get labels for line chart
  getLineChartLabels(): string[] {
    return this.monthlyLabels;
  }

  // Get max value for bar chart scaling
  getBarChartMax(): number {
    if (!this.amountBuckets || this.amountBuckets.length === 0) return 1;
    return Math.max(...this.amountBuckets.map(a => a.count));
  }
}