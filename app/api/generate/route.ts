import { decryptSecret, ensureTables, getRuntimeEnv } from "../_shared";
import { getSessionUserFromRequest } from "../../auth";

type Attachment = { name: string; type: string; data: string };
type EvidenceSource = { id: string; publisher: string; title: string; url: string; publishedAt: string; claim: string };
type VisualReference = { type: "image" | "video" | "product"; title: string; reason: string; sourceId: string; thumbnailUrl?: string };
type OpenAIResponse = {
  id?: string;
  model?: string;
  status?: string;
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  metadata?: Record<string, string>;
  error?: { code?: string; message?: string };
  incomplete_details?: { reason?: string };
};

type GenerationJob = {
  root_id: string;
  active_response_id: string;
  prompt: string;
  model: string;
  continuation_count: number;
  status: string;
  started_at: string | null;
  updated_at: string | null;
};

const INITIAL_OUTPUT_BUDGET = 14_000;
const MAX_CONTINUATIONS = 0;
const MAX_JOB_AGE_MS = 10 * 60 * 1000;

const shortText = (maxLength = 120) => ({ type: "string", maxLength });
const sourceIds = { type: "array", maxItems: 4, items: shortText(12) };

const reportSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "needsClarification", "question", "category", "deliverableType", "title", "executiveSummary",
    "decision", "objective", "researchScope", "knownFacts", "assumptions", "unknowns", "charts",
    "opportunities", "recommendedFocus", "innovationDirections", "expertPanel", "channelPlays",
    "risks", "nextActions", "visualReferences", "reusablePrompt", "evidenceSources", "evidenceNote",
  ],
  properties: {
    needsClarification: { type: "boolean" },
    question: shortText(160),
    category: { type: "string", enum: ["market", "customer", "product", "sales", "content", "business"] },
    deliverableType: shortText(40),
    title: shortText(72),
    executiveSummary: shortText(360),
    decision: {
      type: "object", additionalProperties: false,
      required: ["verdict", "phase", "confidence", "coreThesis", "notToDo"],
      properties: {
        verdict: shortText(90),
        phase: { type: "string", enum: ["上升期", "结构性增长", "成熟期", "下行期", "证据不足"] },
        confidence: { type: "string", enum: ["高", "中", "低"] },
        coreThesis: shortText(220),
        notToDo: shortText(180),
      },
    },
    objective: shortText(180),
    researchScope: {
      type: "object", additionalProperties: false,
      required: ["market", "category", "customer", "timeHorizon", "decisionQuestion"],
      properties: {
        market: shortText(70), category: shortText(90), customer: shortText(100),
        timeHorizon: shortText(40), decisionQuestion: shortText(180),
      },
    },
    knownFacts: {
      type: "array", maxItems: 7,
      items: { type: "object", additionalProperties: false, required: ["fact", "sourceIds"], properties: { fact: shortText(180), sourceIds } },
    },
    assumptions: { type: "array", maxItems: 5, items: shortText(140) },
    unknowns: { type: "array", maxItems: 5, items: shortText(140) },
    charts: {
      type: "array", maxItems: 4,
      items: {
        type: "object", additionalProperties: false,
        required: ["kind", "title", "subtitle", "unit", "insight", "sourceIds", "data"],
        properties: {
          kind: { type: "string", enum: ["line", "bar", "donut"] },
          title: shortText(64), subtitle: shortText(120), unit: shortText(24), insight: shortText(180), sourceIds,
          data: {
            type: "array", minItems: 2, maxItems: 8,
            items: { type: "object", additionalProperties: false, required: ["label", "value"], properties: { label: shortText(28), value: { type: "number" } } },
          },
        },
      },
    },
    opportunities: {
      type: "array", maxItems: 5,
      items: {
        type: "object", additionalProperties: false,
        required: ["rank", "segment", "targetCustomer", "demandSignal", "productDirection", "priceAndMargin", "growthDriver", "defensibility", "channelFit", "score", "sourceIds"],
        properties: {
          rank: { type: "number" }, segment: shortText(60), targetCustomer: shortText(100), demandSignal: shortText(180),
          productDirection: shortText(180), priceAndMargin: shortText(160), growthDriver: shortText(160),
          defensibility: shortText(160), channelFit: shortText(140), score: { type: "number" }, sourceIds,
        },
      },
    },
    recommendedFocus: {
      type: "object", additionalProperties: false,
      required: ["segment", "whyThisOne", "productWedge", "customer", "pricePosition", "goToMarket", "killCriteria"],
      properties: {
        segment: shortText(70), whyThisOne: shortText(220), productWedge: shortText(200), customer: shortText(120),
        pricePosition: shortText(120), goToMarket: shortText(220), killCriteria: shortText(180),
      },
    },
    innovationDirections: {
      type: "array", maxItems: 4,
      items: {
        type: "object", additionalProperties: false,
        required: ["title", "targetUser", "productConcept", "coreInnovation", "whyNow", "validation", "moat", "sourceIds"],
        properties: {
          title: shortText(60), targetUser: shortText(100), productConcept: shortText(180), coreInnovation: shortText(180),
          whyNow: shortText(160), validation: shortText(180), moat: shortText(160), sourceIds,
        },
      },
    },
    expertPanel: {
      type: "array", maxItems: 6,
      items: {
        type: "object", additionalProperties: false,
        required: ["name", "lens", "specificFinding", "dataBasis", "decisionImpact", "action", "sourceIds"],
        properties: {
          name: shortText(36), lens: shortText(60), specificFinding: shortText(220), dataBasis: shortText(180),
          decisionImpact: shortText(180), action: shortText(180), sourceIds,
        },
      },
    },
    channelPlays: {
      type: "array", maxItems: 5,
      items: {
        type: "object", additionalProperties: false,
        required: ["channel", "targetBuyer", "platformSignal", "offer", "contentAngle", "conversionPath", "first30Days", "kpi", "sourceIds"],
        properties: {
          channel: shortText(50), targetBuyer: shortText(100), platformSignal: shortText(180), offer: shortText(160),
          contentAngle: shortText(180), conversionPath: shortText(180), first30Days: shortText(200), kpi: shortText(120), sourceIds,
        },
      },
    },
    risks: {
      type: "array", maxItems: 6,
      items: { type: "object", additionalProperties: false, required: ["level", "item", "trigger", "response"], properties: { level: { type: "string", enum: ["高", "中", "低"] }, item: shortText(100), trigger: shortText(140), response: shortText(180) } },
    },
    nextActions: {
      type: "array", maxItems: 5,
      items: { type: "object", additionalProperties: false, required: ["period", "action", "output", "metric"], properties: { period: shortText(24), action: shortText(180), output: shortText(100), metric: shortText(100) } },
    },
    visualReferences: {
      type: "array", maxItems: 4,
      items: { type: "object", additionalProperties: false, required: ["type", "title", "reason", "sourceId"], properties: { type: { type: "string", enum: ["image", "video", "product"] }, title: shortText(70), reason: shortText(160), sourceId: shortText(12) } },
    },
    reusablePrompt: shortText(1000),
    evidenceSources: {
      type: "array", maxItems: 12,
      items: { type: "object", additionalProperties: false, required: ["id", "publisher", "title", "url", "publishedAt", "claim"], properties: { id: shortText(12), publisher: shortText(60), title: shortText(140), url: shortText(500), publishedAt: shortText(32), claim: shortText(180) } },
    },
    evidenceNote: shortText(220),
  },
} as const;

