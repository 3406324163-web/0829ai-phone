export interface Env {
  ADMIN_TOKEN?: string;
  NOTIFICATIONS?: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. 跨域处理 (CORS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    // 2. /setup 路径：提供可视化的 mmrelay1 配置生成页面
    if (path === "/setup") {
      const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>后台中继配置生成器</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; background: #f4f5f7; color: #333; }
    .card { background: #fff; max-width: 480px; margin: 20px auto; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    h2 { margin-top: 0; font-size: 20px; color: #111; }
    input { width: 100%; box-sizing: border-box; padding: 10px; margin: 12px 0; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }
    button { width: 100%; padding: 12px; background: #007aff; color: #fff; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; }
    button:active { opacity: 0.8; }
    .result-box { margin-top: 20px; display: none; }
    textarea { width: 100%; box-sizing: border-box; height: 100px; padding: 8px; border-radius: 6px; border: 1px solid #ddd; font-family: monospace; font-size: 12px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="card">
    <h2>获取 App 导入配置</h2>
    <p style="font-size: 13px; color: #666;">请输入你在 Cloudflare 绑定的 ADMIN_TOKEN / 访问令牌：</p>
    <input type="password" id="tokenInput" placeholder="请输入访问令牌" />
    <button onclick="generateConfig()">生成 mmrelay1 配置</button>
    <div class="result-box" id="resultBox">
      <p style="font-size: 13px; color: #28a745; font-weight: bold;">生成成功！点击下方按钮复制整段配置：</p>
      <textarea id="output" readonly></textarea>
      <button onclick="copyConfig()" style="background: #28a745; margin-top: 8px;">复制配置</button>
    </div>
  </div>
  <script>
    function generateConfig() {
      const token = document.getElementById('tokenInput').value.trim();
      if (!token) { alert('请输入令牌！'); return; }
      const baseUrl = window.location.origin;
      const payload = {
        relay_url: baseUrl,
        token: token,
        task_endpoint: "/task",
        test_endpoint: "/test",
        version: "1.0"
      };
      // 转换为 APP 要求的 mmrelay1 字符串
      const jsonStr = JSON.stringify(payload);
      const encoded = btoa(encodeURIComponent(jsonStr));
      const mmrelayStr = "mmrelay1" + encoded;
      document.getElementById('output').value = mmrelayStr;
      document.getElementById('resultBox').style.display = 'block';
    }
    function copyConfig() {
      const copyText = document.getElementById('output');
      copyText.select();
      document.execCommand('copy');
      alert('已复制到剪贴板！请回到 App 粘贴导入。');
    }
  </script>
</body>
</html>`;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // 3. /test 路径：测试连通性
    if (path === "/test") {
      return new Response(JSON.stringify({ ok: true, status: "active" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // 4. /task 路径：后台接收与转发任务
    if (path === "/task") {
      return new Response(JSON.stringify({ ok: true, message: "Task received" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // 5. 根路径防护/提示
    return new Response(
      JSON.stringify({
        relay_url: url.origin,
        token: env.ADMIN_TOKEN ? "已设置 (Secret)" : "未设置",
        status: "ready",
        setup_page: url.origin + "/setup"
      }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  },
};
