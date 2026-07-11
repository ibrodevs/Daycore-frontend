import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("creates a deployable Next.js build", async () => {
  await access(new URL("../.next/BUILD_ID", import.meta.url));
  const routes = JSON.parse(await readFile(new URL("../.next/routes-manifest.json", import.meta.url), "utf8"));
  assert.ok(Array.isArray(routes.staticRoutes));
  assert.ok(Array.isArray(routes.dynamicRoutes));
});
