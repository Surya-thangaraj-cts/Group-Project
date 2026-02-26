# Backend API Integration - Implementation Guide

## ✅ Completed Steps

### 1. Core Infrastructure Created
- ✅ `src/app/core/models/api.models.ts` - All TypeScript interfaces
- ✅ `src/app/core/services/account-api.service.ts` - Account operations
- ✅ `src/app/core/services/transaction-api.service.ts` - Transaction operations
- ✅ `src/app/core/services/approval-api.service.ts` - Approval workflows
- ✅ `src/app/core/services/manager-api.service.ts` - Manager dashboard
- ✅ `src/app/core/services/notification-api.service.ts` - Notifications
- ✅ `src/app/core/services/audit-api.service.ts` - Audit logs
- ✅ `src/app/core/services/account-type-api.service.ts` - Account types config

### 2. Officer Module Refactored
- ✅ Replaced localStorage with API calls
- ✅ All CRUD operations now use backend
- ✅ `createAccount()` → submits for approval
- ✅ `recordTransaction()` → creates transaction via API (high-value auto-flagged)
- ✅ `submitUpdateRequest()` → updates account via API
- ✅ Notifications now loaded from backend

### 3. Manager Module API Service Created
- ✅ New `data-api.service.ts` with full backend integration
- ✅ Transactions loaded from API
- ✅ Approvals loaded from API
- ✅ Notifications loaded from API
- ✅ Dashboard stats from API

---

## 🔄 Migration Steps for Manager Components

### Option 1: Replace Existing DataService (Recommended)

**Backup current file:**
```bash
copy "src\app\features\manager\services\data.service.ts" "src\app\features\manager\services\data.service.backup.ts"
```

**Replace with new implementation:**
```bash
copy "src\app\features\manager\services\data-api.service.ts" "src\app\features\manager\services\data.service.ts"
```

### Option 2: Gradual Migration

Keep both services and gradually migrate components:

```typescript
// In manager components
import { DataService } from './services/data.service'; // Old mock service
import { DataService as DataApiService } from './services/data-api.service'; // New API service

constructor(
  private dataService: DataApiService // Use new API service
) {}
```

---

## 🎯 Required Backend Endpoints

### Account Endpoints
```
GET    /api/accounts?pageNumber=1&pageSize=10&status=0
GET    /api/accounts/{id}
POST   /api/accounts
PUT    /api/accounts/{id}
DELETE /api/accounts/{id}
```

### Transaction Endpoints
```
GET    /api/transactions?pageNumber=1&pageSize=10
POST   /api/transactions
```

### Approval Endpoints
```
GET    /api/approvals?pageNumber=1&pageSize=10&decision=Pending
GET    /api/approvals/details
PUT    /api/approvals/{id}
```

### Manager Endpoints
```
GET    /api/manager/dashboard
GET    /api/manager/pending-approvals
GET    /api/manager/suspicious-transactions
GET    /api/manager/high-value-transactions
```

### Notification Endpoints
```
GET    /api/notifications
PUT    /api/notifications/{id}/status
DELETE /api/notifications/{id}
```

### Audit Log Endpoints (New)
```
GET    /api/audit-logs?pageNumber=1&pageSize=10
```

### Account Type Config Endpoints (New)
```
GET    /api/account-types
POST   /api/account-types
PUT    /api/account-types/{id}
DELETE /api/account-types/{id}
```

---

## 🧪 Testing the Integration

### 1. Test Officer Module

**Login as Officer:**
```
UserId: officer1
Password: Officer@123!
```

**Test Create Account:**
- Navigate to `/officer/create`
- Fill form and submit
- Should show "Account creation request submitted for approval"
- Check network tab for POST to `/api/accounts`

**Test Create Transaction:**
- Navigate to `/officer/dashboard`
- Create deposit < ₹100,000 → Should complete immediately
- Create deposit > ₹100,000 → Should show "submitted for approval"

### 2. Test Manager Module

**Login as Manager:**
```
UserId: manager1
Password: Manager@123!
```

**Test Approvals:**
- Navigate to `/manager`
- Click on "Approvals" tab
- Should see pending high-value transactions
- Approve/Reject → Should call PUT `/api/approvals/{id}`

**Test Dashboard:**
- View should show real data from `/api/manager/dashboard`

### 3. Verify Data Flow

**Check Browser DevTools:**
1. Open Network tab
2. Filter by XHR
3. Look for API calls to `https://localhost:7021/api/*`
4. Verify JWT token in Authorization header

---

## 🚨 Common Issues & Solutions

### Issue 1: CORS Errors
**Error:** `Access-Control-Allow-Origin` missing

**Solution:** Add CORS policy in ASP.NET Core `Program.cs`:
```csharp
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAngular", policy => {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

app.UseCors("AllowAngular");
```

### Issue 2: 401 Unauthorized
**Error:** API returns 401 for authenticated requests

**Solution:** Verify JWT interceptor is working:
```typescript
// Check auth.interceptor.ts is in app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    // ...
  ]
};
```

### Issue 3: Empty Data Lists
**Error:** Components show "No data" even with backend running

**Solution:** Check API responses:
```typescript
// Add console logs in services
this.accountApi.getAccounts().subscribe({
  next: (data) => console.log('Accounts loaded:', data),
  error: (err) => console.error('Error:', err)
});
```

---

## 📝 Next Implementation Steps

### Step 1: Admin - Account Type Configuration
Create `src/app/features/admin/account-types/account-types.component.ts`:
- Table showing Savings/Current account types
- Add/Edit/Delete functionality
- Configure default limits and interest rates

### Step 2: Admin - Account Limits Management
Extend existing user management:
- Add `transactionLimit` and `balanceLimit` fields
- Display in existing users table
- Add edit form fields

### Step 3: Admin - Audit Log Viewer
Create `src/app/features/admin/audit-logs/audit-logs.component.ts`:
- Table with filters (action, user, entity type, date range)
- Show who approved/rejected what
- Export to CSV functionality

### Step 4: Enhanced Compliance Filtering
Update `admin.component.ts`:
- Add dropdown for Branch filter
- Add tabs for AccountType (Savings/Current)
- Add date range picker for Period
- Update API calls with filter params

---

## 🎉 Benefits of New Architecture

1. **Production-Ready:** Real API integration, no mock data
2. **Type-Safe:** Full TypeScript interfaces for all models
3. **Maintainable:** Separated API services, easy to update
4. **Testable:** Services can be mocked for unit tests
5. **Scalable:** Pagination support built-in
6. **Error Handling:** Proper error handling with user feedback

---

## 📚 Key Files Modified

### Officer Module
- `src/app/features/officer/officer.service.ts` → Refactored with API calls

### Manager Module
- `src/app/features/manager/services/data-api.service.ts` → New API-integrated service
- **To Do:** Replace old `data.service.ts` in components

### Core Services (New)
- `src/app/core/models/api.models.ts`
- `src/app/core/services/*.service.ts` (8 new services)

---

## 🔗 Related Documentation
- `API_INTEGRATION.md` - Original API documentation
- `BACKEND_MAPPING.md` - Database schema mapping
- `TESTING_GUIDE.md` - Testing procedures
- `TROUBLESHOOTING_CONNECTION.md` - Connection issues

---

## ✨ Summary

✅ **Officer Module:** Fully integrated with backend API
✅ **Manager Module:** API service ready (needs component migration)
✅ **Admin Module:** Already integrated (user management)
⏳ **Pending:** Account type config, limits, audit logs, compliance filtering

**Next Action:** Test the integration with your backend running on `https://localhost:7021`
