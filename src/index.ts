interface Env {
  AI_QUEUE: Queue;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

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
