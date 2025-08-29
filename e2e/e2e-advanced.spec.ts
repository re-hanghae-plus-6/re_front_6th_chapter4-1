import { createCSRTest, createSSGTest, createSSRTest } from "./createTests";
import test from "@playwright/test";

test.describe("E2E Test > 심화과제 (React)", () => {
  createCSRTest(`http://localhost:4175/front_6th_chapter4-1/react/`);
  createSSRTest(`http://localhost:4176/front_6th_chapter4-1/react/`);
  createSSGTest(`http://localhost:4179/front_6th_chapter4-1/react/`);
});