const instructions = `你是“Anna姐·把事做成”的首席研究顾问。你不是在写一篇泛泛的行业综述，而是在替用户真金白银地决定：该不该进入、进入哪个细分、做什么具体产品、卖给谁、在哪个平台成交、第一步如何验证。

研究流程必须完整执行：
1. 先界定研究对象：国家/地区、行业、品类、目标客户、未来时间范围、最终决策。用户没有限定国家时，先做全球扫描并选择最值得下钻的1-2个市场，不要因此反复追问。
2. 判断行业处于上升期、结构性增长、成熟期还是下行期。至少用市场总量、增长率、渗透率/消费结构中的两类数据交叉判断，不能因为“市场在增长”就直接说值得进入。
3. 必须往下钻到细分类目。横向比较3-5个具体机会，每个必须写清：具体用户、具体产品、需求信号、价格与利润逻辑、增长驱动、竞争壁垒、适合渠道。宁可市场较小但利润和长期性更好，也不要推荐低价红海。
4. recommendedFocus只能选一个最优先细分，并说明为什么舍弃其他机会、以什么产品楔子切入、达到什么证据继续、出现什么指标停止。
5. 只有找到可核验的数字才生成charts：时间趋势用line；地区/品类横向比较用bar；同一总量的构成且合计约100%才用donut。单位必须统一，禁止把不同口径数据塞进同一图，禁止编造或用模糊估算冒充事实。
6. 专家会诊不是换名字说同一句话。市场战略、目标买手/用户、产品研发、供应链成本、平台运营、销售转化、合规等专家按任务动态选择4-6位。每位必须给出：针对哪个具体细分的发现、看了什么数据、这如何改变最终决策、下一步动作。
7. 平台运营必须基于前面已选定的市场、细分和客户，指出应在哪个真实平台观察什么信号，并给出该平台上适合的产品呈现、内容角度、转化路径、30天动作和KPI。不得只写“做社媒、做内容、找客户”。
8. innovationDirections必须是可理解的产品概念：为谁解决什么问题，产品形态和核心创新是什么，为什么现在成立，7-30天如何验证，未来壁垒在哪里。不要只写“智能化、个性化、品牌化”。
9. visualReferences只选择与推荐细分直接相关、来自真实来源的产品页、图片页或视频页；sourceId必须指向evidenceSources中的真实来源。没有可靠视觉来源可以留空，禁止虚构URL。
10. 站在“如果由你本人入局”的角度给出90天以前的具体打法。结论必须能转成产品清单、客户名单、内容样本、验证指标和停止条件。

证据规则：
- 市场、客户、产品、销售任务必须使用网络搜索。优先政府、行业协会、上市公司财报、平台官方、权威研究机构和真实头部渠道；同一关键结论尽量由两个独立来源支持。
- 任何正文、卡片、标题、结论中都不得出现原始URL、Markdown链接或“（某网站链接）”。所有URL只放在evidenceSources；其他字段只使用sourceIds关联。
- 事实与判断分开。没有可靠数字时明确写证据不足，不得补造市场规模、利润率、份额或增速。

表达要求：中文，直接、具体、克制。每句话尽量包含对象、数据或动作。避免“赋能、抓手、闭环、建议关注、持续优化”等空话。只在缺少某个答案会彻底改变决策时追问一次，否则基于明确假设继续完成。`;

