export interface OfflineModeOptions {
  /** Enable/disable offline mode functionality */
  enabled?: boolean;
  /** Custom message to show when going offline */
  offlineMessage?: string;
  /** Custom message to show when coming back online */
  onlineMessage?: string;
  /** Enable/disable automatic form data persistence */
  persistForms?: boolean;
  /** Enable/disable API response caching */
  cacheApiResponses?: boolean;
  /** Maximum age of cached responses in milliseconds */
  maxCacheAge?: number;
  /** Custom storage key prefix */
  storageKeyPrefix?: string;
  /** Routes to exclude from caching */
  excludeRoutes?: string[];
}

export interface PendingRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
}

export interface CachedResponse {
  data: any;
  timestamp: number;
  url: string;
}

export interface FormData {
  id: string;
  formId: string;
  data: Record<string, any>;
  timestamp: number;
}

export interface OfflineModeState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingRequests: PendingRequest[];
  pendingForms: FormData[];
}

export type OfflineModeHooks = {
  onGoOffline?: () => void;
  onGoOnline?: () => void;
  onSyncStart?: () => void;
  onSyncComplete?: () => void;
  onRequestQueued?: (request: PendingRequest) => void;
  onFormQueued?: (form: FormData) => void;
  onError?: (error: Error) => void;
} 