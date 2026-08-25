# Anna姐 · 把事干成

一个中文 AI 成果生成工作台：用户只输入一句想完成的事情，系统完成理解、必要追问、调研、结构化报告生成、历史保存、Library 查看和 PDF 下载。

线上站点：`https://done.annasixianghui.com/`

## 当前状态

这个仓库来自 OpenAI Sites 项目 `anna-get-it-done`。

当前版本已经包含：

- 密码登录页
- 管理员账号与子账号隔离
- 管理员设置 OpenAI API Key 和模型
- 单一输入框
- 文件/图片上传入口
- 后台生成任务轮询
- 历史对话
- Library 输出文件列表
- 品牌化 PDF 排版
- Anna姐思享汇 VI 样式

## 当前需要工程师重点处理的问题

长行业调研任务会触发：

`这次资料量超过单份报告的安全上限，系统已停止继续消耗。原始输入已经保留，请缩小研究范围后重试。`

这不是简单的页面 bug，而是当前为了避免继续烧钱，把单次输出预算限制到 `14_000`，并关闭了自动续写。长报告触发 `max_output_tokens` 后，系统会主动停止。

不要直接把 token 上限调回很大。正确方向是把报告生成改成分阶段：

1. 先拆任务和章节。
2. 每个章节独立检索、总结、保存。
3. 最后读取章节草稿，组装成报告。
4. PDF 只负责排版和导出，不让模型一次性吐完整长 JSON。

详见：`ENGINEER_HANDOFF.md`

## Prerequisites

- Node.js `>=22.13.0`
- Linux with `flock`, `curl`, and GNU `timeout`

## Key Files

- `app/result-studio.tsx`：主界面、输入、轮询、报告显示、PDF 导出。
- `app/api/generate/route.ts`：OpenAI Responses API、任务状态、报告入库、停止逻辑。
- `app/api/_shared.ts`：D1 初始化、加密、用户种子数据。
- `app/api/admin/users/route.ts`：管理员子账号管理。
- `app/api/settings/route.ts`：API Key、模型、二维码设置。
- `app/auth.ts`：登录态。
- `app/login-screen.tsx`：登录页。
- `app/globals.css`：全站 UI / VI。
- `db/schema.ts` 与 `drizzle/`：数据库结构。

## Security Notes

- 不要把 OpenAI API Key 写进代码。
- API Key 通过管理员设置页写入，并加密保存。
- `.openai/hosting.json` 是 Sites 项目身份文件，不要随意改 project_id。
- 如果迁移到其他平台，需要重新处理 D1、环境变量、Cookie、Worker runtime。

## Diagnostic Commands

- `npm run install:ci`: perform the one bounded lockfile install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build and validate the deployable Sites artifact
- `npm run start`: start the built Vinext application
- `npm test`: build, validate, and verify rendered metadata
- `npm run validate:artifact`: recheck an existing artifact's manifest and ESM export
- `npm run db:generate`: generate Drizzle migrations after schema changes
