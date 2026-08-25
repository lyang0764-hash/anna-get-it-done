import { ensureTables, getRuntimeEnv } from "../_shared";
import { getSessionUserFromRequest } from "../../auth";

type ChatRow = {
  id: string;
  prompt: string;
  status: string;
  title: string | null;
  updated_at: string;
};

type FileRow = {
  id: string;
  title: string;
  category: string;
  created_at: string;
};

export async function GET(request: Request) {
  const user = await getSessionUserFromRequest(request);
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  await ensureTables();
  const { DB } = await getRuntimeEnv();
  const [chatResult, fileResult] = await Promise.all([
    DB.prepare(`SELECT j.root_id AS id, j.prompt, j.status, r.title, j.updated_at
      FROM generation_jobs j
      LEFT JOIN reports r ON r.id = j.root_id
      WHERE j.user_id = ?
      ORDER BY j.updated_at DESC
      LIMIT 60`).bind(user.id).all<ChatRow>(),
    DB.prepare(`SELECT id, title, category, created_at
      FROM reports
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 40`).bind(user.id).all<FileRow>(),
  ]);

  const chats = (chatResult.results || []).map((item) => ({
    id: item.id,
    title: item.title || item.prompt,
    prompt: item.prompt,
    status: item.status,
    updatedAt: item.updated_at,
  }));
  const files = (fileResult.results || []).map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    createdAt: item.created_at,
  }));

  return Response.json({ chats, files }, { headers: { "Cache-Control": "no-store" } });
}
