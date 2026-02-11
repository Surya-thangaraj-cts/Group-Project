# Backend-Frontend Model Mapping

## C# Enums → TypeScript

### UserStatus Enum (C#)
```csharp
public enum UserStatus : byte
{
    Pending = 0,
    Active = 1,
    Inactive = 2
}
```

**TypeScript Equivalent:**
```typescript
type UserStatus = 'Pending' | 'Active' | 'Inactive';
// Or as enum values: 0 | 1 | 2
```

**API Response Format:** String values ("Pending", "Active", "Inactive")

---

### UserRole Enum (C#)
```csharp
public enum UserRole : byte
{
    Admin = 1,
    Manager = 2,
    Officer = 3
}
```

**TypeScript Equivalent:**
```typescript
type UserRole = 'Admin' | 'Manager' | 'Officer';
// Or frontend roles: 'admin' | 'bankManager' | 'bankOfficer'
```

**API Response Format:** String values ("Admin", "Manager", "Officer")

---

## Database Schema

### Users Table Structure

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | int | PRIMARY KEY, IDENTITY | Auto-generated primary key |
| `UserId` | nvarchar(50) | UNIQUE, NOT NULL | User's login identifier |
| `Name` | nvarchar(150) | NOT NULL | Full name |
| `Email` | nvarchar(256) | UNIQUE, NOT NULL | Email address |
| `Branch` | nvarchar(100) | NULL | Branch/location |
| `Role` | tinyint (byte) | NOT NULL | 1=Admin, 2=Manager, 3=Officer |
| `Status` | tinyint (byte) | NOT NULL | 0=Pending, 1=Active, 2=Inactive |
| `PasswordHash` | nvarchar(max) | NOT NULL | Hashed password |
| `PasswordSalt` | nvarchar(max) | NOT NULL | Password salt |
| `CreatedAtUtc` | datetime2(3) | DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `UpdatedAtUtc` | datetime2(3) | DEFAULT SYSUTCDATETIME() | Last update timestamp |

**Indexes:**
- `IX_Users_UserId` (Unique)
- `IX_Users_Email` (Unique)
- `IX_Users_Status`
- `IX_Users_Role`

---

## API Request/Response Models

### RegisterRequest (C# DTO)
```csharp
public class RegisterRequest
{
    public string UserId { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Branch { get; set; }
    public string Role { get; set; }    // "Admin", "Manager", "Officer"
    public string Password { get; set; }
}
```

**TypeScript Interface:**
```typescript
export interface RegisterRequest {
  userId: string;
  name: string;
  email: string;
  branch: string;
  role: string;        // "Admin", "Manager", "Officer"
  password: string;
}
```

**Example:**
```json
{
  "userId": "john123",
  "name": "John Doe",
  "email": "john@example.com",
  "branch": "New York",
  "role": "Officer",
  "password": "SecurePass@123"
}
```

---

### LoginRequest (C# DTO)
```csharp
public class LoginRequest
{
    public string UserId { get; set; }
    public string Password { get; set; }
}
```

**TypeScript Interface:**
```typescript
export interface LoginRequest {
  userId: string;
  password: string;
}
```

**Example:**
```json
{
  "userId": "john123",
  "password": "SecurePass@123"
}
```

---

### UserResponse (C# DTO)
```csharp
public class UserResponse
{
    public string UserId { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Branch { get; set; }
    public string Role { get; set; }      // "Admin", "Manager", "Officer"
    public string Status { get; set; }    // "Pending", "Active", "Inactive"
}
```

**TypeScript Interface:**
```typescript
export interface UserResponse {
  userId: string;
  name: string;
  email: string;
  branch: string;
  role: string;        // "Admin", "Manager", "Officer"
  status: string;      // "Pending", "Active", "Inactive"
}
```

**Example:**
```json
{
  "userId": "john123",
  "name": "John Doe",
  "email": "john@example.com",
  "branch": "New York",
  "role": "Officer",
  "status": "Active"
}
```

---

### LoginResponse (C# DTO)
```csharp
public class LoginResponse
{
    public string Token { get; set; }
    public UserResponse User { get; set; }
}
```

**TypeScript Interface:**
```typescript
export interface LoginResponse {
  token: string;
  user: UserResponse;
}
```

