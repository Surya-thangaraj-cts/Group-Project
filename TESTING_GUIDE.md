# 🧪 Testing Guide

## Manual Testing with Browser DevTools

### 1. Test Registration

**Steps:**
1. Navigate to `http://localhost:4200/register`
2. Open DevTools (F12) → Network tab
3. Fill registration form
4. Click Register
5. Observe the network request

**Expected Network Request:**
```
Request URL: https://localhost:7270/api/auth/register
Request Method: POST
Content-Type: application/json

Request Payload:
{
  "userId": "testuser123",
  "name": "Test User",
  "email": "test@example.com",
  "branch": "Main Branch",
  "role": "Officer",
  "password": "Test@123"
}

Response (200 OK):
{
  "message": "Registration submitted. Await admin approval."
}
```

**Expected Database:**
```sql
SELECT * FROM Users WHERE UserId = 'testuser123'

Result:
UserId: testuser123
Name: Test User
Email: test@example.com
Branch: Main Branch
Role: Officer (or enum value)
Status: Pending (or 0)
PasswordHash: <hash>
PasswordSalt: <salt>
```

### 2. Test Login (Before Approval)

**Steps:**
1. Try to login with the newly registered user
2. Check Network tab

**Expected Response:**
```
Status: 403 Forbidden
Response: "Account not approved or inactive"
```

**Expected UI:**
- Warning message: "Your account is awaiting admin approval."

### 3. Approve User in Database

**SQL Query:**
```sql
-- Update user status to Active
UPDATE Users 
SET Status = 1  -- Assuming: 0=Pending, 1=Active, 2=Inactive
WHERE UserId = 'testuser123'
```

Or use your ASP.NET Core enum value for Active.

### 4. Test Login (After Approval)

**Steps:**
1. Navigate to `http://localhost:4200/signin`
2. Open DevTools → Network tab
3. Enter credentials and login

**Expected Network Request:**
```
Request URL: https://localhost:7270/api/auth/login
Request Method: POST

Request Payload:
{
  "userId": "testuser123",
  "password": "Test@123"
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "testuser123",
    "name": "Test User",
    "email": "test@example.com",
    "branch": "Main Branch",
    "role": "Officer",
    "status": "Active"
  }
}
```

**Check localStorage:**
Open Console tab and run:
```javascript
// Check if token exists
localStorage.getItem('auth_token')
// Should return: "eyJhbGciOiJIUzI1NiIs..."

// Check current user
JSON.parse(localStorage.getItem('currentUser'))
// Should return user object
```

### 5. Test Authenticated Request

**Steps:**
1. After login, navigate to any protected route
2. Open Network tab
3. Look for any API request
4. Click on the request → Headers tab

**Expected Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json
```

### 6. Test Token Interceptor

**Console Test:**
Open browser console and run:

```javascript
// Check if AuthService is working
const authService = document.querySelector('app-root')?.__ngContext__?.[8]?.get('AuthService');

// Check current user
authService?.getCurrentUser();

// Check if authenticated
authService?.isAuthenticated();
// Should return: true

// Check token
authService?.getToken();
// Should return: "eyJhbGci..."
```

### 7. Test Logout

**Steps:**
1. Call logout method
2. Check localStorage is cleared

**Console Commands:**
```javascript
// Logout
authService.signout();

// Verify token removed
localStorage.getItem('auth_token')
// Should return: null

// Verify user removed
localStorage.getItem('currentUser')
// Should return: null
```

### 8. Test Error Scenarios

#### Duplicate User ID
**Steps:**
1. Try to register with existing userId
2. Check response

**Expected:**
```
Status: 409 Conflict
Response:
{
  "message": "UserId or Email already exists"
}
```

#### Invalid Credentials
**Steps:**
1. Login with wrong password
2. Check response

**Expected:**
```
Status: 401 Unauthorized
Response:
{
  "message": "Invalid credentials"
}
```

#### Inactive User
**Steps:**
1. Set user status to Inactive in database
2. Try to login

**Expected:**
```
Status: 403 Forbidden
Response: "Account not approved or inactive"
```

## API Testing with Postman/Thunder Client

### Register Request

```
POST https://localhost:7270/api/auth/register
Content-Type: application/json

