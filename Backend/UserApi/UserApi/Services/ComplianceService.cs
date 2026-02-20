using UserApprovalApi.DTOs;
using UserApprovalApi.Data;
using Microsoft.EntityFrameworkCore;

namespace UserApprovalApi.Services
{
    public class ComplianceService : IComplianceService
    {
        private readonly AppDbContext _context;

        public ComplianceService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ComplianceMetricsDto> GetMetricsAsync(CancellationToken ct)
        {
            // Get all users count for account growth calculation
            var totalUsers = await _context.Users.CountAsync(ct);
            var activeUsers = await _context.Users.CountAsync(u => u.Status == Models.UserStatus.Active, ct);

            // Calculate account growth rate (example: percentage of active users)
            var accountGrowthRate = totalUsers > 0 ? (double)activeUsers / totalUsers * 100 : 0;

            // Generate monthly transaction volume data
            // In a real scenario, you would query from a Transactions table
            // For now, we'll generate sample data based on user activity
            var monthlyTxnVolume = GenerateMonthlyData(activeUsers, 1000, 5000);
            var monthlySuspicious = GenerateMonthlyData(activeUsers, 10, 100);

            var monthlyLabels = new[]
            {
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            };

            // Generate amount buckets
            var amountBuckets = new[]
            {
                new AmountBucketDto { Label = "$0-1K", Count = activeUsers * 5 },
                new AmountBucketDto { Label = "$1K-10K", Count = activeUsers * 3 },
                new AmountBucketDto { Label = "$10K-100K", Count = activeUsers * 2 },
                new AmountBucketDto { Label = "$100K+", Count = activeUsers }
            };

            return new ComplianceMetricsDto
            {
                TotalTransactions = monthlyTxnVolume.Sum(),
                HighValueCount = amountBuckets.Where(b => b.Label.Contains("100K")).Sum(b => b.Count),
                AccountGrowthRate = Math.Round(accountGrowthRate, 2),
                MonthlyTxnVolume = monthlyTxnVolume,
                MonthlyLabels = monthlyLabels,
                MonthlySuspicious = monthlySuspicious,
                AmountBuckets = amountBuckets
            };
        }

        private int[] GenerateMonthlyData(int baseValue, int min, int max)
        {
            var random = new Random(DateTime.Now.Millisecond);
            var data = new int[12];
            
            for (int i = 0; i < 12; i++)
            {
                // Generate values with some variation based on active users
                var value = baseValue * random.Next(min, max) / 100;
                data[i] = Math.Max(min, Math.Min(max, value));
            }
            
            return data;
        }
    }
}
