"use client";

import { FormEvent, useState } from "react";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const text = await response.text();
      let data: { error?: string } = {};
      try { data = text ? JSON.parse(text) as { error?: string } : {}; } catch { data = {}; }
      if (!response.ok) throw new Error(data.error || "登录服务暂时不可用，请稍后再试");
      window.location.assign("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "登录失败");
    } finally { setLoading(false); }
  }

  return <main className="login-page">
    <section className="login-brand" aria-label="Anna姐思享汇">
      <img className="login-logo-image" src="/assets/anna-brand-logo.png" alt="Anna姐思享汇｜聚思 · 享见 · 汇资源" />
      <div className="login-brand-story">
        <h2>Anna姐 把事干成</h2>
        <p>从一句想法，到一份<br />能直接使用的成果</p>
      </div>
    </section>
    <section className="login-card">
      <div className="login-eyebrow">ANNA · 把事干成</div>
      <h1>欢迎回来</h1>
      <p className="login-intro">登录你的独立工作台，继续完成任务、打开历史对话和下载成果。</p>
      <form onSubmit={login}>
        <label><span>用户名</span><input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="请输入用户名" /></label>
        <label><span>密码</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入密码" /></label>
        {error && <div className="login-error" role="alert">{error}</div>}
        <button type="submit" disabled={loading || !username.trim() || !password}>{loading ? "正在登录…" : "登录并继续"}</button>
      </form>
      <small>账号由管理员统一创建。如无法登录，请联系管理员。</small>
    </section>
  </main>;
}
