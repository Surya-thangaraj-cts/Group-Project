import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Report } from '../../services/data.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  monthlyData: any[] = [];
  accountGrowthTrends: any[] = [];
  transactionVolumeAnalysis: any[] = [];
  reports: Report[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    // Load monthly expenditure data
    const raw = this.dataService.getMonthlyData();
    this.monthlyData = raw.map(item => ({
      name: item.month,
      value: item.expenditure
    }));

    // Load account growth trends
    this.accountGrowthTrends = this.dataService.getAccountGrowthTrends();

    // Load transaction volume analysis
    this.transactionVolumeAnalysis = this.dataService.getTransactionVolumeAnalysis();

    // Load reports
    this.dataService.getReports().subscribe(data => {
      this.reports = data;
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  onResize(event: any) {
    // Handle resize
  }
}