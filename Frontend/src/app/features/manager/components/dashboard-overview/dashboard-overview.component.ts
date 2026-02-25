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
  managerName = '';
  pendingApprovalsCount = 0;
  dashboardOverview: ManagerDashboardOverviewDto | null = null;
  monthlyLabels: string[] = [];
  monthlyTxnVolume: number[] = [];
  monthlySuspicious: number[] = [];
  amountBuckets: { label: string; count: number }[] = [];
  accountGrowth: { month: string; newAccounts: number; activeAccounts: number }[] = [];
  lineChartWidth = 600;
  lineChartHeight = 220;
  lineChartPath = '';
  lineChartPoints: { x: number; y: number; val: number }[] = [];
  barChartWidth = 600;
  barChartHeight = 180;
  private destroy$ = new Subject<void>();

  constructor(
    private managerService: ManagerService,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    // Load manager name from ProfileService
    this.profileService.profile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((profile) => {
        this.managerName = `${profile.firstName} ${profile.lastName}`;
      });

    // Fetch manager dashboard overview from backend
    this.managerService.getManagerDashboardOverview()
      .pipe(takeUntil(this.destroy$))
      .subscribe((overview) => {
        console.log('Manager Dashboard Overview from backend:', overview);
        this.dashboardOverview = overview;
        // Use pendingApprovalsCount from overview (no separate API call needed)
        this.pendingApprovalsCount = overview.pendingApprovalsCount;
        this.monthlyLabels = overview.monthlyLabels;
        this.monthlyTxnVolume = overview.monthlyTxnVolume;
        this.monthlySuspicious = overview.monthlySuspicious;
        this.amountBuckets = overview.amountBuckets;
        // Build account growth array for chart
        this.accountGrowth = overview.monthlyLabels.map((label: string, idx: number) => ({
          month: label,
          newAccounts: overview.monthlyNewAccounts[idx],
          activeAccounts: overview.monthlyActiveAccounts[idx]
        }));
        this.buildLineChart();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

    const points: { x: number; y: number; val: number }[] = values.map((v, i) => {
      const x = Math.round(padding + i * stepX);
      const y = Math.round(padding + (1 - (v - min) / range) * height);
      return { x, y, val: v };
    });

    this.lineChartPoints = points;

    // build svg path
    let d = '';
    points.forEach((p, i) => {
      d += (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
    });
    this.lineChartPath = d;
  }

  // Helpers for template bindings
  getLineChartLabels(): string[] {
    return this.monthlyLabels;
  }

  getBarChartMax(): number {
    if (!this.amountBuckets || this.amountBuckets.length === 0) return 1;
    return Math.max(...this.amountBuckets.map(a => a.count));
  }
}