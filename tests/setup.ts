import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IndexedDB
const indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

const IDBRequest = {
  result: null,
  error: null,
  source: null,
  transaction: null,
  readyState: 'pending',
  onerror: null,
  onsuccess: null,
  onupgradeneeded: null,
};

const IDBDatabase = {
  close: vi.fn(),
  createObjectStore: vi.fn(),
  deleteObjectStore: vi.fn(),
  transaction: vi.fn(),
  objectStoreNames: {
    contains: vi.fn(),
  },
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDB,
});

// Mock service worker
Object.defineProperty(window.navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({}),
    ready: Promise.resolve({}),
  },
}); 