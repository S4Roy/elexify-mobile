// Common Redux types for the application

// API Response wrapper
export interface ApiResponse<T = any> {
  status: number;
  data: T;
  message?: string;
  error?: string;
}

// Generic error type
export interface ApiError {
  message: string;
  code?: string | number;
  details?: any;
}

// Common loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Common action payload types
export interface RequestAction {
  type: string;
}

export interface SuccessAction<T = any> {
  type: string;
  payload: T;
}

export interface FailureAction {
  type: string;
  payload: ApiError;
}

// Utility type for Redux Toolkit slices
export type SliceActions<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
};

// Common API headers
export interface ApiHeaders {
  Accept: string;
  contenttype: string;
  accesstoken?: string;
  authorization?: string;
}
