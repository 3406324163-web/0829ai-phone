interface Env {
  AI_QUEUE: Queue;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

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

  async queue(batch: MessageBatch<any>): Promise<void> {
    for (const message of batch.messages) {
      console.log("后台
