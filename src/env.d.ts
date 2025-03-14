/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  // Add more env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'workbox-window';
declare module '@vueuse/core'; 