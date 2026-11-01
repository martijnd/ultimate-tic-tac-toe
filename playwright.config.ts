import { defineConfig, devices } from '@playwright/test';

// The frontend dev server talks to the backend on port 5001 of the same host, and the backend
// only allows the 5173 origin, so both ports are fixed.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run dev --prefix backend',
      url: 'http://127.0.0.1:5001',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev --prefix frontend -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
