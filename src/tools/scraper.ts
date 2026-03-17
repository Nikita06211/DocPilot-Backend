import { DynamicTool } from "@langchain/core/tools";

const MAX_CONTENT_LENGTH = 16000;

interface MarkdownResponse {
  success: boolean;
  result: string;
}

export function createScraperTool(accountId: string, apiToken: string) {
  return new DynamicTool({
    name: "scrape_docs",
    description:
      "Scrape a documentation page and return its content as markdown. Input must be a valid URL. Use this after finding documentation URLs via web_search.",
    func: async (url: string): Promise<string> => {
      const trimmedUrl = url.trim();

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/markdown`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: trimmedUrl,
            rejectResourceTypes: ["image", "media", "font", "stylesheet"],
          }),
        }
      );

      if (!response.ok) {
        return `Scrape failed with status ${response.status}: ${await response.text()}`;
      }

      const data = (await response.json()) as MarkdownResponse;
      const markdown = data.result ?? "";

      if (!markdown) {
        return "No content could be extracted from this page.";
      }

      console.log("tool used for scraping",trimmedUrl);
      if (markdown.length > MAX_CONTENT_LENGTH) {
        return (
          markdown.slice(0, MAX_CONTENT_LENGTH) +
          "\n\n[Content truncated — ask a more specific question or request a different page]"
        );
      }

      return markdown;
    },
  });
}
