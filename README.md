# Vue Offline Mode Handler

A Vue 3 package for handling offline mode with caching, form persistence, and sync capabilities.

## Features

✅ Detect when a user goes offline and display an alert  
✅ Cache API responses and sync when back online  
✅ Store form data locally and send when the connection is restored  
✅ Provide a visual indicator for offline/online status  
✅ Customizable hooks for handling offline actions  

## Installation

```bash
npm install vue-offline-mode-handler
```

## Usage

### Basic Usage

```vue
<template>
  <OfflineIndicator />
</template>

<script setup>
import { OfflineIndicator } from 'vue-offline-mode-handler';
</script>
```

### Using the Composable

```vue
<script setup>
import { useOfflineMode } from 'vue-offline-mode-handler';

const {
  isOnline,
  isSyncing,
  pendingRequests,
  pendingForms,
  fetchWithOfflineSupport,
  saveFormData,
  syncPendingData
} = useOfflineMode({
  // Options
  enabled: true,
  offlineMessage: 'You are currently offline',
  onlineMessage: 'Back online!',
  persistForms: true,
  cacheApiResponses: true,
  maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
  excludeRoutes: ['/api/sensitive-data']
}, {
  // Hooks
  onGoOffline: () => console.log('Gone offline'),
  onGoOnline: () => console.log('Back online'),
  onSyncStart: () => console.log('Starting sync'),
  onSyncComplete: () => console.log('Sync complete'),
  onRequestQueued: (request) => console.log('Request queued', request),
  onFormQueued: (form) => console.log('Form queued', form),
  onError: (error) => console.error('Error', error)
});

// Make API calls with offline support
const fetchData = async () => {
  try {
    const response = await fetchWithOfflineSupport('/api/data');
    const data = await response.json();
    // Handle data
  } catch (error) {
    // Handle error
  }
};

// Save form data for offline sync
const submitForm = async (formData) => {
  await saveFormData({
    id: 'form-1',
    formId: 'contact-form',
    data: formData,
    timestamp: Date.now()
  });
};
</script>
```

## API Reference

### useOfflineMode Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| enabled | boolean | true | Enable/disable offline mode functionality |
| offlineMessage | string | 'You are currently offline...' | Message to show when offline |
| onlineMessage | string | 'Your connection has been restored.' | Message to show when back online |
| persistForms | boolean | true | Enable form data persistence |
| cacheApiResponses | boolean | true | Enable API response caching |
| maxCacheAge | number | 86400000 | Maximum age of cached responses (ms) |
| storageKeyPrefix | string | 'offline_mode_' | Prefix for storage keys |
| excludeRoutes | string[] | [] | Routes to exclude from caching |

### useOfflineMode Hooks

| Hook | Parameters | Description |
|------|------------|-------------|
| onGoOffline | () => void | Called when going offline |
| onGoOnline | () => void | Called when coming back online |
| onSyncStart | () => void | Called when sync starts |
| onSyncComplete | () => void | Called when sync completes |
| onRequestQueued | (request: PendingRequest) => void | Called when request is queued |
| onFormQueued | (form: FormData) => void | Called when form is queued |
| onError | (error: Error) => void | Called when an error occurs |

## License

MIT 