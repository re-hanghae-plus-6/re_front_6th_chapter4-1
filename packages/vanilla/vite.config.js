import { defineConfig } from "vite";

const base = process.env.NODE_ENV === "production" ? "/vanilla/" : "";

export default defineConfig({ base });
