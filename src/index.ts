import { Hono } from "hono";
import { cors } from "hono/cors";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { buildAgent } from "./agent";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("*", clerkMiddleware());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/debug", (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const env = c.env;
  return c.json({
    hasAnthropicKey: !!env.ANTHROPIC_API_KEY,
    anthropicKeyPrefix: env.ANTHROPIC_API_KEY?.slice(0, 7) + "...",
    hasCfToken: !!env.CF_API_TOKEN,
    cfTokenPrefix: env.CF_API_TOKEN?.slice(0, 8) + "...",
    gatewayUrl: env.CF_AI_GATEWAY_URL,
    hasTavilyKey: !!env.TAVILY_API_KEY,
  });
});

app.post("/ask", async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<{ query?: string }>();
  const query = body.query?.trim();

  if (!query) {
    return c.json({ error: "query is required" }, 400);
  }

  const agent = buildAgent(c.env);

  try {
    const result = await agent.invoke(
      { messages: [{ role: "user", content: query }] },
      { recursionLimit: 40 },
    );

    const lastMessage = result.messages.at(-1);
    const answer =
      typeof lastMessage?.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage?.content);

    return c.json({ answer });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Agent failed unexpectedly";
    return c.json({ error: message }, 500);
  }
});

/** AI SDK streaming endpoint - use with useChat(api: '/api/chat') */
app.options("/api/chat", (c) => c.body(null, 204));
app.post("/api/chat", async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { messages } = await c.req.json<{ messages?: UIMessage[] }>();

  if (!messages?.length) {
    return c.json({ error: "messages is required" }, 400);
  }

  const agent = buildAgent(c.env);
  const langchainMessages = await toBaseMessages(messages);

  const stream = await agent.stream(
    { messages: langchainMessages },
    { streamMode: ["values", "messages"], recursionLimit: 40 },
  );

  return createUIMessageStreamResponse({
    stream: toUIMessageStream(stream),
  });
});

export default app;
