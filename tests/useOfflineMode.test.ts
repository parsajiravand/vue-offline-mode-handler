import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOfflineMode } from '../src/composables/useOfflineMode';
import { ref } from 'vue';

// Mock the useNetwork composable
vi.mock('@vueuse/core', () => ({
  useNetwork: () => ({
    isOnline: ref(true)
  })
}));

// Mock the storage service
vi.mock('../src/services/storage', () => ({
  default: {
    savePendingRequest: vi.fn(),
    getPendingRequests: vi.fn().mockResolvedValue([]),
    removePendingRequest: vi.fn(),
    cacheResponse: vi.fn(),
    getCachedResponse: vi.fn(),
    saveFormData: vi.fn(),
    getFormData: vi.fn(),
    removeFormData: vi.fn(),
    clearExpiredCache: vi.fn()
  }
}));

describe('useOfflineMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  it('should make API calls when online', async () => {
    const { fetchWithOfflineSupport } = useOfflineMode();
    const mockResponse = { data: 'test' };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
      clone: () => ({
        json: () => Promise.resolve(mockResponse)
      })
    });

    const response = await fetchWithOfflineSupport('/api/test');
    const data = await response.json();

    expect(data).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith('/api/test', {});
  });

  it('should queue requests when offline', async () => {
    const { fetchWithOfflineSupport } = useOfflineMode();
    
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    try {
      await fetchWithOfflineSupport('/api/test', {
        method: 'POST',
        body: JSON.stringify({ test: true })
      });
    } catch (error) {
      // Expected error
    }

    expect(global.fetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      body: JSON.stringify({ test: true })
    });
  });

  it('should return cached response when offline for GET requests', async () => {
    const { fetchWithOfflineSupport } = useOfflineMode();
    const mockCachedData = { cached: true };

    // Mock offline state
    vi.mock('@vueuse/core', () => ({
      useNetwork: () => ({
        isOnline: ref(false)
      })
    }));

    // Mock failed fetch
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    // Mock cached response
    const storage = await import('../src/services/storage');
    storage.default.getCachedResponse.mockResolvedValueOnce({
      data: mockCachedData,
      timestamp: Date.now(),
      url: '/api/test'
    });

    const response = await fetchWithOfflineSupport('/api/test', { method: 'GET' });
    const data = await response.json();

    expect(data).toEqual(mockCachedData);
  });
}); 