namespace UserApprovalApi.DTOs
{
    public class ComplianceMetricsDto
    {
        public int TotalTransactions { get; set; }
        public int HighValueCount { get; set; }
        public double AccountGrowthRate { get; set; }
        public int[] MonthlyTxnVolume { get; set; } = Array.Empty<int>();
        public string[] MonthlyLabels { get; set; } = Array.Empty<string>();
        public int[] MonthlySuspicious { get; set; } = Array.Empty<int>();

        public AmountBucketDto[] AmountBuckets { get; set; } = Array.Empty<AmountBucketDto>();
    }

    public class AmountBucketDto
    {
        public string Label { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
