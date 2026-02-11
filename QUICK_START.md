# 🚀 Quick Start Guide

## Prerequisites
- ✅ ASP.NET Core API running (your AuthController)
- ✅ Node.js and npm installed
- ✅ Angular CLI installed

## Step 1: Configure API URL

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7270/api'  // ← Change this to your API URL
};
```

## Step 2: Setup CORS in Your ASP.NET Core API

Add to your `Program.cs` (before `var app = builder.Build();`):

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

And after `var app = builder.Build();` (before UseAuthentication):

```csharp
app.UseCors("AllowAngularApp");
```

## Step 3: Install Dependencies (if needed)

```powershell
npm install
```

## Step 4: Start Your Applications

### Terminal 1 - ASP.NET Core API
```powershell
cd path/to/your/api
dotnet run
```

Verify API is running at: `https://localhost:7270` (or your configured port)

### Terminal 2 - Angular App
```powershell
cd Group-Project
npm start
```

Angular will run at: `http://localhost:4200`

## Step 5: Test Registration

1. Open browser: `http://localhost:4200/register`
2. Fill out the registration form:
   - User ID: `testuser123`
   - Name: `Test User`
   - Email: `test@example.com`
   - Branch: `Test Branch`
   - Role: Select a role
   - Password: `Test@123`
3. Click **Register**
4. Open browser DevTools → Network tab
5. You should see a POST request to `/api/auth/register`
6. Check your database - user should be created with Status = "Pending"

## Step 6: Approve User

Update the user status in your database:
```sql
UPDATE Users SET Status = 1 WHERE UserId = 'testuser123'
-- Assuming: 0=Pending, 1=Active, 2=Inactive
```

Or use your admin interface to approve the user.

## Step 7: Test Login

1. Go to: `http://localhost:4200/signin`
2. Enter credentials:
   - User ID: `testuser123`
   - Password: `Test@123`
3. Click **Sign In**
4. Check Network tab - should see POST to `/api/auth/login`
5. On success, you should be redirected to your dashboard
6. Check localStorage:
   ```
   auth_token: "eyJhbGciOiJIUzI1NiIs..."
   currentUser: {...user object...}
   ```

## Step 8: Verify Token is Sent

1. Navigate to any protected route
2. Open DevTools → Network tab
3. Click on any API request
4. Check Request Headers
5. You should see:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

## ✅ Success Checklist

- [ ] API is running on configured port
- [ ] CORS is configured in API
- [ ] Angular app is running on port 4200
- [ ] Registration creates user in database
- [ ] Login returns JWT token
- [ ] Token is stored in localStorage
- [ ] Token is sent with subsequent requests
- [ ] User is redirected to appropriate dashboard

## 🐛 Common Issues

### Registration fails with CORS error
**Fix**: Add CORS configuration to your API (see Step 2)

### Login returns 401
**Fix**: 
- Check user status is "Active" in database
- Verify password is correct
- Check your PasswordService.Verify method works

### Token not sent with requests
**Fix**: 
- Clear browser cache and localStorage
- Restart Angular dev server
- Verify interceptor is in app.config.ts

### API not reachable
**Fix**:
- Confirm API URL in environment.ts matches your API
- Check API is running: open `https://localhost:7270/api/auth/login` in browser
- Check firewall settings

## 📊 Testing Flow

```
User Registration
    ↓
POST /api/auth/register
    ↓
User Created (Status: Pending)
    ↓
Admin Approves (Status: Active)
    ↓
User Login
    ↓
POST /api/auth/login
    ↓
JWT Token Returned
    ↓
Token Stored in localStorage
    ↓
User Redirected to Dashboard
    ↓
All API Requests Include Token
```

## 🎯 Next Steps

1. Test with different user roles (Admin, Manager, Officer)
2. Test role-based route guards
3. Implement additional API endpoints as needed
4. Add error handling for token expiration
5. Implement refresh token mechanism
6. Add loading indicators during API calls

## 📞 Need Help?

Check these files:
- `API_INTEGRATION.md` - Detailed integration guide
- `INTEGRATION_COMPLETE.md` - Summary of changes
- `CORS_SETUP.cs` - CORS configuration reference

---

**Happy Coding! 🎉**