{
  "userId": "postmantest",
  "name": "Postman Test",
  "email": "postman@test.com",
  "branch": "Test Branch",
  "role": "Manager",
  "password": "Test@123"
}
```

### Login Request

```
POST https://localhost:7270/api/auth/login
Content-Type: application/json

{
  "userId": "postmantest",
  "password": "Test@123"
}
```

### Authenticated Request Example

```
GET https://localhost:7270/api/some-protected-endpoint
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Automated Testing Scenarios

### Test Case 1: Successful Registration
```
Given: User fills valid registration form
When: User clicks Register
Then: API returns 200 with success message
And: User is created in database with Pending status
And: User is redirected to signin page
```

### Test Case 2: Duplicate User Registration
```
Given: User enters existing userId
When: User clicks Register
Then: API returns 409 Conflict
And: Error message displays "User ID already exists"
And: Form is not cleared
```

### Test Case 3: Successful Login
```
Given: User has Active status in database
When: User enters valid credentials and clicks Sign In
Then: API returns 200 with token and user data
And: Token is stored in localStorage
And: User is redirected to appropriate dashboard
And: Subsequent requests include Authorization header
```

### Test Case 4: Login with Pending Status
```
Given: User has Pending status in database
When: User tries to login
Then: API returns 403
And: Warning message displays "awaiting admin approval"
And: User stays on signin page
```

### Test Case 5: Login with Invalid Credentials
```
Given: User enters wrong password
When: User clicks Sign In
Then: API returns 401
And: Error message displays "Invalid credentials"
And: Password field is cleared
```

## Network Tab Checklist

When testing, verify these in Network tab:

**Registration Request:**
- [x] Method: POST
- [x] URL: /api/auth/register
- [x] Content-Type: application/json
- [x] Request body has all required fields
- [x] Response status: 200 or 409
- [x] Response body has message

**Login Request:**
- [x] Method: POST
- [x] URL: /api/auth/login
- [x] Content-Type: application/json
- [x] Request body has userId and password
- [x] Response status: 200, 401, or 403
- [x] Response has token and user object (if successful)

**Authenticated Requests:**
- [x] Authorization header present
- [x] Header format: "Bearer <token>"
- [x] Token matches localStorage value

## Console Debugging Commands

```javascript
// Check environment
console.log('API URL:', 'see environment.ts');

// Check localStorage
console.log('Token:', localStorage.getItem('auth_token'));
console.log('User:', JSON.parse(localStorage.getItem('currentUser')));

// Clear everything
localStorage.clear();

// Check if interceptor is working
// Make any HTTP request and check if Authorization header is added

// Manual login test (after importing AuthService)
// authService.login({userId: 'test', password: 'Test@123'}).subscribe(
//   res => console.log('Success:', res),
//   err => console.error('Error:', err)
// );
```

## Expected Database State

### After Registration
```
Users Table:
+----------+---------+-------------+--------+--------+---------+
| UserId   | Name    | Email       | Branch | Role   | Status  |
+----------+---------+-------------+--------+--------+---------+
| test123  | Test U. | test@e.com  | Main   | Officer| Pending |
+----------+---------+-------------+--------+--------+---------+
```

### After Approval
```
Users Table:
+----------+---------+-------------+--------+--------+---------+
| UserId   | Name    | Email       | Branch | Role   | Status  |
+----------+---------+-------------+--------+--------+---------+
| test123  | Test U. | test@e.com  | Main   | Officer| Active  |
+----------+---------+-------------+--------+--------+---------+
```

## CORS Verification

If you see this error in console:
```
Access to XMLHttpRequest at 'https://localhost:7270/api/auth/login' 
from origin 'http://localhost:4200' has been blocked by CORS policy
```

**Fix:**
1. Add CORS policy to your ASP.NET Core API
2. Restart your API
3. Clear browser cache
4. Try again

See `CORS_SETUP.cs` for configuration.

## Success Indicators

✅ **Registration Working:**
- Network request succeeds
- User created in database
- Success message shown
- Redirects to signin

✅ **Login Working:**
- Network request succeeds
- JWT token received
- Token stored in localStorage
- User object stored
- Redirects to dashboard

✅ **Authentication Working:**
- Protected routes accessible
- Token sent with requests
- Token format correct
- User data available

✅ **Error Handling Working:**
- CORS errors resolved
- 401 shows invalid credentials
- 403 shows approval needed
- 409 shows duplicate user
- Messages display correctly

---

**Happy Testing! 🎉**
