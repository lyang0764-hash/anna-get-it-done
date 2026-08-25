import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("deep research uses resumable generation, history and content-aware PDF pages", async () => {
  const [route, historyRoute, studio, styles, logo] = await Promise.all([
    readFile(new URL("../app/api/generate/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/history/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/result-studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../public/assets/anna-brand-logo.png", import.meta.url)),
  ]);

  assert.match(route, /background:\s*true/);
  assert.match(route, /export async function GET/);
  assert.match(route, /responses\/\$\{activeResponseId\}/);
  assert.match(route, /INITIAL_OUTPUT_BUDGET = 64_000/);
  assert.match(route, /previous_response_id:\s*activeResponseId/);
  assert.match(route, /generation_jobs/);
  assert.doesNotMatch(route, /295_000/);
  assert.match(studio, /anna-active-generation-v1/);
  assert.match(studio, /任务会在后台持续运行/);
  assert.match(studio, /正在自动整理完整报告/);
  assert.match(studio, /search\.get\("jobId"\)/);
  assert.match(studio, /anna-input-draft-v1/);
  assert.match(studio, /后台状态正常 · 任务已保存，可刷新恢复/);
  assert.match(studio, /createPdfSheets\(element,\s*identity\.footerSlogan\)/);
  assert.match(studio, /body\.scrollHeight > body\.clientHeight/);
  assert.match(studio, /const footerSlogan = "Anna姐 · 把事干成"/);
  assert.doesNotMatch(studio, /footerSlogan = `Anna姐 · \$\{taskShortTitle\}`/);
  assert.match(studio, /openSavedResult/);
  assert.match(studio, /reportKey:\s*identity\.reportKey/);
  assert.match(studio, /pdfDownload\?\.reportKey === currentReportKey/);
  assert.match(studio, /pdf\.save\(name,\s*\{ returnPromise: true \}\)/);
  assert.match(studio, /function BrandLogo/);
  assert.match(studio, /src="\/assets\/anna-brand-logo\.png"/);
  assert.match(studio, /<BrandLogo placement="report"\/>/);
  assert.match(studio, /<BrandLogo placement="closing"\/>/);
  assert.ok(logo.length > 10_000);
  assert.match(historyRoute, /LEFT JOIN reports/);
  assert.match(styles, /\.report-page \{[^}]*min-height:\s*0/);
  assert.match(styles, /\.pdf-sheet \{[^}]*height:\s*1528px/);
  assert.match(styles, /\.pdf-sheet-footer \{[^}]*bottom:\s*28px/);
  assert.match(styles, /\.hero \{[^}]*justify-content:\s*flex-end/);
  assert.doesNotMatch(studio, /超过5分钟会自动停止/);
  assert.doesNotMatch(studio, /max_output_tokens/);
  assert.doesNotMatch(studio, /setInput\(""\);\s*setJobStatus/);
});
