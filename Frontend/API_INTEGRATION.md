# API Integration Setup

This Angular application is now configured to work with your ASP.NET Core authentication API.

## 📋 What Was Updated

### 1. **Auth Service** (`src/app/auth/auth.service.ts`)
- Added HttpClient integration
- Created TypeScript interfaces matching your C# DTOs:
  - `RegisterRequest`
  - `LoginRequest`
  - `UserResponse`
  - `LoginResponse`
- Implemented API methods:
  - `register()` - Calls POST `/api/auth/register`
  - `login()` - Calls POST `/api/auth/login`
- Added JWT token management
- Kept legacy methods for backward compatibility

### 2. **HTTP Interceptor** (`src/app/auth/auth.interceptor.ts`)
- Automatically adds JWT Bearer token to all HTTP requests
- Retrieves token from localStorage

### 3. **App Configuration** (`src/app/app.config.ts`)
- Added `provideHttpClient` with the auth interceptor
- Enables HTTP calls throughout the application

### 4. **Components Updated**
- **Register Component**: Now calls `auth.register()` API endpoint
- **SignIn Component**: Now calls `auth.login()` API endpoint
- Both handle API responses and errors properly

### 5. **Environment Configuration**
- Created `src/environments/environment.ts` for development
- Created `src/environments/environment.prod.ts` for production
- Centralized API URL configuration

## 🔧 Configuration

### Update API URL

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7270/api' // Your API URL here
};
```

For production, edit `src/environments/environment.prod.ts`.

## 🚀 How It Works

### Registration Flow
1. User fills registration form
2. Component calls `authService.register(registerRequest)`
3. HTTP POST to `/api/auth/register`
4. API validates and creates user with `Pending` status
5. Returns success message
6. User redirected to sign-in page

### Login Flow
1. User enters credentials
2. Component calls `authService.login(loginRequest)`
3. HTTP POST to `/api/auth/login`
4. API validates credentials and status
5. Returns JWT token and user data
6. Token stored in localStorage
7. User object stored in localStorage
8. User redirected to role-based dashboard

### Authenticated Requests
- All subsequent HTTP requests automatically include the JWT token
- Interceptor adds `Authorization: Bearer <token>` header

## 📡 API Endpoints Used

| Method | Endpoint | Request Body | Response |
|--------|----------|--------------|----------|
| POST | `/api/auth/register` | `RegisterRequest` | `{ message: string }` |
| POST | `/api/auth/login` | `LoginRequest` | `{ token: string, user: UserResponse }` |

## 🔐 CORS Configuration Required

Make sure your ASP.NET Core API has CORS configured to allow requests from your Angular app:

```csharp
// In Program.cs or Startup.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200") // Angular dev server
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

// Later in the pipeline
app.UseCors("AllowAngular");
```

## 🧪 Testing

1. **Start your ASP.NET Core API**
   ```bash
   dotnet run
   ```

2. **Start Angular development server**
   ```bash
   npm start
   # or
   ng serve
   ```

3. **Test Registration**
   - Navigate to `/register`
   - Fill in the form
   - Check browser Network tab for API call
   - Verify user created in your database

4. **Test Login**
   - Navigate to `/signin`
   - Enter credentials
   - Check that JWT token is received
   - Verify token stored in localStorage
   - Confirm redirection to dashboard

## 🛠️ Troubleshooting

### CORS Errors
- Enable CORS in your ASP.NET Core API
- Check that the origin matches your Angular app URL

### 401 Unauthorized
- Check credentials are correct
- Verify user status is "Active" in database
- Ensure JWT token is being sent in requests

### Network Errors
- Verify API URL in `environment.ts`
- Ensure ASP.NET Core API is running
- Check API is accessible at the configured URL

### Token Not Included in Requests
- Verify interceptor is properly configured in `app.config.ts`
- Check token is stored in localStorage with key `auth_token`

## 📝 Notes

- The auth service maintains both API methods and legacy local storage methods for backward compatibility
- JWT token is automatically attached to all HTTP requests
- Token and user data persist in localStorage
- User is logged out if token is removed or invalid

## 🔄 Next Steps

Consider adding:
1. Token refresh mechanism
2. Token expiration handling
3. Role-based guards for routes
4. Loading spinners during API calls
5. Better error messages from API
6. Logout functionality that calls API endpoint
