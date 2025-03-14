<template>
  <div class="form-example">
    <div class="header">
      <h1>Contact Form Example</h1>
      <OfflineIndicator class="status" />
    </div>

    <div class="content">
      <div class="info-panel" :class="{ offline: !isOnline }">
        <div class="status-info">
          <h3>{{ isOnline ? 'Online Mode' : 'Offline Mode' }}</h3>
          <p>
            {{ isOnline 
              ? 'Form submissions will be sent immediately' 
              : 'Form submissions will be saved and sent when online' 
            }}
          </p>
        </div>
        <div v-if="pendingCount > 0" class="sync-info">
          <div class="sync-status">
            <span>📝 {{ pendingCount }} pending submission{{ pendingCount !== 1 ? 's' : '' }}</span>
          </div>
          <button 
            v-if="isOnline" 
            @click="syncPendingData"
            :disabled="isSyncing"
          >
            {{ isSyncing ? 'Syncing...' : 'Submit Now' }}
          </button>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="contact-form" :class="{ submitting }">
        <div class="form-group">
          <label for="name">Name</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            required
            placeholder="Enter your name"
            :disabled="submitting"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            placeholder="Enter your email"
            :disabled="submitting"
          />
        </div>

        <div class="form-group">
          <label for="subject">Subject</label>
          <input
            id="subject"
            v-model="formData.subject"
            type="text"
            required
            placeholder="Enter subject"
            :disabled="submitting"
          />
        </div>

        <div class="form-group">
          <label for="message">Message</label>
          <textarea
            id="message"
            v-model="formData.message"
            required
            placeholder="Enter your message"
            rows="4"
            :disabled="submitting"
          ></textarea>
        </div>

        <div class="form-actions">
          <button 
            type="submit" 
            :disabled="submitting"
            class="submit-button"
          >
            {{ getSubmitButtonText() }}
          </button>
        </div>
      </form>

      <div v-if="submissions.length > 0" class="submissions-list">
        <h2>Recent Submissions</h2>
        <TransitionGroup name="list">
          <div 
            v-for="submission in submissions" 
            :key="submission.id"
            class="submission-item"
            :class="{ pending: !submission.synced }"
          >
            <div class="submission-header">
              <h3>{{ submission.data.subject }}</h3>
              <span class="submission-status">
                {{ submission.synced ? '✓ Sent' : '⏳ Pending' }}
              </span>
            </div>
            <div class="submission-details">
              <p><strong>From:</strong> {{ submission.data.name }}</p>
              <p><strong>Email:</strong> {{ submission.data.email }}</p>
              <p class="message-preview">{{ submission.data.message }}</p>
            </div>
            <div class="submission-footer">
              <span class="timestamp">
                {{ new Date(submission.timestamp).toLocaleString() }}
              </span>
              <button 
                v-if="!submission.synced && isOnline"
                @click="syncSubmission(submission)"
                :disabled="isSyncing"
                class="retry-button"
              >
                Retry
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { OfflineIndicator, useOfflineMode } from '../../src';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface Submission {
  id: string;
  data: ContactForm;
  timestamp: number;
  synced: boolean;
}

const formData = ref<ContactForm>({
  name: '',
  email: '',
  subject: '',
  message: ''
});

const submitting = ref(false);
const submissions = ref<Submission[]>([]);

const {
  isOnline,
  isSyncing,
  pendingRequests,
  pendingForms,
  fetchWithOfflineSupport,
  saveFormData,
  syncPendingData
} = useOfflineMode({
  offlineMessage: 'You are offline. Your form will be saved and submitted when back online.',
  onlineMessage: 'You\'re back online! Syncing pending form submissions...',
  persistForms: true
}, {
  onSyncStart: () => console.log('Starting form sync'),
  onSyncComplete: () => {
    console.log('Form sync complete');
    updateSubmissionStatus();
  }
});

const pendingCount = computed(() => {
  return pendingRequests.value.length + pendingForms.value.length;
});

const getSubmitButtonText = () => {
  if (submitting.value) return 'Submitting...';
  if (!isOnline.value) return 'Save for Later';
  return 'Submit';
};

const handleSubmit = async () => {
  submitting.value = true;
  const submission: Submission = {
    id: crypto.randomUUID(),
    data: { ...formData.value },
    timestamp: Date.now(),
    synced: false
  };
  
  try {
    if (isOnline.value) {
      await fetchWithOfflineSupport('https://api.example.com/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submission.data)
      });
      submission.synced = true;
    }

    await saveFormData({
      id: submission.id,
      formId: 'contact-form',
      data: submission.data,
      timestamp: submission.timestamp
    });

    submissions.value.unshift(submission);
    
    // Reset form
    formData.value = {
      name: '',
      email: '',
      subject: '',
      message: ''
    };
  } catch (error) {
    console.error('Error submitting form:', error);
  } finally {
    submitting.value = false;
  }
};

const syncSubmission = async (submission: Submission) => {
  try {
    await fetchWithOfflineSupport('https://api.example.com/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submission.data)
    });
    
    submission.synced = true;
  } catch (error) {
    console.error('Error syncing submission:', error);
  }
};

const updateSubmissionStatus = () => {
  const pendingIds = new Set(pendingForms.value.map(form => form.id));
  submissions.value = submissions.value.map(submission => ({
    ...submission,
    synced: !pendingIds.has(submission.id)
  }));
};

// Load any existing submissions from pending forms
const loadSubmissions = () => {
  submissions.value = pendingForms.value
    .filter(form => form.formId === 'contact-form')
    .map(form => ({
      id: form.id,
      data: form.data as ContactForm,
      timestamp: form.timestamp,
      synced: false
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
};

loadSubmissions();
</script>

<style scoped>
.form-example {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
}

.content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.info-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f0f9ff;
  border-radius: 6px;
  margin-bottom: 2rem;
}

.info-panel.offline {
  background: #fff1f2;
}

.status-info h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--primary-color);
}

.info-panel.offline .status-info h3 {
  color: #dc2626;
}

.status-info p {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.sync-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sync-status {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.contact-form {
  margin-bottom: 2rem;
}

.contact-form.submitting {
  opacity: 0.7;
  pointer-events: none;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
}

input,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--bg-secondary);
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

input:disabled,
textarea:disabled {
  background: var(--bg-secondary);
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-button {
  padding: 0.75rem 2rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-button:hover:not(:disabled) {
  background: var(--primary-hover);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.submissions-list {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--bg-secondary);
}

.submissions-list h2 {
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.submission-item {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.submission-item.pending {
  border: 2px solid #fde68a;
  background: #fefce8;
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.submission-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.submission-status {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.submission-details {
  margin-bottom: 1rem;
}

.submission-details p {
  margin: 0.5rem 0;
  color: var(--text-secondary);
}

.message-preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.submission-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--bg-secondary);
}

.timestamp {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.retry-button {
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-button:hover:not(:disabled) {
  background: var(--primary-hover);
}

.retry-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@media (max-width: 640px) {
  .form-example {
    padding: 1rem;
  }

  .info-panel {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .sync-info {
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-actions {
    justify-content: stretch;
  }

  .submit-button {
    width: 100%;
  }

  .submission-header,
  .submission-footer {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>
