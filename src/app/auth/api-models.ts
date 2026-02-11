/**
 * API Models - TypeScript interfaces matching ASP.NET Core DTOs
 * These interfaces ensure type safety when calling the backend API
 */

/**
 * Register Request DTO
 * Used when registering a new user
 */
export interface RegisterRequest {
  userId: string;
  name: string;
  email: string;
  branch: string;
  role: string; // 'Admin', 'Manager', 'Officer'
  password: string;
}

/**
 * Login Request DTO
 * Used when authenticating a user
 */
export interface LoginRequest {
  userId: string;
  password: string;
}

/**
 * User Response DTO
 * User data returned from the API
 */
export interface UserResponse {
  userId: string;
  name: string;
  email: string;
  branch: string;
  role: string;
  status: string; // 'Active', 'Inactive', 'Pending'
}

/**
 * Login Response DTO
 * Response from successful login
 */
export interface LoginResponse {
  token: string;
  user: UserResponse;
}

/**
 * Generic API Response
 * Used for simple success/error messages
 */
export interface ApiResponse {
  message: string;
}

/**
 * Error Response from API
 * Standard error structure
 */
export interface ApiError {
  message: string;
  status?: number;
}
