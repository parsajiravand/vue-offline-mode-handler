import { openDB, IDBPDatabase } from 'idb';
import type { PendingRequest, CachedResponse, FormData } from '../types';

const DB_NAME = 'vue-offline-mode';
const DB_VERSION = 1;

interface DBSchema {
  pendingRequests: {
    key: string;
    value: PendingRequest;
  };
  cachedResponses: {
    key: string;
    value: CachedResponse;
  };
  formData: {
    key: string;
    value: FormData;
  };
}

class StorageService {
  private db: IDBPDatabase<DBSchema> | null = null;

  async initDB(): Promise<void> {
    this.db = await openDB<DBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('pendingRequests')) {
          db.createObjectStore('pendingRequests', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cachedResponses')) {
          db.createObjectStore('cachedResponses', { keyPath: 'url' });
        }
        if (!db.objectStoreNames.contains('formData')) {
          db.createObjectStore('formData', { keyPath: 'id' });
        }
      },
    });
  }

  async savePendingRequest(request: PendingRequest): Promise<void> {
    if (!this.db) await this.initDB();
    await this.db!.put('pendingRequests', request);
  }

  async getPendingRequests(): Promise<PendingRequest[]> {
    if (!this.db) await this.initDB();
    return await this.db!.getAll('pendingRequests');
  }

  async removePendingRequest(id: string): Promise<void> {
    if (!this.db) await this.initDB();
    await this.db!.delete('pendingRequests', id);
  }

  async cacheResponse(response: CachedResponse): Promise<void> {
    if (!this.db) await this.initDB();
    await this.db!.put('cachedResponses', response);
  }

  async getCachedResponse(url: string): Promise<CachedResponse | undefined> {
    if (!this.db) await this.initDB();
    return await this.db!.get('cachedResponses', url);
  }

  async saveFormData(data: FormData): Promise<void> {
    if (!this.db) await this.initDB();
    await this.db!.put('formData', data);
  }

  async getFormData(id: string): Promise<FormData | undefined> {
    if (!this.db) await this.initDB();
    return await this.db!.get('formData', id);
  }

  async removeFormData(id: string): Promise<void> {
    if (!this.db) await this.initDB();
    await this.db!.delete('formData', id);
  }

  async clearExpiredCache(maxAge: number): Promise<void> {
    if (!this.db) await this.initDB();
    const now = Date.now();
    const tx = this.db!.transaction('cachedResponses', 'readwrite');
    const store = tx.store;
    
    for await (const cursor of store) {
      const response = cursor.value as CachedResponse;
      if (now - response.timestamp > maxAge) {
        await store.delete(cursor.key);
      }
    }
  }
}

export const storage = new StorageService();
export default storage; 