import { ref, onMounted, watch } from 'vue';
import { useNetwork } from '@vueuse/core';
import { Workbox } from 'workbox-window';
import type { OfflineModeOptions, OfflineModeHooks, PendingRequest, FormData } from '../types';
import storage from '../services/storage';

const defaultOptions: OfflineModeOptions = {
  enabled: true,
  offlineMessage: 'You are currently offline. Some features may be limited.',
  onlineMessage: 'Your connection has been restored.',
  persistForms: true,
  cacheApiResponses: true,
  maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
  storageKeyPrefix: 'offline_mode_',
  excludeRoutes: []
};

export function useOfflineMode(options: OfflineModeOptions = {}, hooks: OfflineModeHooks = {}) {
  const mergedOptions = { ...defaultOptions, ...options };
  const { isOnline } = useNetwork();
  const isSyncing = ref(false);
  const pendingRequests = ref<PendingRequest[]>([]);
  const pendingForms = ref<FormData[]>([]);

  // Initialize service worker
  let wb: typeof Workbox | null = null;
  if ('serviceWorker' in navigator) {
    wb = new Workbox('/sw.js');
    wb.register();
  }

  // Watch online status changes
  watch(isOnline, (online: boolean) => {
    if (online) {
      hooks.onGoOnline?.();
      syncPendingData();
    } else {
      hooks.onGoOffline?.();
    }
  });

  // Load pending data from storage
  const loadPendingData = async () => {
    pendingRequests.value = await storage.getPendingRequests();
    // Load pending forms...
  };

  // Sync pending data when back online
  const syncPendingData = async () => {
    if (!isOnline.value || isSyncing.value) return;

    try {
      isSyncing.value = true;
      hooks.onSyncStart?.();

      // Process pending requests
      for (const request of pendingRequests.value) {
        try {
          await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body ? JSON.stringify(request.body) : undefined
          });
          await storage.removePendingRequest(request.id);
          hooks.onRequestQueued?.(request);
        } catch (error) {
          console.error('Failed to sync request:', error);
          hooks.onError?.(error as Error);
        }
      }

      // Refresh pending data
      await loadPendingData();
      hooks.onSyncComplete?.();
    } finally {
      isSyncing.value = false;
    }
  };

  // Queue a request for offline handling
  const queueRequest = async (request: PendingRequest) => {
    await storage.savePendingRequest(request);
    pendingRequests.value.push(request);
    hooks.onRequestQueued?.(request);
  };

  // Save form data for offline handling
  const saveFormData = async (formData: FormData) => {
    if (!mergedOptions.persistForms) return;
    await storage.saveFormData(formData);
    pendingForms.value.push(formData);
    hooks.onFormQueued?.(formData);
  };

  // Fetch with offline support
  const fetchWithOfflineSupport = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    if (!mergedOptions.enabled) {
      return fetch(url, options);
    }

    try {
      const response = await fetch(url, options);
      
      // Cache successful GET requests
      if (
        mergedOptions.cacheApiResponses &&
        options.method?.toUpperCase() === 'GET' &&
        response.ok &&
        !mergedOptions.excludeRoutes?.some(route => url.includes(route))
      ) {
        const data = await response.clone().json();
        await storage.cacheResponse({
          url,
          data,
          timestamp: Date.now()
        });
      }

      return response;
    } catch (error) {
      // If offline, try to get from cache for GET requests
      if (!isOnline.value && options.method?.toUpperCase() === 'GET') {
        const cached = await storage.getCachedResponse(url);
        if (cached) {
          return new Response(JSON.stringify(cached.data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Queue non-GET requests for later
      if (options.method?.toUpperCase() !== 'GET') {
        await queueRequest({
          id: crypto.randomUUID(),
          url,
          method: options.method || 'GET',
          body: options.body ? JSON.parse(options.body as string) : undefined,
          headers: options.headers as Record<string, string>,
          timestamp: Date.now()
        });
      }

      throw error;
    }
  };

  // Initialize
  onMounted(async () => {
    if (mergedOptions.enabled) {
      await loadPendingData();
      if (isOnline.value) {
        await syncPendingData();
      }
    }
  });

  return {
    isOnline,
    isSyncing,
    pendingRequests,
    pendingForms,
    fetchWithOfflineSupport,
    saveFormData,
    syncPendingData
  };
} 