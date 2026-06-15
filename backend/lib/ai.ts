export async function generateAIContent(apiKey: string, prompt: string): Promise<string> {
  if (!apiKey) return "AI content (no key configured)";
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 600, temperature: 0.7 }),
    });
    if (!res.ok) return `AI content (OpenAI ${res.status})`;
    const json = (await res.json()) as any;
    return json.choices?.[0]?.message?.content?.trim() || "AI generated content";
  } catch (e) {
    return "AI generated content (offline)";
  }
}
