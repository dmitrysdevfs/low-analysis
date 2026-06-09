import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/__tests__/setup.js'],
    env: {
      JWT_SECRET: 'test_secret_key_12345',
      FRONTEND_URL: 'http://localhost:3001',
      NODE_ENV: 'test',
    },
  },
});
