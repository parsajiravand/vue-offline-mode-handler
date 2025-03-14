<template>
  <div class="offline-indicator" :class="{ 'is-offline': !isOnline }">
    <div class="status-bar">
      <div class="status-icon" :class="{ 'is-offline': !isOnline }">
        <svg v-if="isOnline" class="online-icon" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.88-11.71L10 14.17l-1.88-1.88a.996.996 0 1 0-1.41 1.41l2.59 2.59c.39.39 1.02.39 1.41 0L17.3 9.7a.996.996 0 1 0-1.41-1.41z"
          />
        </svg>
        <svg v-else class="offline-icon" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10.17 14l-2.76-2.76c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l3.47 3.47c.39.39 1.02.39 1.41 0l7.53-7.53c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0z"
          />
        </svg>
      </div>
      <span class="status-text">{{ statusMessage }}</span>
    </div>

    <div v-if="hasPendingOperations" class="pending-operations">
      <div class="pending-count">
        {{ pendingRequests.length + pendingForms.length }} pending operations
      </div>
      <button
        v-if="isOnline && hasPendingOperations"
        @click="syncPendingData"
        :disabled="isSyncing"
        class="sync-button"
      >
        {{ isSyncing ? "Syncing..." : "Sync Now" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useOfflineMode } from "../composables/useOfflineMode";

const props = defineProps<{
  offlineMessage?: string;
  onlineMessage?: string;
}>();

const { isOnline, isSyncing, pendingRequests, pendingForms, syncPendingData } =
  useOfflineMode({
    offlineMessage: props.offlineMessage,
    onlineMessage: props.onlineMessage,
  });

const statusMessage = computed(() => {
  return isOnline.value
    ? props.onlineMessage || "Connected"
    : props.offlineMessage || "You are offline";
});

const hasPendingOperations = computed(() => {
  return pendingRequests.value.length > 0 || pendingForms.value.length > 0;
});
</script>

<style scoped>
.offline-indicator {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: 0 auto;
}

.offline-indicator.is-offline {
  background-color: #fff3f3;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  width: 24px;
  height: 24px;
  color: #22c55e;
}

.status-icon.is-offline {
  color: #ef4444;
}

.status-text {
  font-size: 14px;
  color: #374151;
}

.pending-operations {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pending-count {
  font-size: 14px;
  color: #6b7280;
}

.sync-button {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.sync-button:hover {
  background-color: #2563eb;
}

.sync-button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}
</style>
