# Balance Check Feature - Backend Implementation Guide

## Overview
The frontend has implemented a "Check Account Balance" feature in the Officer Transaction section. This feature displays the current balance of an account when the officer selects an account and clicks "Check Balance".

## Current Implementation (Frontend)
- **Location**: Officer Transaction Section → "Check Account Balance" subsection
- **Functionality**: Displays account details including current balance
- **Method**: Client-side lookup from already-loaded account list

## Data Flow

### Current Flow (No Backend Change Needed Yet)
1. Officer selects an account ID from the dropdown
2. Account data is already loaded in the frontend from the accounts list
3. Clicking "Check Balance" displays the account details including balance
4. **This works because the existing `accounts$` observable already contains the `balance` field**

## If You Need Real-Time Balance Updates

If in the future you want to fetch the LATEST balance from the backend in real-time (bypassing the local cache), here's what you would need:

### Backend Endpoint Required:
```
GET /api/officer/accounts/{accountId}/balance
```

### Request:
```http
GET https://localhost:7021/api/officer/accounts/ACC001/balance
Authorization: Bearer {token}
```

### Response (Success - 200 OK):
```json
{
  "accountId": "ACC001",
  "customerName": "John Doe",
  "accountType": "SAVINGS",
  "status": "ACTIVE",
  "balance": 50000.00,
  "lastUpdated": "2026-03-08T10:30:00Z"
}
```

### Response (Error - 404 Not Found):
```json
{
  "error": "Account not found",
  "code": "ACCOUNT_NOT_FOUND"
}
```

### Backend Implementation Steps:

1. **Create Controller Endpoint** (in AccountsController or OfficerController):
```csharp
[HttpGet("accounts/{accountId}/balance")]
public async Task<IActionResult> GetAccountBalance(string accountId)
{
    try 
    {
        var account = await _accountService.GetAccountByIdAsync(accountId);
        
        if (account == null)
            return NotFound(new { error = "Account not found", code = "ACCOUNT_NOT_FOUND" });
        
        return Ok(new 
        {
            accountId = account.AccountId,
            customerName = account.CustomerName,
            accountType = account.AccountType.ToString(),
            status = account.Status.ToString(),
            balance = account.Balance,
            lastUpdated = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { error = "Internal server error", message = ex.Message });
    }
}
```

2. **Service Method**:
```csharp
public async Task<AccountDto> GetAccountByIdAsync(string accountId)
{
    var account = await _repository.GetByIdAsync(accountId);
    return _mapper.Map<AccountDto>(account);
}
```

3. **Ensure Account Entity has Balance property**:
```csharp
public class Account
{
    public string AccountId { get; set; }
    public string CustomerId { get; set; }
    public string CustomerName { get; set; }
    public decimal Balance { get; set; }  // ← Make sure this exists
    public string AccountType { get; set; }
    public string Status { get; set; }
    public DateTime OpenedAt { get; set; }
    // ... other properties
}
```

## Frontend Integration (For Backend Call)

When you add the backend endpoint, you'll need to update the frontend service:

```typescript
// Add to officer.service.ts or create account-api.service.ts
getAccountBalance(accountId: string): Observable<AccountBalance> {
  return this.http.get<AccountBalance>(
    `${this.apiUrl}/officer/accounts/${accountId}/balance`,
    { headers: this.getHeaders() }
  );
}
```

Then update the component's `checkBalance()` method:
```typescript
checkBalance(): void {
  if (!this.balanceCheckAccountId) {
    this.officerSvc.setError('Please select an account');
    return;
  }

  this.balanceLoading = true;
  this.officerSvc.getAccountBalance(this.balanceCheckAccountId)
    .subscribe({
      next: (account) => {
        this.selectedBalanceAccount = account;
        this.balanceLoading = false;
      },
      error: (error) => {
        this.officerSvc.setError('Failed to fetch account balance');
        this.balanceLoading = false;
      }
    });
}
```

## Current Status
✅ **Frontend Feature Complete** - Works with local account data
⏳ **Backend Optional** - Only needed if you want real-time balance verification from database

## Notes
- The feature currently uses the cached account list (which already contains balance)
- If accounts don't have balance in the response, add it to your Account DTO
- The UI is production-ready and styled consistently with the rest of the application
