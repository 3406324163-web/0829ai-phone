interface Env {
  AI_QUEUE: Queue;
  ADMIN_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 后台配置测试
    if (url.pathname === "/setup") {
  let token = url.searchParams.get("token") || "";

  // 支持 Authorization: Bearer xxx
  if (!token) {
    const auth = request.headers.get("Authorization") || "";
    if (auth.startsWith("Bearer ")) {
      token = auth.slice(7);
    }
  }

  // 支持 X-Admin-Token
  if (!token) {
    token = request.headers.get("X-Admin-Token") || "";
  }

  if (!token || token !== env.ADMIN_TOKEN) {
    return Response.json(
      {
        ok: false,
        error: "访问令牌错误"
      },
      { status: 401 }
    );
  }

  return Response.json({
    ok: true,
    message: "配置验证成功"
  });
}

    // 测试后台任务
    if (url.pathname === "/test") {
      await env.AI_QUEUE.send({
        type: "test",
        message: "你好，这是第一条后台测试消息"
      });

      return new Response("测试任务已进入 Queue！");
    }

    // 接收正式任务
    if (request.method === "POST" && url.pathname === "/task") {
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