function attachmentContent(files: Attachment[]) {
  return files.map((file) => file.type.startsWith("image/")
    ? { type: "input_image", image_url: file.data, detail: "high" }
    : { type: "input_file", filename: file.name, file_data: file.data });
}

function safePublicUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!/^https?:$/.test(url.protocol) || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
    return url;
  } catch { return null; }
}

function youtubeThumbnail(url: URL) {
  const shortId = url.hostname.includes("youtu.be") ? url.pathname.split("/").filter(Boolean)[0] : null;
  const watchId = url.hostname.includes("youtube.com") ? url.searchParams.get("v") : null;
  const embedId = url.hostname.includes("youtube.com") && url.pathname.includes("/embed/") ? url.pathname.split("/embed/")[1]?.split("/")[0] : null;
  const id = shortId || watchId || embedId;
  return id && /^[\w-]{6,20}$/.test(id) ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

async function pageThumbnail(value: string) {
  const url = safePublicUrl(value);
  if (!url) return undefined;
  const youtube = youtubeThumbnail(url);
  if (youtube) return youtube;
  try {
    const response = await fetch(url, { headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 AnnaResearchPreview/1.0" }, redirect: "follow", signal: AbortSignal.timeout(4500) });
    if (!response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return undefined;
    const html = (await response.text()).slice(0, 500_000);
    const match = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
    if (!match?.[1]) return undefined;
    const image = new URL(match[1], response.url);
    return safePublicUrl(image.toString())?.toString();
  } catch { return undefined; }
}

function cleanString(value: string) {
  return value
    .replace(/\[([^\]]+)]\(https?:\/\/[^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanNarrative(value: unknown, key = ""): unknown {
  if (typeof value === "string") return key === "url" || key === "thumbnailUrl" ? value : cleanString(value);
  if (Array.isArray(value)) return value.map((item) => cleanNarrative(item));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [childKey, cleanNarrative(childValue, childKey)]));
  return value;
}

async function enrichVisuals(report: Record<string, unknown>) {
  const sources = ((report.evidenceSources || []) as EvidenceSource[]).filter((source) => safePublicUrl(source.url));
  report.evidenceSources = sources;
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const visuals = ((report.visualReferences || []) as VisualReference[]).filter((item) => sourceMap.has(item.sourceId)).slice(0, 4);
  report.visualReferences = await Promise.all(visuals.map(async (item) => {
    const source = sourceMap.get(item.sourceId);
    return { ...item, thumbnailUrl: source ? await pageThumbnail(source.url) : undefined };
  }));
}

function validJobId(value: string | null): value is string {
  return Boolean(value && /^resp_[A-Za-z0-9_-]{8,200}$/.test(value));
}

function outputText(data: OpenAIResponse) {
  if (data.output_text) return data.output_text;
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text || "")
    .join("");
}

async function cancelOpenAIResponse(responseId: string, apiKey: string) {
  if (!validJobId(responseId)) return;
  try {
    await fetch(`https://api.openai.com/v1/responses/${responseId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
  } catch { /* Cancellation is best-effort; local job state still stops polling. */ }
}

function openAIError(data: OpenAIResponse, status: number) {
  if (status === 401) return "管理员配置的API Key已失效，请在设置中更新";
  if (status === 429 && data.error?.code === "insufficient_quota") return "API额度已用完，请管理员补充额度后继续";
  if (status === 429) return "本次任务超过当前安全用量，系统没有启动，也不会继续计费。请等待1分钟后重试。";
  if (status === 403) return "当前API Key没有使用所选模型的权限";
  return data.error?.message || "AI服务暂时不可用";
}

async function settingsWithKey() {
  await ensureTables();
  const runtimeEnv = await getRuntimeEnv();
  const settings = await runtimeEnv.DB.prepare("SELECT encrypted_api_key, model FROM app_settings WHERE id = 1").first<{ encrypted_api_key: string | null; model: string | null }>();
  if (!settings?.encrypted_api_key) return { runtimeEnv, settings, apiKey: null };
  return { runtimeEnv, settings, apiKey: await decryptSecret(settings.encrypted_api_key) };
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUserFromRequest(request);
    if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
    const { runtimeEnv, settings, apiKey } = await settingsWithKey();
    const payload = (await request.json()) as { prompt?: string; attachments?: Attachment[]; context?: string[] };
    const prompt = payload.prompt?.trim() || "";
    if (!prompt) return Response.json({ error: "请先告诉我你想把什么事情做成" }, { status: 400 });
    if (!apiKey) return Response.json({ requiresKey: true }, { status: 428 });
    const context = payload.context?.length ? `\n\n此前访谈记录：\n${payload.context.join("\n")}` : "";
    const content: Array<Record<string, unknown>> = [
      { type: "input_text", text: `用户当前想完成的事情：${prompt}${context}` },
      ...attachmentContent(payload.attachments || []),
    ];
    const deepResearch = /(市场|行业|赛道|品类|产品|竞品|机会|采购|投资|国家|增长|趋势)/.test(prompt);
    const model = settings?.model || "gpt-5.6";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        reasoning: { effort: deepResearch ? "medium" : "low" },
        instructions,
        input: [{ role: "user", content }],
        tools: [{ type: "web_search" }],
        max_output_tokens: INITIAL_OUTPUT_BUDGET,
        background: true,
        store: true,
        metadata: { anna_prompt: prompt.slice(0, 480) },
        text: { format: { type: "json_schema", name: "anna_deep_result_report", strict: true, schema: reportSchema } },
      }),
      signal: AbortSignal.timeout(45_000),
    });
    const data = (await response.json()) as OpenAIResponse;
    if (!response.ok) return Response.json({ error: openAIError(data, response.status) }, { status: response.status });
    if (!data.id || !validJobId(data.id)) return Response.json({ error: "后台任务没有成功建立，请重试" }, { status: 502 });
    await runtimeEnv.DB.prepare(`INSERT OR REPLACE INTO generation_jobs
      (root_id, active_response_id, prompt, model, continuation_count, status, started_at, updated_at, user_id)
      VALUES (?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`)
      .bind(data.id, data.id, prompt, model, data.status || "queued", user.id).run();
    return Response.json({ jobId: data.id, status: data.status || "queued" }, { status: 202 });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return Response.json({ error: timedOut ? "后台任务启动超时，请重试" : (error instanceof Error ? error.message : "生成失败，请稍后重试") }, { status: timedOut ? 504 : 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUserFromRequest(request);
    if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
    const jobId = new URL(request.url).searchParams.get("jobId");
    if (!validJobId(jobId)) return Response.json({ error: "任务编号无效" }, { status: 400 });
    const { runtimeEnv, apiKey } = await settingsWithKey();
    if (!apiKey) return Response.json({ requiresKey: true }, { status: 428 });

    const saved = await runtimeEnv.DB.prepare("SELECT report_json FROM reports WHERE id = ? AND user_id = ?").bind(jobId, user.id).first<{ report_json: string }>();
    if (saved?.report_json) return Response.json({ report: JSON.parse(saved.report_json), status: "completed" });

    const job = await runtimeEnv.DB.prepare("SELECT * FROM generation_jobs WHERE root_id = ? AND user_id = ?").bind(jobId, user.id).first<GenerationJob>();
    if (!job) return Response.json({ error: "未找到该账号的任务" }, { status: 404 });
    if (["cancelled", "failed", "timed_out", "needs_retry"].includes(job.status)) {
      const messages: Record<string, string> = {
        cancelled: "本次生成已停止。",
        failed: "生成结果格式异常，系统已停止任务和计费，请重新提交。",
        timed_out: "任务已达到10分钟安全上限，系统已自动停止，避免继续产生费用。",
        needs_retry: "本次生成未能完整收口，系统已停止，请重新提交。",
      };
      return Response.json({ error: messages[job.status], status: job.status }, { status: 409 });
    }

    const activeResponseId = job.active_response_id;
    const startedAtText = job.started_at || job.updated_at;
    const startedAt = startedAtText ? Date.parse(startedAtText.replace(" ", "T") + "Z") : Date.now();
    if (Date.now() - startedAt >= MAX_JOB_AGE_MS) {
      await cancelOpenAIResponse(activeResponseId, apiKey);
      await runtimeEnv.DB.prepare("UPDATE generation_jobs SET status = 'timed_out', updated_at = CURRENT_TIMESTAMP WHERE root_id = ?").bind(jobId).run();
      return Response.json({ error: "任务已达到10分钟安全上限，系统已自动停止，避免继续产生费用。", status: "timed_out" }, { status: 408 });
    }

    const response = await fetch(`https://api.openai.com/v1/responses/${activeResponseId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(25_000),
    });
    const data = (await response.json()) as OpenAIResponse;
    if (!response.ok) {
      if (response.status === 429) {
        await cancelOpenAIResponse(activeResponseId, apiKey);
        await runtimeEnv.DB.prepare("UPDATE generation_jobs SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE root_id = ?").bind(jobId).run();
        return Response.json({ error: openAIError(data, response.status), status: "failed" }, { status: 409 });
      }
      return Response.json({ error: openAIError(data, response.status) }, { status: response.status });
    }
    if (data.status === "queued" || data.status === "in_progress") {
      await runtimeEnv.DB.prepare("UPDATE generation_jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE root_id = ?")
        .bind(data.status, jobId).run();
      return Response.json({ jobId, status: data.status }, { status: 202 });
    }

    if (data.status === "incomplete" && data.incomplete_details?.reason === "max_output_tokens") {
      if (job.continuation_count >= MAX_CONTINUATIONS) {
        await runtimeEnv.DB.prepare("UPDATE generation_jobs SET status = 'needs_retry', updated_at = CURRENT_TIMESTAMP WHERE root_id = ?").bind(jobId).run();
        return Response.json({
          error: "这次资料量超过单份报告的安全上限，系统已停止继续消耗。原始输入已经保留，请缩小研究范围后重试。",
          status: "needs_retry",
        }, { status: 409 });
      }

      const lock = await runtimeEnv.DB.prepare(`UPDATE generation_jobs
        SET status = 'resuming', updated_at = CURRENT_TIMESTAMP
        WHERE root_id = ? AND active_response_id = ? AND continuation_count = ? AND status <> 'resuming'`)
        .bind(jobId, activeResponseId, job.continuation_count).run();
      if (!lock.meta.changes) {
        return Response.json({ jobId, status: "continuing", note: "研究证据已经完成，正在自动续写完整报告。" }, { status: 202 });
      }

      try {
        const nextCount = job.continuation_count + 1;
        const reasoning = { effort: "low" };
        const continuation = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: job.model,
            previous_response_id: activeResponseId,
            reasoning,
            instructions,
            input: "上一阶段已经完成深度检索，但在整理最终成果时触及单次输出预算。请保留上一阶段全部证据与判断，不要重新进行大范围搜索；忽略之前被截断的JSON，现在从头输出一份完整、严格符合指定结构的最终报告。优先保证结论、图表、细分机会、专家点评、渠道打法、证据来源全部完整。",
            max_output_tokens: INITIAL_OUTPUT_BUDGET,
            background: true,
            store: true,
            metadata: {
              anna_prompt: job.prompt.slice(0, 480),
              anna_root_job: jobId,
              anna_continuation: String(nextCount),
            },
            text: { format: { type: "json_schema", name: "anna_deep_result_report", strict: true, schema: reportSchema } },
          }),
          signal: AbortSignal.timeout(45_000),
        });
        const continuationData = (await continuation.json()) as OpenAIResponse;
        if (!continuation.ok || !continuationData.id || !validJobId(continuationData.id)) {
          await runtimeEnv.DB.prepare("UPDATE generation_jobs SET status = 'incomplete', updated_at = CURRENT_TIMESTAMP WHERE root_id = ?").bind(jobId).run();
          return Response.json({ error: openAIError(continuationData, continuation.status) }, { status: continuation.status || 502 });
        }
        await runtimeEnv.DB.prepare(`UPDATE generation_jobs
          SET active_response_id = ?, continuation_count = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE root_id = ?`)
          .bind(continuationData.id, nextCount, continuationData.status || "queued", jobId).run();
        return Response.json({ jobId, status: "continuing", note: "研究证据已经完成，正在自动续写完整报告。" }, { status: 202 });
      } catch (error) {
        await runtimeEnv.DB.prepare("UPDATE generation_jobs SET status = 'incomplete', updated_at = CURRENT_TIMESTAMP WHERE root_id = ?").bind(jobId).run();
        throw error;
      }
    }

    if (data.status !== "completed") {
      const message = data.error?.code === "rate_limit_exceeded"
        ? "本次任务超过当前安全用量，系统已停止，也不会自动重试。请等待1分钟后重新提交。"
        : data.incomplete_details?.reason === "content_filter"
        ? "部分内容触发了安全限制，请减少敏感个人信息后重试。"
        : (data.error?.message || "深度研究被服务端中断，请稍后重试。");
      await runtimeEnv.DB.prepare("UPDATE generation_jobs SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE root_id = ?").bind(jobId).run();
      return Response.json({ error: message, status: data.status }, { status: 409 });
    }

    const text = outputText(data);
    if (!text) return Response.json({ error: "研究已结束，但没有收到有效结果，请重试" }, { status: 502 });
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      await runtimeEnv.DB.prepare("UPDATE generation_jobs SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE root_id = ?").bind(jobId).run();
      return Response.json({
        error: "生成结果格式异常，系统已立即停止，不会继续重连或产生后续费用。请重新提交。",
        status: "failed",
      }, { status: 422 });
    }
    const report = cleanNarrative(parsed) as Record<string, unknown>;
    await enrichVisuals(report);
    const prompt = job.prompt || data.metadata?.anna_prompt || "后台深度研究";
    await runtimeEnv.DB.prepare("INSERT OR REPLACE INTO reports (id, prompt, category, title, report_json, user_id) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(jobId, prompt, String(report.category || "business"), String(report.title || "成果报告"), JSON.stringify(report), user.id).run();
    await runtimeEnv.DB.prepare("UPDATE generation_jobs SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE root_id = ?").bind(jobId).run();
    return Response.json({ report, status: "completed" });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return Response.json({ error: timedOut ? "查询结果时网络超时，系统会自动重连" : (error instanceof Error ? error.message : "查询失败") }, { status: timedOut ? 504 : 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUserFromRequest(request);
    if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
    const jobId = new URL(request.url).searchParams.get("jobId");
    if (!validJobId(jobId)) return Response.json({ error: "任务编号无效" }, { status: 400 });
    const { runtimeEnv, apiKey } = await settingsWithKey();
    if (!apiKey) return Response.json({ requiresKey: true }, { status: 428 });
    const job = await runtimeEnv.DB.prepare("SELECT active_response_id FROM generation_jobs WHERE root_id = ? AND user_id = ?").bind(jobId, user.id).first<{ active_response_id: string }>();
    if (!job) return Response.json({ error: "未找到该账号的任务" }, { status: 404 });
    const activeResponseId = job?.active_response_id && validJobId(job.active_response_id) ? job.active_response_id : jobId;
    const response = await fetch(`https://api.openai.com/v1/responses/${activeResponseId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await response.json()) as OpenAIResponse;
    if (!response.ok) return Response.json({ error: openAIError(data, response.status) }, { status: response.status });
    await runtimeEnv.DB.prepare("UPDATE generation_jobs SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE root_id = ?").bind(jobId).run();
    return Response.json({ status: data.status || "cancelled" });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "停止任务失败" }, { status: 500 });
  }
}
