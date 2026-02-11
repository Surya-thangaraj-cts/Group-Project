# 🔧 Troubleshooting: Cannot Connect to API (Status 0 Error)

## Error Message
```
Login error: Error: Server error: 0
```

This error means the browser **cannot connect** to your ASP.NET Core API.

---

## ✅ Checklist to Fix

### 1. **Is Your ASP.NET Core API Running?**

**Check:**
```powershell
# Open a PowerShell terminal and navigate to your API project
cd path\to\your\UserApprovalApi
dotnet run
```

**Expected Output:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:7270
      Now listening on: http://localhost:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

**Test in Browser:**
- Open: `https://localhost:7270/api/auth/login`
- You should see an error page (not Chrome's "This site can't be reached")
- If you see "This site can't be reached" → API is NOT running

---

### 2. **Is the API URL Correct?**

**Check Angular Configuration:**

Open: `Group-Project/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7270/api'  // ← Must match your API port
};
```

**Find Your API Port:**
- Check your API's `Properties/launchSettings.json`
- Look for `"applicationUrl"` in the https profile
- Update `environment.ts` to match

**Example launchSettings.json:**
```json
{
  "profiles": {
    "https": {
      "applicationUrl": "https://localhost:7270;http://localhost:5000"
    }
  }
}
```

---

### 3. **Is CORS Configured in Your API?**

**Add CORS to your ASP.NET Core API:**

Edit your `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(...);

// ✅ ADD THIS: CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200")  // Angular dev server
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

var app = builder.Build();

// ✅ ADD THIS: Use CORS (BEFORE UseAuthentication/UseAuthorization)
app.UseCors("AllowAngular");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
```

**⚠️ Important:** `app.UseCors()` must come **before** `UseAuthentication()` and `UseAuthorization()`

---

### 4. **Restart Both Applications**

After making CORS changes:

**Terminal 1 - Restart API:**
```powershell
# Stop the API (Ctrl+C)
# Then restart
dotnet run
```

**Terminal 2 - Restart Angular:**
```powershell
# Stop Angular (Ctrl+C)
# Then restart
npm start
```

**Clear Browser Cache:**
- Press `Ctrl+Shift+Delete`
- Clear cached images and files
- Or use Incognito/Private mode

---

### 5. **Test API Manually**

**Using Browser DevTools:**

1. Open Angular app: `http://localhost:4200/signin`
2. Open DevTools (F12) → Console tab
3. Run this command:

```javascript
fetch('https://localhost:7270/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'test', password: 'test' })
})
.then(r => r.json())
.then(d => console.log('Success:', d))
.catch(e => console.error('Error:', e));
```

**Expected Results:**

✅ **API Running + CORS OK:**
```
Success: {message: "Invalid credentials"} 
// or other API response
```

❌ **CORS Issue:**
```
Access to fetch at 'https://localhost:7270/api/auth/login' 
from origin 'http://localhost:4200' has been blocked by CORS policy
```
→ Fix: Add CORS configuration (see step 3)

❌ **API Not Running:**
```
Error: TypeError: Failed to fetch
```
→ Fix: Start your API (see step 1)

---

### 6. **Check Firewall/Antivirus**

Some firewalls block localhost connections:

**Windows Firewall:**
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Allow ASP.NET Core" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 7270
```

**Disable Antivirus Temporarily:**
- Try disabling antivirus/firewall temporarily
- If it works, add an exception for your API

---

### 7. **Verify SSL Certificate**

If using HTTPS (localhost:7270):

**Trust the development certificate:**
```powershell
dotnet dev-certs https --trust
```

Click "Yes" when prompted.

**If issues persist, use HTTP:**
- Change environment.ts to: `apiUrl: 'http://localhost:5000/api'`
- Make sure your API runs on HTTP port 5000

---

## 🔍 Additional Debugging

### Check Network Tab

1. Open DevTools (F12) → Network tab
2. Try to login
3. Find the request to `/api/auth/login`
4. Check the details:

**Status 0:**
- Request didn't reach server
- CORS or network issue

**Status 200:**
- Success! Check response data

**Status 401/403:**
- Server responded, credentials issue

**Status 500:**
- Server error, check API logs

---

### Enable Detailed Console Logging

Check browser console for detailed error information. The error handler now logs:

```javascript
API Connection Error: {
  url: "https://localhost:7270/api/auth/login"
  message: "Could not connect to server"
  possibleCauses: [
    "API server is not running",
    "CORS is not configured",
    "Firewall blocking connection",
    "Wrong API URL in environment.ts"
  ]
}
```

---

## 📋 Quick Verification Commands

**Terminal 1 - Check if API is listening:**
```powershell
netstat -ano | findstr :7270
```
Should show a line with LISTENING

**Terminal 2 - Test API endpoint:**
```powershell
curl https://localhost:7270/api/auth/login -k
```
Should return some response (not connection refused)

---

## ✅ Common Solutions Summary

| Problem | Solution |
|---------|----------|
| API not running | Run `dotnet run` in API directory |
| Wrong port | Update `environment.ts` with correct port |
| CORS not configured | Add CORS policy to `Program.cs` |
| Certificate issue | Run `dotnet dev-certs https --trust` |
| Firewall blocking | Add firewall exception for port 7270 |
| Cache issue | Clear browser cache and restart |

---

## 🎯 Expected Working Setup

**Terminal 1: API Running**
```
info: Now listening on: https://localhost:7270
```

**Terminal 2: Angular Running**
```
Angular Live Development Server is listening on localhost:4200
```

**Browser Console: No CORS Errors**
```
POST https://localhost:7270/api/auth/login 401 (Unauthorized)
```
(401 is OK - it means API is responding!)

**localStorage:**
- After successful login, should have `auth_token` key

---

## 🆘 Still Not Working?

1. **Check API Logs:** Look for exceptions in API console
2. **Check Angular Console:** Look for detailed error messages
3. **Verify Database:** Ensure connection string is correct
4. **Test with Postman:** Try calling API directly
5. **Use HTTP Instead:** Change to `http://localhost:5000/api` temporarily

---

## 📞 Next Steps After Fixing

Once API connection works:

1. ✅ Register a test user
2. ✅ Check database - user should exist with Status=Pending
3. ✅ Approve user in database (Status=1)
4. ✅ Login with test user
5. ✅ Verify token in localStorage
6. ✅ Check subsequent requests include Authorization header

---

**Need more help?** Check the console error details for specific guidance!
