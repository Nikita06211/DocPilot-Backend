import { createAgent } from "langchain";
import { ChatAnthropic } from "@langchain/anthropic";
import { createSearchTool } from "./tools/search";
import { createScraperTool } from "./tools/scraper";
import type { Env } from "./types";

const SYSTEM_PROMPT = `You are a documentation expert. When a user asks a question about a technology, library, or framework, follow these steps strictly:

1. Call web_search ONCE with a focused query to find the most relevant official documentation page.
2. Pick the single best URL from the results and call scrape_docs on it.
3. Read the scraped content and answer the user's question. If the content is sufficient, respond immediately.
4. Only if critical information is missing, you may scrape ONE more page. Do not exceed 2 scrape calls total.

Rules:
- Do NOT search more than twice. Do NOT scrape more than 2 pages.
- Prefer official documentation over blogs or tutorials.
- After scraping, answer with what you have. Do not keep searching for perfection.
- Cite the source URLs at the end of your answer.
- If you cannot find relevant documentation, say so honestly.`;

export function buildAgent(env: Env) {
  const llm = new ChatAnthropic({
    model: 'claude-haiku-4-5-20251001',
    clientOptions: {
        // baseURL: env.CF_AI_GATEWAY_URL,
        // defaultHeaders: {
        //     "cf-aig-authorization": `Bearer ${env.CF_API_TOKEN}`
        // },
        apiKey: env.ANTHROPIC_API_KEY,

    },
    verbose:true,
    thinking:{
      budget_tokens:8000,
      type:'enabled'
    }
  });

  const tools = [
    createSearchTool(env.TAVILY_API_KEY),
    createScraperTool(env.CF_ACCOUNT_ID, env.CF_API_TOKEN),
  ];

  return createAgent({
    model: llm,
    tools,
    systemPrompt: SYSTEM_PROMPT,
  });
}
