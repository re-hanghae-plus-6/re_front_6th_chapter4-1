import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "dot" : "html",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm -F @hanghae-plus/shopping-vanilla dev",
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm -F @hanghae-plus/shopping-vanilla dev:ssr",
      port: 5174,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
