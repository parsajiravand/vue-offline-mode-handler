<template>
  <div class="todo-example">
    <div class="header">
      <h1>Todo List Example</h1>
      <OfflineIndicator class="status" />
    </div>

    <div class="content">
      <div class="info-panel" :class="{ offline: !isOnline }">
        <div class="status-info">
          <h3>{{ isOnline ? 'Online Mode' : 'Offline Mode' }}</h3>
          <p>{{ isOnline ? 'Changes will be synced immediately' : 'Changes will be saved locally' }}</p>
        </div>
        <div v-if="isSyncing || pendingCount > 0" class="sync-info">
          <div class="sync-status">
            <span v-if="isSyncing">🔄 Syncing...</span>
            <span v-else>
              ⏳ {{ pendingCount }} pending change{{ pendingCount !== 1 ? 's' : '' }}
            </span>
          </div>
          <button 
            v-if="!isSyncing && pendingCount > 0" 
            @click="syncPendingData"
            class="sync-button"
          >
            Sync Now
          </button>
        </div>
      </div>

      <form @submit.prevent="addTodo" class="todo-form">
        <input
          v-model="newTodo"
          type="text"
          placeholder="What needs to be done?"
          required
        />
        <button type="submit" :disabled="isSyncing">Add Todo</button>
      </form>

      <div class="filters">
        <button 
          v-for="filter in filters" 
          :key="filter"
          @click="currentFilter = filter"
          :class="{ active: currentFilter === filter }"
        >
          {{ filter }}
        </button>
      </div>

      <div v-if="loading" class="loading">
        Loading todos...
      </div>
      <div v-else-if="filteredTodos.length === 0" class="empty-state">
        <p>{{ getEmptyStateMessage() }}</p>
      </div>
      <div v-else class="todos-list">
        <TransitionGroup name="todo">
          <div 
            v-for="todo in filteredTodos" 
            :key="todo.id" 
            class="todo-item"
            :class="{ completed: todo.completed, syncing: syncingItems.includes(todo.id) }"
          >
            <div class="todo-content">
              <label class="checkbox">
                <input
                  type="checkbox"
                  :checked="todo.completed"
                  @change="toggleTodo(todo)"
                  :disabled="syncingItems.includes(todo.id)"
                />
                <span class="checkmark"></span>
              </label>
              <span class="todo-text">{{ todo.text }}</span>
            </div>
            <div class="todo-actions">
              <span v-if="syncingItems.includes(todo.id)" class="sync-indicator">
                Syncing...
              </span>
              <button 
                @click="deleteTodo(todo)"
                class="delete-btn"
                :disabled="syncingItems.includes(todo.id)"
              >
                Delete
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <div class="todo-stats" v-if="todos.length > 0">
        <p>
          {{ todos.filter(t => !t.completed).length }} items left
        </p>
        <button 
          v-if="todos.some(t => t.completed)"
          @click="clearCompleted"
          :disabled="isSyncing"
        >
          Clear completed
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { OfflineIndicator, useOfflineMode } from '../../src';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  timestamp: number;
}

const todos = ref<Todo[]>([]);
const newTodo = ref('');
const loading = ref(true);
const syncingItems = ref<string[]>([]);
const currentFilter = ref<'All' | 'Active' | 'Completed'>('All');
const filters = ['All', 'Active', 'Completed'] as const;

const {
  isOnline,
  isSyncing,
  pendingRequests,
  pendingForms,
  fetchWithOfflineSupport,
  saveFormData,
  syncPendingData
} = useOfflineMode({
  offlineMessage: 'You are offline. Changes will be saved locally.',
  onlineMessage: 'You\'re back online! Syncing your changes...',
  persistForms: true,
  cacheApiResponses: true,
  maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
}, {
  onSyncStart: () => console.log('Starting todo sync'),
  onSyncComplete: () => {
    console.log('Todo sync complete');
    syncingItems.value = [];
  }
});

const pendingCount = computed(() => {
  return pendingRequests.value.length + pendingForms.value.length;
});

const filteredTodos = computed(() => {
  return todos.value.filter(todo => {
    if (currentFilter.value === 'Active') return !todo.completed;
    if (currentFilter.value === 'Completed') return todo.completed;
    return true;
  });
});

