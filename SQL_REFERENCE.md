# SQL Reference Guide

## Useful SQL Queries for Testing & Administration

### View All Users

```sql
SELECT 
    Id,
    UserId,
    Name,
    Email,
    Branch,
    CASE Role
        WHEN 1 THEN 'Admin'
        WHEN 2 THEN 'Manager'
        WHEN 3 THEN 'Officer'
        ELSE 'Unknown'
    END AS RoleName,
    CASE Status
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Active'
        WHEN 2 THEN 'Inactive'
        ELSE 'Unknown'
    END AS StatusName,
    CreatedAtUtc,
    UpdatedAtUtc
FROM Users
ORDER BY CreatedAtUtc DESC;
```

---

### View Pending Users (Awaiting Approval)

```sql
SELECT 
    UserId,
    Name,
    Email,
    Branch,
    CASE Role
        WHEN 1 THEN 'Admin'
        WHEN 2 THEN 'Manager'
        WHEN 3 THEN 'Officer'
    END AS RoleName,
    CreatedAtUtc
FROM Users
WHERE Status = 0  -- Pending
ORDER BY CreatedAtUtc DESC;
```

---

### Approve a User (Set Status to Active)

```sql
-- Approve specific user
UPDATE Users
SET Status = 1  -- Active
WHERE UserId = 'john123';

-- Verify the update
SELECT UserId, Name, 
    CASE Status
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Active'
        WHEN 2 THEN 'Inactive'
    END AS StatusName,
    UpdatedAtUtc
FROM Users
WHERE UserId = 'john123';
```

---

### Reject/Deactivate a User

```sql
-- Set user to Inactive
UPDATE Users
SET Status = 2  -- Inactive
WHERE UserId = 'john123';
```

---

### Approve All Pending Users

```sql
-- Use with caution!
UPDATE Users
SET Status = 1  -- Active
WHERE Status = 0;  -- Pending

-- Check how many were updated
SELECT @@ROWCOUNT AS UsersApproved;
```

---

### Find User by Email

```sql
SELECT 
    UserId,
    Name,
    Email,
    Branch,
    CASE Role
        WHEN 1 THEN 'Admin'
        WHEN 2 THEN 'Manager'
        WHEN 3 THEN 'Officer'
    END AS RoleName,
    CASE Status
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Active'
        WHEN 2 THEN 'Inactive'
    END AS StatusName
FROM Users
WHERE Email = 'john@example.com';
```

---

### Count Users by Status

```sql
SELECT 
    CASE Status
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Active'
        WHEN 2 THEN 'Inactive'
    END AS StatusName,
    COUNT(*) AS UserCount
FROM Users
GROUP BY Status
ORDER BY Status;
```

---

### Count Users by Role

```sql
SELECT 
    CASE Role
        WHEN 1 THEN 'Admin'
        WHEN 2 THEN 'Manager'
        WHEN 3 THEN 'Officer'
    END AS RoleName,
    COUNT(*) AS UserCount
FROM Users
GROUP BY Role
ORDER BY Role;
```

---

### Recently Registered Users (Last 7 Days)

```sql
SELECT 
    UserId,
    Name,
    Email,
    CASE Role
        WHEN 1 THEN 'Admin'
        WHEN 2 THEN 'Manager'
        WHEN 3 THEN 'Officer'
    END AS RoleName,
    CASE Status
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Active'
        WHEN 2 THEN 'Inactive'
    END AS StatusName,
    CreatedAtUtc
FROM Users
WHERE CreatedAtUtc >= DATEADD(day, -7, GETUTCDATE())
ORDER BY CreatedAtUtc DESC;
```

---

### Users by Branch

```sql
SELECT 
    Branch,
    COUNT(*) AS UserCount,
    SUM(CASE WHEN Status = 1 THEN 1 ELSE 0 END) AS ActiveUsers,
    SUM(CASE WHEN Status = 0 THEN 1 ELSE 0 END) AS PendingUsers,
    SUM(CASE WHEN Status = 2 THEN 1 ELSE 0 END) AS InactiveUsers
FROM Users
GROUP BY Branch
ORDER BY UserCount DESC;
```

---

### Check for Duplicate Emails

```sql
SELECT 
    Email,
    COUNT(*) AS DuplicateCount
FROM Users
GROUP BY Email
HAVING COUNT(*) > 1;
```

---

### Check for Duplicate UserIds

```sql
SELECT 
    UserId,
    COUNT(*) AS DuplicateCount
FROM Users
GROUP BY UserId
HAVING COUNT(*) > 1;
```

---

### Delete a User (Use with Caution!)

```sql
-- Delete by UserId
DELETE FROM Users
WHERE UserId = 'testuser123';

-- Verify deletion
SELECT * FROM Users WHERE UserId = 'testuser123';
-- Should return no rows
```

---

### Update User Information

```sql
-- Update email
UPDATE Users
SET Email = 'newemail@example.com'
WHERE UserId = 'john123';

-- Update branch
UPDATE Users
SET Branch = 'Los Angeles'
WHERE UserId = 'john123';

-- Update role
UPDATE Users
SET Role = 2  -- Manager
WHERE UserId = 'john123';
```

---

### Reset User Password Hash (Manual)

```sql
-- Note: You'll need to generate new hash and salt using your PasswordService
UPDATE Users
SET 
    PasswordHash = 'new_hash_here',
    PasswordSalt = 'new_salt_here'
WHERE UserId = 'john123';
```

---

### Search Users by Name (Partial Match)

