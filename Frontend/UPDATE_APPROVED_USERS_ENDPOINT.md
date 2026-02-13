# Update Approved Users Endpoint

Your current endpoint only returns Active users. To show Inactive users as well, update it:

## Change This in AdminController.cs

**Current (only Active users):**
```csharp
[HttpGet("approved-users")]
public async Task<IActionResult> ApprovedUsers()
{
    var list = await _db.Users
        .Where(u => u.Status == UserStatus.Active)  // ❌ Only Active
        .Select(u => new {
            u.UserId,
            u.Name,
            u.Email,
            u.Branch,
            Role = u.Role.ToString(),
            Status = u.Status.ToString()
        })
        .ToListAsync();

    return Ok(list);
}
```

**Updated (Active + Inactive users):**
```csharp
[HttpGet("approved-users")]
public async Task<IActionResult> ApprovedUsers()
{
    var list = await _db.Users
        .Where(u => u.Status != UserStatus.Pending)  // ✅ Exclude only Pending
        .Select(u => new {
            u.UserId,
            u.Name,
            u.Email,
            u.Branch,
            Role = u.Role.ToString(),
            Status = u.Status.ToString()
        })
        .ToListAsync();

    return Ok(list);
}
```

## What Changed

- **Before**: `u.Status == UserStatus.Active` (only Active users)
- **After**: `u.Status != UserStatus.Pending` (Active + Inactive users)

## After Making This Change

1. **Restart your ASP.NET Core API**
2. **Test in Angular**:
   - Deactivate a user (change to Inactive)
   - The user should remain in the existing users table with "Inactive" status
   - Pending users still won't appear in the existing users table

Now the existing users table will show both Active and Inactive users!