const getEmptyStateMessage = () => {
  if (currentFilter.value === 'All') return 'No todos yet. Add one above!';
  if (currentFilter.value === 'Active') return 'No active todos!';
  return 'No completed todos!';
};

// Load todos from API or local storage
const loadTodos = async () => {
  try {
    if (isOnline.value) {
      const response = await fetchWithOfflineSupport('https://api.example.com/todos');
      todos.value = await response.json();
    } else {
      // For demo purposes, load from static data when offline
      todos.value = [
        {
          id: '1',
          text: 'Example offline todo',
          completed: false,
          timestamp: Date.now()
        }
      ];
    }
  } catch (error) {
    console.error('Error loading todos:', error);
  } finally {
    loading.value = false;
  }
};

// Add new todo
const addTodo = async () => {
  if (!newTodo.value.trim()) return;

  const todo: Todo = {
    id: crypto.randomUUID(),
    text: newTodo.value,
    completed: false,
    timestamp: Date.now()
  };

  try {
    syncingItems.value.push(todo.id);

    if (isOnline.value) {
      await fetchWithOfflineSupport('https://api.example.com/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo)
      });
    }
    
    await saveFormData({
      id: todo.id,
      formId: 'todos',
      data: todo,
      timestamp: todo.timestamp
    });

    todos.value.unshift(todo);
    newTodo.value = '';
  } catch (error) {
    console.error('Error adding todo:', error);
  } finally {
    syncingItems.value = syncingItems.value.filter(id => id !== todo.id);
  }
};

// Toggle todo completion
const toggleTodo = async (todo: Todo) => {
  try {
    syncingItems.value.push(todo.id);
    todo.completed = !todo.completed;

    if (isOnline.value) {
      await fetchWithOfflineSupport(`https://api.example.com/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: todo.completed })
      });
    }

    await saveFormData({
      id: todo.id,
      formId: 'todos',
      data: todo,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    todo.completed = !todo.completed; // Revert on error
  } finally {
    syncingItems.value = syncingItems.value.filter(id => id !== todo.id);
  }
};

// Delete todo
const deleteTodo = async (todo: Todo) => {
  try {
    syncingItems.value.push(todo.id);

    if (isOnline.value) {
      await fetchWithOfflineSupport(`https://api.example.com/todos/${todo.id}`, {
        method: 'DELETE'
      });
    }

    todos.value = todos.value.filter(t => t.id !== todo.id);
  } catch (error) {
    console.error('Error deleting todo:', error);
  } finally {
    syncingItems.value = syncingItems.value.filter(id => id !== todo.id);
  }
};

// Clear completed todos
const clearCompleted = async () => {
  const completedTodos = todos.value.filter(t => t.completed);
  
  for (const todo of completedTodos) {
    await deleteTodo(todo);
  }
};

loadTodos();
</script>

<style scoped>
.todo-example {
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

.todo-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.todo-form input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid var(--bg-secondary);
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.todo-form input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.filters button {
  padding: 0.5rem 1rem;
  border: none;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.filters button.active {
  background: var(--primary-color);
  color: white;
}

.todos-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: var(--text-secondary);
}

.todo-item.syncing {
  opacity: 0.7;
}

.todo-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.checkbox {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.checkbox input {
  opacity: 0;
  width: 0;
  height: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  background: white;
  border: 2px solid var(--bg-secondary);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.checkbox input:checked ~ .checkmark {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.checkmark:after {
  content: '';
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox input:checked ~ .checkmark:after {
  display: block;
}

.todo-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sync-indicator {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.delete-btn {
  padding: 0.4rem 0.75rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.delete-btn:hover:not(:disabled) {
  background: #dc2626;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.todo-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

/* Transitions */
.todo-enter-active,
.todo-leave-active {
  transition: all 0.3s ease;
}

.todo-enter-from,
.todo-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@media (max-width: 640px) {
  .todo-example {
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

  .todo-form {
    flex-direction: column;
  }

  .filters {
    flex-wrap: wrap;
    justify-content: center;
  }

  .todo-item {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .todo-actions {
    justify-content: flex-end;
  }
}
</style> 