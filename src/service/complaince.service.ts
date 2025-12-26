
// compliance.service.ts
import { Injectable } from '@angular/core';
// import { ComplianceSummary } from '/types';
import { ComplianceSummary } from './types';

@Injectable({ providedIn: 'root' })
export class ComplianceService {
  getSummary(_range: { from: Date; to: Date; branch?: string }): ComplianceSummary {
    const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyVolume = [1320, 1412, 1510, 1388, 1604, 1722];
    const monthlySuspicious = [12, 18, 14, 21, 19, 24];
    const monthlyCtr = [2, 3, 2, 3, 4, 5];
    const monthlyStr = [1, 2, 1, 3, 2, 3];

    const totalTransactions = monthlyVolume.reduce((a, b) => a + b, 0);
    const suspiciousCount = monthlySuspicious.reduce((a, b) => a + b, 0);
    const ctrFiled = monthlyCtr.reduce((a, b) => a + b, 0);
    const strFiled = monthlyStr.reduce((a, b) => a + b, 0);
    const highValueCount = Math.round(totalTransactions * 0.12);
    const falsePositiveRate = 0.28;

    return {
      totalTransactions,
      highValueCount,
      suspiciousCount,
      ctrFiled,
      strFiled,
      complianceScore: this.computeComplianceScore({ ctrFiled, strFiled, suspiciousCount, falsePositiveRate }),
      falsePositiveRate,
      monthlyLabels,
      monthlyVolume,
      monthlySuspicious,
      monthlyCtr,
      monthlyStr,
      amountBuckets: [
        { label: '< ₹10k', count: 540 },
        { label: '₹10k–₹50k', count: 830 },
        { label: '₹50k–₹1L', count: 310 },
        { label: '> ₹1L', count: 160 },
      ],
      channelMix: [
        { label: 'UPI', count: 980 },
        { label: 'NEFT', count: 620 },
        { label: 'RTGS', count: 210 },
        { label: 'Cash', count: 150 },
        { label: 'Cheque', count: 70 },
      ],
      branchFlags: [
        { branch: 'Gurgaon', flags: 12 },
        { branch: 'Noida', flags: 9 },
        { branch: 'Jaipur', flags: 7 },
        { branch: 'Pune', flags: 6 },
        { branch: 'Mumbai', flags: 5 },
      ],
      topRules: [
        { code: 'R01', name: 'Amount > ₹10L', hits: 18 },
        { code: 'R05', name: 'Structuring / smurfing', hits: 12 },
        { code: 'R11', name: 'Rapid in/out 24h', hits: 9 },
        { code: 'R20', name: 'High-risk counterparty', hits: 7 },
      ],
    };
  }

  private computeComplianceScore(input: { ctrFiled: number; strFiled: number; suspiciousCount: number; falsePositiveRate: number }) {
    const fpPenalty = Math.min(20, input.falsePositiveRate * 100 * 0.2);
    const strPenalty = Math.min(30, input.strFiled * 2);
    const suspPenalty = Math.min(30, input.suspiciousCount * 0.1);
    const ctrBonus   = Math.min(10, input.ctrFiled * 0.5);
    return Math.max(0, Math.min(100, Math.round(100 - fpPenalty - strPenalty - suspPenalty + ctrBonus)));
  }
}

