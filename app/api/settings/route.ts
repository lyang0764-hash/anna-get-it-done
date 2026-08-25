import { getSessionUserFromRequest } from "../../auth";
import { ensureTables, encryptSecret, getRuntimeEnv } from "../_shared";

async function isAdmin(request: Request) {
  return (await getSessionUserFromRequest(request))?.role === "admin";
}

export async function GET(request: Request) {
  if (!await getSessionUserFromRequest(request)) return Response.json({ error: "请先登录" }, { status: 401 });
  await ensureTables();
  const runtimeEnv = await getRuntimeEnv();
  const row = await runtimeEnv.DB.prepare(
    "SELECT encrypted_api_key, model, official_qr_data FROM app_settings WHERE id = 1",
  ).first<{ encrypted_api_key: string | null; model: string | null; official_qr_data: string | null }>();
  return Response.json({
    hasKey: Boolean(row?.encrypted_api_key),
    model: row?.model || "gpt-5.6",
    officialQrData: row?.official_qr_data || "",
  });
}

export async function POST(request: Request) {
  if (!await isAdmin(request)) return Response.json({ error: "无管理员权限" }, { status: 403 });
  await ensureTables();
  const runtimeEnv = await getRuntimeEnv();
  const payload = (await request.json()) as { apiKey?: string; model?: string; officialQrData?: string };
  const apiKey = payload.apiKey?.trim();
  const model = payload.model?.trim() || "gpt-5.6";
  const qr = payload.officialQrData?.trim() || null;
  const existing = await runtimeEnv.DB.prepare(
    "SELECT encrypted_api_key FROM app_settings WHERE id = 1",
  ).first<{ encrypted_api_key: string | null }>();
  const encrypted = apiKey ? await encryptSecret(apiKey) : existing?.encrypted_api_key || null;
  await runtimeEnv.DB.prepare(`INSERT INTO app_settings (id, encrypted_api_key, model, official_qr_data, updated_at)
    VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET encrypted_api_key = excluded.encrypted_api_key,
      model = excluded.model, official_qr_data = excluded.official_qr_data, updated_at = CURRENT_TIMESTAMP`)
    .bind(encrypted, model, qr).run();
  return Response.json({ ok: true, hasKey: Boolean(encrypted), model, officialQrData: qr || "" });
}
