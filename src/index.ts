interface Env {
  AI_QUEUE: Queue;
  ADMIN_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // /setup：检查后台配置
    if (url.pathname === "/setup" && request.method === "GET") {
      return new Response(`
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Phone Backend Setup</title>
</head>
<body style="font-family:sans-serif;padding:30px;max-width:700px;margin:auto">
<h2>AI Phone Backend Setup</h2>
<p>请输入你在模拟手机网页中生成的访问令牌：</p>

<form method="POST">
<input name="token" type="password"
style="width:100%;padding:14px;font-size:16px;box-sizing:border-box"
placeholder="访问令牌">
<br><br>
<button style="padding:12px 20px;font-size:16px">生成配置</button>
</form>
</body>
</html>
      `, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8"
        }
      });
    }

    // /setup 提交令牌
    if (url.pathname === "/setup" && request.method === "POST") {
      const form = await request.formData();
      const token = String(form.get("token") || "");

      if (!token || token !== env.ADMIN_TOKEN) {
        return new Response("访问令牌错误", { status: 401 });
      }

      return Response.json({
        relay_url: url.origin,
        token: token,
        task_endpoint: "/task",
        test_endpoint: "/test",
        ok: true
      });
    }

    // 测试后台任务
    if (url.pathname === "/test") {
      const token = request.headers.get("Authorization")?.replace("Bearer ", "");

      if (token !== env.ADMIN_TOKEN) {
        return new Response("Unauthorized", { status: 401 });
      }

      await env.AI_QUEUE.send({
        type: "test",
        message: "你好，这是第一条后台测试消息",
        time: Date.now()
      });

      return Response.json({
        ok: true,
        message: "测试任务已进入 Queue！"
      });
    }

    // 接收正式任务
    if (request.method === "POST" && url.pathname === "/task") {
      const token = request.headers.get("Authorization")?.replace("Bearer ", "");

      if (token !== env.ADMIN_TOKEN) {
        return new Response("Unauthorized", { status: 401 });
      }

      const body = await request.json();

      await env.AI_QUEUE.send(body);

      return Response.json({
        ok: true,
        message: "任务已经进入后台"
      });
    }

    return new Response("AI Phone Backend OK");
  },

  async queue(batch: MessageBatch): Promise<void> {
    for (const message of batch.messages) {
      console.log("后台收到任务：", message.body);
      message.ack();
    }
  }
};
