import { createSession, normalizeUsername, verifyPassword } from "../../../auth";
import { ensureTables, getRuntimeEnv } from "../../_shared";

export async function POST(request: Request) {
  try {
    await ensureTables();
    const payload = await request.json() as { username?: string; password?: string };
    const username = normalizeUsername(payload.username || "");
    if (!username || !payload.password) return Response.json({ error: "请输入用户名和密码" }, { status: 400 });
    const { DB } = await getRuntimeEnv();
    const user = await DB.prepare("SELECT id, password_hash, active FROM users WHERE username = ? COLLATE NOCASE")
      .bind(username).first<{ id: string; password_hash: string; active: number }>();
    const valid = Boolean(user?.active && await verifyPassword(payload.password, user.password_hash));
    if (!valid || !user) return Response.json({ error: "用户名或密码不正确" }, { status: 401 });
    const cookie = await createSession(user.id, request);
    return Response.json({ ok: true }, { headers: { "Set-Cookie": cookie, "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Login failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "登录服务暂时不可用，请稍后再试" }, { status: 500 });
  }
}
