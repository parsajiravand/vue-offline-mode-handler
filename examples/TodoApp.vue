<template>
  <div class="todo-app">
    <OfflineIndicator
      offlineMessage="You're offline. Your changes will be synced when you're back online."
      onlineMessage="You're back online! Syncing changes..."
    />

    <div class="todo-container">
      <h1>Todo List</h1>
      
      <form @submit.prevent="addTodo" class="todo-form">
        <input
          v-model="newTodo"
          type="text"
          placeholder="What needs to be done?"
          required
        />
        <button type="submit">Add</button>
      </form>

      <ul class="todo-list">
        <li v-for="todo in todos" :key="todo.id" class="todo-item">
          <input
            type="checkbox"
            :checked="todo.completed"
            @change="toggleTodo(todo)"
          />
          <span :class="{ completed: todo.completed }">{{ todo.text }}</span>
          <button @click="deleteTodo(todo)" class="delete-btn">Delete</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { OfflineIndicator, useOfflineMode } from 'vue-offline-mode-handler';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const {
  fetchWithOfflineSupport,
  saveFormData
} = useOfflineMode();

const todos = ref<Todo[]>([]);
const newTodo = ref('');

const API_URL = 'https://api.example.com/todos';

// Load todos
onMounted(async () => {
  try {
    const response = await fetchWithOfflineSupport(API_URL);
    const data = await response.json();
    todos.value = data;
  } catch (error) {
    console.error('Failed to load todos:', error);
  }
});

// Add new todo
const addTodo = async () => {
  const todo: Todo = {
    id: crypto.randomUUID(),
    text: newTodo.value,
    completed: false
  };

  try {
    await fetchWithOfflineSupport(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(todo)
    });

    todos.value.push(todo);
    newTodo.value = '';
  } catch (error) {
    // If offline, save form data
    await saveFormData({
      id: todo.id,
      formId: 'add-todo',
      data: todo,
      timestamp: Date.now()
    });
    
    // Optimistically add to UI
    todos.value.push(todo);
    newTodo.value = '';
  }
};

// Toggle todo completion
const toggleTodo = async (todo: Todo) => {
  const updatedTodo = { ...todo, completed: !todo.completed };

  try {
    await fetchWithOfflineSupport(`${API_URL}/${todo.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedTodo)
    });

    const index = todos.value.findIndex(t => t.id === todo.id);
    if (index !== -1) {
      todos.value[index] = updatedTodo;
    }
  } catch (error) {
    // If offline, save form data
    await saveFormData({
      id: `toggle-${todo.id}`,
      formId: 'toggle-todo',
      data: updatedTodo,
      timestamp: Date.now()
    });

    // Optimistically update UI
    const index = todos.value.findIndex(t => t.id === todo.id);
    if (index !== -1) {
      todos.value[index] = updatedTodo;
    }
  }
};

// Delete todo
const deleteTodo = async (todo: Todo) => {
  try {
    await fetchWithOfflineSupport(`${API_URL}/${todo.id}`, {
      method: 'DELETE'
    });

    todos.value = todos.value.filter(t => t.id !== todo.id);
  } catch (error) {
    // If offline, save delete request
    await saveFormData({
      id: `delete-${todo.id}`,
      formId: 'delete-todo',
      data: { id: todo.id },
      timestamp: Date.now()
    });

    // Optimistically remove from UI
    todos.value = todos.value.filter(t => t.id !== todo.id);
  }
};
</script>

<style scoped>
.todo-app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.todo-container {
  margin-top: 20px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  margin: 0 0 20px;
  color: #374151;
}

.todo-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

input[type="text"] {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #2563eb;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #e5e7eb;
}

.todo-item:last-child {
  border-bottom: none;
}

.completed {
  text-decoration: line-through;
  color: #9ca3af;
}

.delete-btn {
  margin-left: auto;
  background: #ef4444;
}

.delete-btn:hover {
  background: #dc2626;
}
</style> 