/**
 * API Configuration
 * 
 * Centralized location for API base URLs.
 * In production, these should come from environment variables.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const ENDPOINTS = {
  JOBS: `${API_BASE_URL}/jobs`,
  SEARCH: `${API_BASE_URL}/search`,
  RANK: `${API_BASE_URL}/rank-candidates`,
  UPLOAD: `${API_BASE_URL}/upload-document`,
};
