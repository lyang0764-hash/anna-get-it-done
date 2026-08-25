type SeedMember = { username: string; displayName: string; passwordHash: string };
type RuntimeEnv = { DB: D1Database; SETTINGS_ENCRYPTION_KEY?: string; ADMIN_USERNAME?: string; ADMIN_PASSWORD_HASH?: string; MEMBER_SEED_HASHES_JSON?: string };

export async function getRuntimeEnv() {
  const workerModule = await import("cloudflare:workers");
  return workerModule.env as unknown as RuntimeEnv;
}

export async function ensureTables() {
  const runtimeEnv = await getRuntimeEnv();
  const db = runtimeEnv.DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY,
      encrypted_api_key TEXT,
      model TEXT NOT NULL DEFAULT 'gpt-5.6',
      official_qr_data TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      report_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS generation_jobs (
      root_id TEXT PRIMARY KEY,
      active_response_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      model TEXT NOT NULL,
      continuation_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'queued',
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
  ]);
  const [reportColumns, jobColumns] = await Promise.all([
    db.prepare("PRAGMA table_info(reports)").all<{ name: string }>(),
    db.prepare("PRAGMA table_info(generation_jobs)").all<{ name: string }>(),
  ]);
  if (!(reportColumns.results || []).some((column) => column.name === "user_id")) {
    await db.prepare("ALTER TABLE reports ADD COLUMN user_id TEXT").run();
  }
  if (!(jobColumns.results || []).some((column) => column.name === "user_id")) {
    await db.prepare("ALTER TABLE generation_jobs ADD COLUMN user_id TEXT").run();
  }
  if (!(jobColumns.results || []).some((column) => column.name === "started_at")) {
    await db.prepare("ALTER TABLE generation_jobs ADD COLUMN started_at TEXT").run();
  }
  const username = runtimeEnv.ADMIN_USERNAME?.trim().toLowerCase();
  const passwordHash = runtimeEnv.ADMIN_PASSWORD_HASH?.trim();
  if (username && passwordHash) {
    await db.prepare(`INSERT INTO users (id, username, display_name, password_hash, role, active, updated_at)
      VALUES ('admin-root', ?, 'Anna姐', ?, 'admin', 1, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET username = excluded.username, password_hash = excluded.password_hash,
        role = 'admin', active = 1, updated_at = CURRENT_TIMESTAMP`).bind(username, passwordHash).run();
    await db.batch([
      db.prepare("UPDATE reports SET user_id = 'admin-root' WHERE user_id IS NULL"),
      db.prepare("UPDATE generation_jobs SET user_id = 'admin-root' WHERE user_id IS NULL"),
      db.prepare("DELETE FROM auth_sessions WHERE expires_at <= CURRENT_TIMESTAMP"),
    ]);
  }
  if (runtimeEnv.MEMBER_SEED_HASHES_JSON) {
    try {
      const seedMembers = JSON.parse(runtimeEnv.MEMBER_SEED_HASHES_JSON) as SeedMember[];
      for (const member of seedMembers) {
        if (!member.username || !member.displayName || !member.passwordHash) continue;
        await db.prepare(`INSERT INTO users (id, username, display_name, password_hash, role, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'member', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(username) DO UPDATE SET display_name = excluded.display_name,
            password_hash = excluded.password_hash, role = 'member', active = 1, updated_at = CURRENT_TIMESTAMP`)
          .bind(`seed-${encodeURIComponent(member.username)}`, member.username.trim().toLowerCase(), member.displayName.trim(), member.passwordHash).run();
      }
    } catch (error) {
      console.error("Member seed configuration is invalid", error instanceof Error ? error.message : "Unknown error");
    }
  }
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function encryptionKey() {
  const runtimeEnv = await getRuntimeEnv();
  const secret = runtimeEnv.SETTINGS_ENCRYPTION_KEY;
  if (!secret) throw new Error("管理员安全配置尚未完成");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptSecret(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey();
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}

export async function decryptSecret(value: string) {
  const [ivValue, encryptedValue] = value.split(".");
  const key = await encryptionKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(ivValue) }, key, base64ToBytes(encryptedValue),
  );
  return new TextDecoder().decode(decrypted);
}
