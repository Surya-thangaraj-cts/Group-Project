using UserApprovalApi.DTOs;

namespace UserApprovalApi.Services
{
    public interface IComplianceService
    {
        Task<ComplianceMetricsDto> GetMetricsAsync(CancellationToken ct);
    }
}
