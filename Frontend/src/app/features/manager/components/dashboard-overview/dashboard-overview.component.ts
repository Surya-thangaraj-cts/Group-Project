import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { ProfileService } from '../../services/profile.service';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  // Chart data
  accountGrowth: { month: string; newAccounts: number; activeAccounts: number }[] = [];

  // SVG chart sizes
  lineChartWidth = 600;
  lineChartHeight = 220;
  lineChartPath = '';
  lineChartPoints: { x: number; y: number; val: number }[] = [];

  barChartWidth = 600;
  barChartHeight = 180;

  private destroy$ = new Subject<void>();

  constructor(
    private dataService: DataService,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    // Load manager name from ProfileService
    this.profileService.profile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((profile) => {
        this.managerName = `${profile.firstName} ${profile.lastName}`;
      });

    // Combine approvals and data change approvals streams for real-time updates
    combineLatest([
      this.dataService.getApprovals(),
      this.dataService.getDataChangeApprovals()
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([approvals, dataChanges]) => {
        const pendingTransactionCount = approvals.filter(a => a.decision === 'Pending').length;
        const pendingDataChangeCount = dataChanges.filter(d => d.decision === 'Pending').length;
        this.pendingApprovalsCount = pendingTransactionCount + pendingDataChangeCount;
      });

    // Load account growth from data service
    this.accountGrowth = this.dataService.getAccountGrowthTrends();

    // Build chart path for account growth (activeAccounts over months)
    this.buildLineChart();
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
    return this.accountGrowth.map(a => a.month);
  }

  getBarChartMax(): number {
    if (!this.accountGrowth || this.accountGrowth.length === 0) return 1;
    return Math.max(...this.accountGrowth.map(a => a.newAccounts));
  }
}