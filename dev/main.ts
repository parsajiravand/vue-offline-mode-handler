import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Home from './pages/Home.vue';
import TodoExample from './pages/TodoExample.vue';
import FormExample from './pages/FormExample.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/todo',
      name: 'todo',
      component: TodoExample
    },
    {
      path: '/form',
      name: 'form',
      component: FormExample
    }
  ]
});

const app = createApp(App);
app.use(router);
app.mount('#app'); 