<template>
  <div class="app">
    <header>
      <nav>
        <RouterLink to="/" class="logo">Vue Offline Mode Handler</RouterLink>
        <div class="nav-links">
          <RouterLink to="/" class="nav-link">Home</RouterLink>
          <RouterLink to="/todo" class="nav-link">Todo Example</RouterLink>
          <RouterLink to="/form" class="nav-link">Form Example</RouterLink>
        </div>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>

    <footer>
      <p>
        Built with Vue 3 and TypeScript. Check out the
        <a
          href="https://github.com/yourusername/vue-offline-mode-handler"
          target="_blank"
          rel="noopener noreferrer"
        >GitHub repository</a>
        for documentation.
      </p>
    </footer>
  </div>
</template>

<style>
/* Global styles */
:root {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --text-primary: #1f2937;
  --text-secondary: #4b5563;
  --bg-primary: #f3f4f6;
  --bg-secondary: #e5e7eb;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
}

/* Component styles */
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1rem;
}

nav {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}

.logo {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--primary-color);
  background: var(--bg-primary);
}

main {
  flex: 1;
  padding: 2rem 1rem;
}

footer {
  background: white;
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
}

footer a {
  color: var(--primary-color);
  text-decoration: none;
}

footer a:hover {
  text-decoration: underline;
}

/* Responsive design */
@media (max-width: 640px) {
  nav {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .nav-links {
    flex-direction: column;
    gap: 0.5rem;
  }

  .nav-link {
    display: block;
    padding: 0.75rem;
  }
}
</style> 