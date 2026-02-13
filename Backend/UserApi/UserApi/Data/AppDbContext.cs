using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UserApprovalApi.Models;

namespace UserApprovalApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // DbSets
        public DbSet<User> Users => Set<User>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ----- User entity configuration -----
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");

                entity.HasKey(u => u.Id);

                // Unique constraints
                entity.HasIndex(u => u.UserId).IsUnique();
                entity.HasIndex(u => u.Email).IsUnique();

                // Required fields & lengths (you can tweak as needed)
                entity.Property(u => u.UserId)
                      .IsRequired()
                      .HasMaxLength(50);

                entity.Property(u => u.Name)
                      .IsRequired()
                      .HasMaxLength(150);

                entity.Property(u => u.Email)
                      .IsRequired()
                      .HasMaxLength(256);

                entity.Property(u => u.Branch)
                      .HasMaxLength(100);

                // Enum -> tinyint (byte) conversions
                entity.Property(u => u.Status)
                      .HasConversion<byte>()           // stores 0/1/2
                      .IsRequired();

                entity.Property(u => u.Role)
                      .HasConversion<byte>()           // stores 1/2/3 for Admin/Manager/Officer
                      .IsRequired();

                // Timestamps
                entity.Property(u => u.CreatedAtUtc)
                      .HasColumnType("datetime2(3)")
                      .HasDefaultValueSql("SYSUTCDATETIME()");

                entity.Property(u => u.UpdatedAtUtc)
                      .HasColumnType("datetime2(3)")
                      .HasDefaultValueSql("SYSUTCDATETIME()");

                // Helpful filtered indexes
                entity.HasIndex(u => u.Status).HasDatabaseName("IX_Users_Status");
                entity.HasIndex(u => u.Role).HasDatabaseName("IX_Users_Role");
            });
        }

        /// <summary>
        /// Automatically sets UpdatedAtUtc on entities that have that property whenever SaveChanges is called.
        /// </summary>
        public override int SaveChanges()
        {
            TouchUpdatedAt();
            return base.SaveChanges();
        }

        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            TouchUpdatedAt();
            return base.SaveChanges(acceptAllChangesOnSuccess);
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            TouchUpdatedAt();
            return base.SaveChangesAsync(cancellationToken);
        }

        public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
        {
            TouchUpdatedAt();
            return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }

        private void TouchUpdatedAt()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Modified || e.State == EntityState.Added);

            foreach (var e in entries)
            {
                var prop = e.Properties.FirstOrDefault(p => p.Metadata.Name == nameof(User.UpdatedAtUtc));
                if (prop != null)
                {
                    prop.CurrentValue = DateTime.UtcNow;
                }
            }
        }
    }
}
