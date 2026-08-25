import { getSessionUserFromRequest, hashPassword, normalizeUsername } from "../../../auth";
import { ensureTables, getRuntimeEnv } from "../../_shared";

async function requireAdmin(request: Request) {
  const user = await getSessionUserFromRequest(request);
  return user?.role === "admin" ? user : null;
}

export async function GET(request: Request) {
  if (!await requireAdmin(request)) return Response.json({ error: "无管理员权限" }, { status: 403 });
  await ensureTables();
  const { DB } = await getRuntimeEnv();
  const rows = await DB.prepare(`SELECT id, username, display_name, role, active, created_at
    FROM users ORDER BY CASE role WHEN 'admin' THEN 0 ELSE 1 END, created_at DESC`).all<{
      id: string; username: string; display_name: string; role: string; active: number; created_at: string;
    }>();
  return Response.json({ users: (rows.results || []).map((item) => ({
    id: item.id, username: item.username, displayName: item.display_name,
    role: item.role, active: Boolean(item.active), createdAt: item.created_at,
  })) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!await requireAdmin(request)) return Response.json({ error: "无管理员权限" }, { status: 403 });
  const payload = await request.json() as { username?: string; displayName?: string; password?: string };
  const username = normalizeUsername(payload.username || "");
  const displayName = payload.displayName?.trim() || username;
  if (!/^[\p{L}\p{N}._-]{2,32}$/u.test(username)) return Response.json({ error: "用户名使用2—32位中文、英文字母、数字、点、横线或下划线" }, { status: 400 });
  if ((payload.password || "").length < 8) return Response.json({ error: "密码至少8位" }, { status: 400 });
  await ensureTables();
  const { DB } = await getRuntimeEnv();
  try {
    await DB.prepare(`INSERT INTO users (id, username, display_name, password_hash, role, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'member', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`)
      .bind(`usr_${crypto.randomUUID()}`, username, displayName, await hashPassword(payload.password || "")).run();
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error && /unique/i.test(error.message) ? "该用户名已经存在" : "账号创建失败";
    return Response.json({ error: message }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  if (!await requireAdmin(request)) return Response.json({ error: "无管理员权限" }, { status: 403 });
  const payload = await request.json() as { id?: string; active?: boolean };
  if (!payload.id || payload.id === "admin-root") return Response.json({ error: "管理员主账号不能停用" }, { status: 400 });
  await ensureTables();
  const { DB } = await getRuntimeEnv();
  await DB.prepare("UPDATE users SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = 'member'")
    .bind(payload.active ? 1 : 0, payload.id).run();
  if (!payload.active) await DB.prepare("DELETE FROM auth_sessions WHERE user_id = ?").bind(payload.id).run();
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!await requireAdmin(request)) return Response.json({ error: "无管理员权限" }, { status: 403 });
  const payload = await request.json() as { id?: string };
  if (!payload.id || payload.id === "admin-root") return Response.json({ error: "管理员主账号不能删除" }, { status: 400 });
  await ensureTables();
  const { DB } = await getRuntimeEnv();
  await DB.batch([
    DB.prepare("DELETE FROM auth_sessions WHERE user_id = ?").bind(payload.id),
    DB.prepare("DELETE FROM users WHERE id = ? AND role = 'member'").bind(payload.id),
  ]);
  return Response.json({ ok: true });
}
