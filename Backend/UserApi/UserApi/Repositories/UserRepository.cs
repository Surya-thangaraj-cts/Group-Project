using Microsoft.EntityFrameworkCore;
using UserApprovalApi.Data;
using UserApprovalApi.Models;

namespace UserApprovalApi.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _db;

        public UserRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<User>> GetPendingUsersAsync(CancellationToken ct = default)
        {
            return await _db.Users
                .Where(u => u.Status == UserStatus.Pending)
                .ToListAsync(ct);
        }

        public async Task<List<User>> GetApprovedUsersAsync(CancellationToken ct = default)
        {
            return await _db.Users
                .Where(u => u.Status != UserStatus.Pending)
                .ToListAsync(ct);
        }

        public async Task<User?> GetByIdAsync(string userId, CancellationToken ct = default)
        {
            return await _db.Users.SingleOrDefaultAsync(u => u.UserId == userId, ct);
        }

        public async Task<bool> EmailExistsAsync(string email, string excludeUserId, CancellationToken ct = default)
        {
            return await _db.Users.AnyAsync(u => u.Email == email && u.UserId != excludeUserId, ct);
        }

        public Task UpdateAsync(User user, CancellationToken ct = default)
        {
            _db.Users.Update(user);
            return Task.CompletedTask;
        }

        //public Task SaveChangesAsync(CancellationToken ct = default)
        //{
        //    return _db.SaveChangesAsync(ct);
        //}

        public Task<bool> AnyByUserIdOrEmailAsync(string userId, string email, CancellationToken ct = default)
        {
            return _db.Users.AnyAsync(u => u.UserId == userId || u.Email == email, ct);
        }

        public Task<User?> GetByUserIdAsync(string userId, CancellationToken ct = default)
        {
            return _db.Users.SingleOrDefaultAsync(u => u.UserId == userId, ct);
        }

        public async Task AddAsync(User user, CancellationToken ct = default)
        {
            await _db.Users.AddAsync(user, ct);
        }

        public Task SaveChangesAsync(CancellationToken ct = default)
        {
            return _db.SaveChangesAsync(ct);
        }
    }
}