**Example:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "john123",
    "name": "John Doe",
    "email": "john@example.com",
    "branch": "New York",
    "role": "Officer",
    "status": "Active"
  }
}
```

---

## Role Mapping: Backend ↔ Frontend

Your backend uses these role names, but the Angular frontend uses different naming conventions for routing and internal logic.

| Backend (API) | Frontend (Internal) | Database Value | Description |
|--------------|---------------------|----------------|-------------|
| `Admin` | `admin` | 1 | System administrator |
| `Manager` | `bankManager` | 2 | Bank manager |
| `Officer` | `bankOfficer` | 3 | Bank officer |

### Role Normalization in Angular

The `auth.service.ts` includes a `normalizeRole()` function:

```typescript
private normalizeRole(role: string): 'admin' | 'bankManager' | 'bankOfficer' {
  const r = role.toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'bankmanager' || r === 'manager') return 'bankManager';
  return 'bankOfficer';
}
```

This ensures compatibility between:
- API responses: "Admin", "Manager", "Officer"
- Frontend routing: `/admin`, `/manager`, `/officer`
- Internal state: `admin`, `bankManager`, `bankOfficer`

---

## Status Mapping: Backend ↔ Frontend

| Backend (API) | Frontend | Database Value | Description |
|--------------|----------|----------------|-------------|
| `Pending` | `pending` | 0 | Awaiting approval |
| `Active` | `active` | 1 | Approved and active |
| `Inactive` | `inactive` | 2 | Deactivated |

---

## API Endpoints

### POST /api/auth/register

**Request:**
```typescript
RegisterRequest {
  userId: string;
  name: string;
  email: string;
  branch: string;
  role: string;        // "Admin", "Manager", or "Officer"
  password: string;
}
```

**Success Response (200 OK):**
```json
{
  "message": "Registration submitted. Await admin approval."
}
```

**Error Response (409 Conflict):**
```json
{
  "message": "UserId or Email already exists"
}
```

**Database Action:**
- Creates new User with Status = Pending (0)
- Hashes password with salt
- Sets CreatedAtUtc and UpdatedAtUtc

---

### POST /api/auth/login

**Request:**
```typescript
LoginRequest {
  userId: string;
  password: string;
}
```

**Success Response (200 OK):**
```typescript
LoginResponse {
  token: string;              // JWT token
  user: UserResponse;         // User details
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "message": "Invalid credentials"
}
```

**403 Forbidden:**
```
"Account not approved or inactive"
```

**Validation:**
- Checks if user exists
- Verifies password hash
- Checks if status is Active (1)
- Generates JWT token if all checks pass

---

## Angular Service Usage

### Register a User

```typescript
import { AuthService, RegisterRequest } from './auth/auth.service';

constructor(private authService: AuthService) {}

register() {
  const request: RegisterRequest = {
    userId: 'john123',
    name: 'John Doe',
    email: 'john@example.com',
    branch: 'New York',
    role: 'Officer',          // Use "Admin", "Manager", or "Officer"
    password: 'SecurePass@123'
  };

  this.authService.register(request).subscribe({
    next: (response) => {
      console.log(response.message);
      // Navigate to login
    },
    error: (error) => {
      console.error('Registration failed:', error.message);
    }
  });
}
```

### Login a User

```typescript
import { AuthService, LoginRequest } from './auth/auth.service';

constructor(private authService: AuthService) {}

login() {
  const credentials: LoginRequest = {
    userId: 'john123',
    password: 'SecurePass@123'
  };

  this.authService.login(credentials).subscribe({
    next: (response) => {
      console.log('Token:', response.token);
      console.log('User:', response.user);
      // Token and user are automatically stored
      // Navigate to dashboard
    },
    error: (error) => {
      console.error('Login failed:', error.message);
    }
  });
}
```

### Check Authentication

```typescript
const isAuthenticated = this.authService.isAuthenticated();
const currentUser = this.authService.getCurrentUser();
const token = this.authService.getToken();
```

---

## Data Flow

### Registration Flow

```
Angular Component
    ↓ (RegisterRequest)
auth.service.register()
    ↓ (HTTP POST)
ASP.NET Core API /api/auth/register
    ↓
Validate request
    ↓
Check for duplicates (UserId, Email)
    ↓
Hash password with salt
    ↓
Create User entity (Status = Pending)
    ↓
AppDbContext.Users.Add()
    ↓
SaveChangesAsync()
    ↓
Database INSERT
    ↓ (ApiResponse)
Return success message
    ↓
Angular displays message
```

### Login Flow

```
Angular Component
    ↓ (LoginRequest)
auth.service.login()
    ↓ (HTTP POST)
ASP.NET Core API /api/auth/login
    ↓
Find user by UserId
    ↓
Verify password hash
    ↓
Check status is Active
    ↓
Generate JWT token
    ↓
Create UserResponse
    ↓ (LoginResponse)
Return token + user
    ↓
Angular stores token in localStorage
    ↓
Angular stores user in localStorage
    ↓
auth.interceptor adds token to requests
    ↓
Navigate to dashboard
```

---

## Important Notes

1. **Role Values in Registration Form:**
   - Frontend should send: "Admin", "Manager", or "Officer"
   - Backend converts to enum: Admin=1, Manager=2, Officer=3

2. **Status After Registration:**
   - Always created as `Pending` (0)
   - Must be approved by admin to change to `Active` (1)

3. **Password Security:**
   - Never sent back to frontend
   - Stored as hash + salt in database
   - Verified using PasswordService.Verify()

4. **JWT Token:**
   - Generated on successful login
   - Stored in localStorage as `auth_token`
   - Automatically included in all HTTP requests via interceptor
   - Should contain user claims (userId, role, etc.)

5. **Timestamps:**
   - `CreatedAtUtc` set automatically on INSERT
   - `UpdatedAtUtc` updated automatically on any UPDATE
   - Handled by AppDbContext.TouchUpdatedAt()

---

## Testing Checklist

- [ ] Register creates user with Pending status
- [ ] Duplicate UserId returns 409 error
- [ ] Duplicate Email returns 409 error
- [ ] Login with Pending status returns 403
- [ ] Login with Inactive status returns 403
- [ ] Login with Active status returns token
- [ ] Token is stored in localStorage
- [ ] Token is sent with subsequent requests
- [ ] Role normalization works correctly
- [ ] Password is hashed in database
- [ ] Timestamps are set correctly
- [ ] UpdatedAtUtc updates on modifications

---

**All TypeScript interfaces are already implemented in `auth.service.ts` and match your C# backend models perfectly!** ✅
