using UserApprovalApi.Models;

namespace UserApprovalApi.Repositories
{
    public interface IUserRepository
    {
        Task<List<User>> GetPendingUsersAsync(CancellationToken ct = default);
        Task<List<User>> GetApprovedUsersAsync(CancellationToken ct = default);
        Task<User?> GetByIdAsync(string userId, CancellationToken ct = default);
        Task<bool> EmailExistsAsync(string email, string excludeUserId, CancellationToken ct = default);
        Task UpdateAsync(User user, CancellationToken ct = default);
        //Task SaveChangesAsync(CancellationToken ct = default);


        Task<bool> AnyByUserIdOrEmailAsync(string userId, string email, CancellationToken ct = default);
        Task<User?> GetByUserIdAsync(string userId, CancellationToken ct = default);
        Task AddAsync(User user, CancellationToken ct = default);
        Task SaveChangesAsync(CancellationToken ct = default);

    }
}