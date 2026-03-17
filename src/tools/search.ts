import { DynamicTool } from "@langchain/core/tools";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilyResult[];
}

export function createSearchTool(apiKey: string) {
  return new DynamicTool({
    name: "web_search",
    description:
      "Search the web for documentation pages. Use this to find the official documentation URL for a technology or library. Input should be a search query string like 'React Server Components official documentation'.",
    func: async (query: string): Promise<string> => {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: "basic",
          max_results: 5,
          include_answer: false,
        }),
      });

      if (!response.ok) {
        return `Search failed with status ${response.status}: ${await response.text()}`;
      }

      const data = (await response.json()) as TavilyResponse;
      console.log("tool used for searching",data.results.map(r=>r.url));
      return data.results
        .map(
          (r, i) =>
            `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    ${r.content.slice(0, 200)}`
        )
        .join("\n\n");
    },
  });
}
