/**
 * Backend API Service
 * 
 * Handles communication with the backend API with robust error handling,
 * retry logic, timeout management, and proper configuration.
 */

import { GeneratedQuestion } from './types';

// API Configuration from environment variables
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://23.27.186.134:8080',
  timeout: parseInt(process.env.BACKEND_API_TIMEOUT || '30000', 10),
  retryAttempts: parseInt(process.env.BACKEND_API_RETRY_ATTEMPTS || '3', 10),
  retryDelay: parseInt(process.env.BACKEND_API_RETRY_DELAY || '1000', 10),
};

// API Endpoints
const ENDPOINTS = {
  createMarket: '/v1/admin/market/create',
};

/**
 * Backend API Response
 */
export interface BackendApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Question payload for backend
 */
export interface QuestionPayload {
  question: string;
}

/**
 * Error types for better error handling
 */
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom API Error class
 */
export class BackendApiError extends Error {
  constructor(
    public type: ApiErrorType,
    public statusCode?: number,
    public responseData?: any,
    message?: string
  ) {
    super(message || 'Backend API Error');
    this.name = 'BackendApiError';
  }
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create an AbortController with timeout
 */
const createTimeoutController = (timeoutMs: number): AbortController => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
};

/**
 * Determine error type from fetch error
 */
const determineErrorType = (error: any, response?: Response): ApiErrorType => {
  if (error.name === 'AbortError') {
    return ApiErrorType.TIMEOUT;
  }
  
  if (!response) {
    return ApiErrorType.NETWORK_ERROR;
  }

  if (response.status >= 500) {
    return ApiErrorType.SERVER_ERROR;
  }

  if (response.status >= 400) {
    return ApiErrorType.CLIENT_ERROR;
  }

  return ApiErrorType.UNKNOWN;
};

/**
 * Make HTTP request with timeout and retry logic
 */
async function makeRequest<T>(
  url: string,
  options: RequestInit,
  attempt: number = 1
): Promise<T> {
  const controller = createTimeoutController(API_CONFIG.timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    // Parse response
    let responseData: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Handle non-OK responses
    if (!response.ok) {
      const errorType = determineErrorType(null, response);
      
      // Retry on server errors if attempts remaining
      if (errorType === ApiErrorType.SERVER_ERROR && attempt < API_CONFIG.retryAttempts) {
        console.warn(
          `Server error on attempt ${attempt}/${API_CONFIG.retryAttempts}. Retrying in ${API_CONFIG.retryDelay}ms...`
        );
        await sleep(API_CONFIG.retryDelay * attempt); // Exponential backoff
        return makeRequest<T>(url, options, attempt + 1);
      }

      throw new BackendApiError(
        errorType,
        response.status,
        responseData,
        `API request failed with status ${response.status}`
      );
    }

    return responseData as T;
  } catch (error: any) {
    // Handle timeout
    if (error.name === 'AbortError') {
      if (attempt < API_CONFIG.retryAttempts) {
        console.warn(
          `Timeout on attempt ${attempt}/${API_CONFIG.retryAttempts}. Retrying in ${API_CONFIG.retryDelay}ms...`
        );
        await sleep(API_CONFIG.retryDelay * attempt);
        return makeRequest<T>(url, options, attempt + 1);
      }
      
      throw new BackendApiError(
        ApiErrorType.TIMEOUT,
        undefined,
        undefined,
        `Request timeout after ${API_CONFIG.timeout}ms`
      );
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (attempt < API_CONFIG.retryAttempts) {
        console.warn(
          `Network error on attempt ${attempt}/${API_CONFIG.retryAttempts}. Retrying in ${API_CONFIG.retryDelay}ms...`
        );
        await sleep(API_CONFIG.retryDelay * attempt);
        return makeRequest<T>(url, options, attempt + 1);
      }

      throw new BackendApiError(
        ApiErrorType.NETWORK_ERROR,
        undefined,
        undefined,
        'Network error: Unable to reach backend server'
      );
    }

    // Re-throw BackendApiError as-is
    if (error instanceof BackendApiError) {
      throw error;
    }

    // Unknown error
    throw new BackendApiError(
      ApiErrorType.UNKNOWN,
      undefined,
      undefined,
      error.message || 'Unknown error occurred'
    );
  }
}

/**
 * Send questions to backend API
 */
export async function sendQuestionsToBackend(
  questions: GeneratedQuestion[]
): Promise<BackendApiResponse> {
  if (!questions || questions.length === 0) {
    throw new BackendApiError(
      ApiErrorType.CLIENT_ERROR,
      undefined,
      undefined,
      'No questions provided'
    );
  }

  // Prepare payload - only send question text
  const payload = {
    questions: questions.map(q => q.question),
  };

  // Construct URL
  const url = `${API_CONFIG.baseUrl}${ENDPOINTS.createMarket}`;

  // Make request
  const response = await makeRequest<BackendApiResponse>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return response;
}

/**
 * Validate backend API configuration
 */
export function validateApiConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!API_CONFIG.baseUrl) {
    errors.push('Backend API URL is not configured');
  }

  if (API_CONFIG.timeout < 1000) {
    errors.push('API timeout is too short (minimum 1000ms)');
  }

  if (API_CONFIG.retryAttempts < 1) {
    errors.push('Retry attempts must be at least 1');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get API configuration (for debugging)
 */
export function getApiConfig() {
  return {
    ...API_CONFIG,
    // Don't expose full URLs in production
    baseUrl: process.env.NODE_ENV === 'production' 
      ? API_CONFIG.baseUrl.replace(/\/\/.*@/, '//**redacted**@')
      : API_CONFIG.baseUrl,
  };
}

/**
 * Format error for user display
 */
export function formatApiError(error: BackendApiError): string {
  switch (error.type) {
    case ApiErrorType.NETWORK_ERROR:
      return `❌ Network Error\n\n` +
        `Unable to reach the backend server.\n\n` +
        `Please check:\n` +
        `• Backend server is running\n` +
        `• URL is correct: ${API_CONFIG.baseUrl}\n` +
        `• Network connection is stable`;

    case ApiErrorType.TIMEOUT:
      return `⏱️ Request Timeout\n\n` +
        `The backend server is taking too long to respond.\n\n` +
        `Timeout: ${API_CONFIG.timeout}ms\n` +
        `Retries attempted: ${API_CONFIG.retryAttempts}`;

    case ApiErrorType.SERVER_ERROR:
      return `🔥 Server Error\n\n` +
        `The backend server encountered an error.\n\n` +
        `Status: ${error.statusCode}\n` +
        `Error: ${JSON.stringify(error.responseData, null, 2)}`;

    case ApiErrorType.CLIENT_ERROR:
      return `⚠️ Request Error\n\n` +
        `There was a problem with the request.\n\n` +
        `Status: ${error.statusCode}\n` +
        `Details: ${JSON.stringify(error.responseData, null, 2)}`;

    default:
      return `❌ Unknown Error\n\n` +
        `${error.message}\n\n` +
        `Please contact support if this persists.`;
  }
}
