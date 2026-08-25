# Anna姐 · 把事干成｜工程交接说明

## 当前线上站点

- 自定义域名：`https://done.annasixianghui.com/`
- Sites 项目：`anna-get-it-done`
- 主技术栈：Vinext / React / Cloudflare Worker / D1 / OpenAI Responses API

## 当前核心问题

用户提交较长行业调研任务时，系统会较快返回：

`这次资料量超过单份报告的安全上限，系统已停止继续消耗。原始输入已经保留，请缩小研究范围后重试。`

这不是页面计时问题，而是当前为了避免继续烧钱，已经把单次输出预算限制到 `14_000`，并关闭了自动续写。长报告任务触发 `max_output_tokens` 后，系统会主动停止。

## 建议工程方向

不要简单把 token 上限调大，否则会重新出现高消耗、卡住、JSON 截断、无结果的问题。

建议改成分阶段生成：

1. 任务拆解阶段：先把用户输入转成研究大纲和章节任务。
2. 证据检索阶段：每个章节独立检索和总结，保存为结构化草稿。
3. 报告组装阶段：只读取已保存草稿，生成最终 JSON / HTML 报告。
4. PDF 导出阶段：用前端或服务端排版渲染，不再让模型一次性输出整份长报告。

## 关键文件

- `app/result-studio.tsx`：主界面、轮询、PDF 前端排版。
- `app/api/generate/route.ts`：OpenAI 调用、后台任务、报告入库、停止任务。
- `app/api/_shared.ts`：D1 表初始化、加密、用户种子数据。
- `app/api/admin/users/route.ts`：管理员子账号管理。
- `app/api/settings/route.ts`：API Key、模型、二维码设置。
- `app/auth.ts`：登录态与权限。
- `app/login-screen.tsx`：登录页。
- `app/globals.css`：全站 VI / UI 样式。
- `db/schema.ts` 和 `drizzle/`：数据库结构。

## 当前安全策略

- 单次输出预算：`INITIAL_OUTPUT_BUDGET = 14_000`
- 自动续写：`MAX_CONTINUATIONS = 0`
- 后台任务安全上限：`MAX_JOB_AGE_MS = 10 * 60 * 1000`
- 遇到 429、JSON 异常、max_output_tokens 会停止任务，避免继续消耗。

## 运行与验证

```bash
npm install
npm run build
```

当前 `npm run build` 通过。

`npm test` 里有旧断言仍期待 `INITIAL_OUTPUT_BUDGET = 64_000`，与当前安全策略冲突，需要工程师同步更新测试。

## 注意事项

- 不要把 OpenAI API Key 写入代码或 GitHub。
- Key 应继续通过管理员设置页写入，并加密保存。
- 不建议把 `.openai/hosting.json` 当作普通部署配置修改；这是 Sites 项目身份文件。
- 如果迁移到非 Sites 平台，需要重新设计 D1、环境变量、登录 Cookie 和 Worker 运行时。