```sql
SELECT 
    UserId,
    Name,
    Email,
    Branch,
    CASE Status
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Active'
        WHEN 2 THEN 'Inactive'
    END AS StatusName
FROM Users
WHERE Name LIKE '%John%'
ORDER BY Name;
```

---

### Active Users Only

```sql
SELECT 
    UserId,
    Name,
    Email,
    Branch,
    CASE Role
        WHEN 1 THEN 'Admin'
        WHEN 2 THEN 'Manager'
        WHEN 3 THEN 'Officer'
    END AS RoleName
FROM Users
WHERE Status = 1  -- Active
ORDER BY Name;
```

---

### Inactive Users Only

```sql
SELECT 
    UserId,
    Name,
    Email,
    Branch,
    CASE Role
        WHEN 1 THEN 'Admin'
        WHEN 2 THEN 'Manager'
        WHEN 3 THEN 'Officer'
    END AS RoleName,
    UpdatedAtUtc AS DeactivatedAt
FROM Users
WHERE Status = 2  -- Inactive
ORDER BY UpdatedAtUtc DESC;
```

---

### Full User Details for Debugging

```sql
SELECT 
    Id,
    UserId,
    Name,
    Email,
    Branch,
    Role,
    Status,
    LEN(PasswordHash) AS PasswordHashLength,
    LEN(PasswordSalt) AS PasswordSaltLength,
    CreatedAtUtc,
    UpdatedAtUtc,
    DATEDIFF(day, CreatedAtUtc, GETUTCDATE()) AS DaysSinceRegistration
FROM Users
WHERE UserId = 'john123';
```

---

## Quick Reference Table

### Status Values

| Value | Enum Name | Description |
|-------|-----------|-------------|
| 0 | Pending | User registered, awaiting approval |
| 1 | Active | User approved and can login |
| 2 | Inactive | User deactivated/rejected |

### Role Values

| Value | Enum Name | Description |
|-------|-----------|-------------|
| 1 | Admin | System administrator |
| 2 | Manager | Bank manager |
| 3 | Officer | Bank officer |

---

## Common Admin Tasks

### 1. Approve Multiple Pending Users

```sql
-- View all pending users first
SELECT UserId, Name, Email, CreatedAtUtc
FROM Users
WHERE Status = 0
ORDER BY CreatedAtUtc;

-- Approve specific users
UPDATE Users
SET Status = 1
WHERE UserId IN ('user1', 'user2', 'user3');
```

---

### 2. Bulk Update Branch

```sql
-- Update all users in old branch to new branch
UPDATE Users
SET Branch = 'New Branch Name'
WHERE Branch = 'Old Branch Name';

-- Verify
SELECT Branch, COUNT(*) AS UserCount
FROM Users
GROUP BY Branch;
```

---

### 3. Find Users Without Branch

```sql
SELECT UserId, Name, Email
FROM Users
WHERE Branch IS NULL OR Branch = '';
```

---

### 4. Promote User Role

```sql
-- Promote Officer to Manager
UPDATE Users
SET Role = 2  -- Manager
WHERE UserId = 'john123' AND Role = 3;  -- was Officer

-- Promote Manager to Admin
UPDATE Users
SET Role = 1  -- Admin
WHERE UserId = 'john123' AND Role = 2;  -- was Manager
```

---

## Testing Queries

### Create Test User Manually

```sql
INSERT INTO Users (UserId, Name, Email, Branch, Role, Status, PasswordHash, PasswordSalt, CreatedAtUtc, UpdatedAtUtc)
VALUES (
    'testuser999',
    'Test User',
    'test999@example.com',
    'Test Branch',
    3,  -- Officer
    1,  -- Active
    'dummy_hash',
    'dummy_salt',
    GETUTCDATE(),
    GETUTCDATE()
);
```

Note: Use your actual PasswordService to generate proper hash and salt!

---

### Cleanup Test Data

```sql
-- Delete test users
DELETE FROM Users
WHERE UserId LIKE 'test%' OR Email LIKE 'test%';

-- Or delete by specific pattern
DELETE FROM Users
WHERE Branch = 'Test Branch';
```

---

## Performance Queries

### Check Index Usage

```sql
-- View existing indexes
SELECT 
    i.name AS IndexName,
    OBJECT_NAME(i.object_id) AS TableName,
    i.type_desc AS IndexType,
    i.is_unique AS IsUnique
FROM sys.indexes i
WHERE OBJECT_NAME(i.object_id) = 'Users';
```

---

### Find Slow Queries (If Needed Later)

```sql
-- This helps identify performance issues
SELECT 
    text,
    execution_count,
    total_elapsed_time / 1000000.0 AS total_elapsed_time_seconds,
    total_elapsed_time / execution_count / 1000000.0 AS avg_elapsed_time_seconds
FROM sys.dm_exec_query_stats
CROSS APPLY sys.dm_exec_sql_text(sql_handle)
WHERE text LIKE '%Users%'
ORDER BY total_elapsed_time DESC;
```

---

## Safety Tips

⚠️ **Always backup before bulk updates:**

```sql
-- Create backup of Users table
SELECT * INTO Users_Backup_20260209
FROM Users;

-- Verify backup
SELECT COUNT(*) FROM Users_Backup_20260209;
```

⚠️ **Use transactions for critical updates:**

```sql
BEGIN TRANSACTION;

UPDATE Users
SET Status = 1
WHERE UserId = 'john123';

-- Check the result
SELECT * FROM Users WHERE UserId = 'john123';

-- If correct, commit; otherwise rollback
COMMIT;
-- ROLLBACK;
```

---

**Remember:** Always test queries in a development environment first!
