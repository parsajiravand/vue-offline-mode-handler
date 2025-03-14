<template>
  <div class="home">
    <h1>Vue Offline Mode Handler</h1>
    <OfflineIndicator class="status" />

    <div class="content">
      <section class="intro">
        <h2>Overview</h2>
        <p>
          A powerful Vue 3 package for handling offline scenarios in your web applications.
          This demo showcases real-world examples of offline-first functionality.
        </p>
      </section>

      <section class="features">
        <h2>Key Features</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <h3>🌐 Network Status</h3>
            <p>Real-time network status detection with customizable notifications</p>
            <div class="status-demo">
              <p>Current Status: <strong>{{ isOnline ? 'Online' : 'Offline' }}</strong></p>
              <button @click="toggleNetworkDemo">
                {{ isOnline ? 'Simulate Offline' : 'Simulate Online' }}
              </button>
            </div>
          </div>

          <div class="feature-card">
            <h3>💾 API Caching</h3>
            <p>Automatic caching of API responses for offline access</p>
            <RouterLink to="/todo" class="demo-link">
              View Todo Demo →
            </RouterLink>
          </div>

          <div class="feature-card">
            <h3>📝 Form Persistence</h3>
            <p>Save form data locally when offline for later submission</p>
            <RouterLink to="/form" class="demo-link">
              View Form Demo →
            </RouterLink>
          </div>

          <div class="feature-card">
            <h3>🔄 Auto Sync</h3>
            <p>Automatic synchronization when connection is restored</p>
            <div class="sync-status" v-if="pendingRequests.length || pendingForms.length">
              <p>Pending Items: {{ pendingRequests.length + pendingForms.length }}</p>
              <button @click="syncPendingData">Sync Now</button>
            </div>
          </div>
        </div>
      </section>

      <section class="usage">
        <h2>Basic Usage</h2>
        <div class="code-block">
          <pre><code>import { useOfflineMode } from 'vue-offline-mode-handler';

const {
  isOnline,
  isSyncing,
  fetchWithOfflineSupport,
  saveFormData
} = useOfflineMode({
  offlineMessage: 'You are offline',
  onlineMessage: 'Back online!',
  persistForms: true,
  cacheApiResponses: true
});</code></pre>
        </div>
      </section>

      <section class="examples">
        <h2>Live Examples</h2>
        <div class="example-cards">
          <RouterLink to="/todo" class="example-card">
            <h3>Todo List</h3>
            <p>Demonstrates offline data persistence and synchronization with a todo list application.</p>
            <ul>
              <li>Create, update, and delete todos</li>
              <li>Works offline with local storage</li>
              <li>Syncs when back online</li>
            </ul>
          </RouterLink>

          <RouterLink to="/form" class="example-card">
            <h3>Contact Form</h3>
            <p>Shows how to handle form submissions in offline mode.</p>
            <ul>
              <li>Submit forms while offline</li>
              <li>Automatic retry when online</li>
              <li>Progress tracking</li>
            </ul>
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { OfflineIndicator, useOfflineMode } from '../../src';

const {
  isOnline,
  isSyncing,
  pendingRequests,
  pendingForms,
  syncPendingData
} = useOfflineMode({
  offlineMessage: 'You are currently offline. Don\'t worry, everything still works!',
  onlineMessage: 'You\'re back online! Syncing your changes...',
  persistForms: true,
  cacheApiResponses: true,
  maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
}, {
  onGoOffline: () => console.log('Demo: Gone offline'),
  onGoOnline: () => console.log('Demo: Back online'),
  onSyncStart: () => console.log('Demo: Starting sync'),
  onSyncComplete: () => console.log('Demo: Sync complete')
});

const toggleNetworkDemo = () => {
  // This is just for demo purposes
  // In a real app, you can't control the network status
  console.log(`Demo: Simulating ${isOnline.value ? 'offline' : 'online'} state`);
};
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.content {
  margin-top: 2rem;
}

section {
  margin-bottom: 3rem;
}

.intro {
  text-align: center;
  max-width: 800px;
  margin: 0 auto 3rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.feature-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.feature-card h3 {
  margin: 0 0 1rem;
  color: var(--primary-color);
}

.status-demo {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--bg-secondary);
}

.code-block {
  background: #1a1a1a;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
}

.code-block code {
  color: #fff;
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
}

.example-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.example-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
}

.example-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.example-card h3 {
  color: var(--primary-color);
  margin: 0 0 1rem;
}

.example-card ul {
  margin: 1rem 0 0;
  padding-left: 1.5rem;
  color: var(--text-secondary);
}

.demo-link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.demo-link:hover {
  text-decoration: underline;
}

button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

button:hover {
  background: var(--primary-hover);
}

.sync-status {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--bg-secondary);
}

@media (max-width: 768px) {
  .home {
    padding: 1rem;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .example-cards {
    grid-template-columns: 1fr;
  }
}
</style> 