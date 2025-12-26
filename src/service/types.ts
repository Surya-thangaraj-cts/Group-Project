
// types.ts
export interface ComplianceSummary {
  totalTransactions: number;
  highValueCount: number;
  suspiciousCount: number;
  ctrFiled: number;
  strFiled: number;
  complianceScore: number;     // 0..100
  falsePositiveRate: number;   // 0..1

  monthlyLabels: string[];
  monthlyVolume: number[];
  monthlySuspicious: number[];
  monthlyCtr: number[];
  monthlyStr: number[];

  amountBuckets: { label: string; count: number }[];
  channelMix: { label: string; count: number }[];
  branchFlags: { branch: string; flags: number }[];
  topRules: { code: string; name: string; hits: number }[];
}
