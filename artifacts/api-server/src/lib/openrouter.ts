const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

export type JsonCompletionResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: string; statusCode?: number };

export async function requestOpenRouterJson(
  prompt: string,
  maxTokens: number,
): Promise<JsonCompletionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "missing_api_key" };
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "SkillTwin",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.25,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Respond with valid JSON only. Do not wrap it in markdown.",
          },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: "provider_http_error",
        statusCode: response.status,
      };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return { ok: false, reason: "empty_provider_response" };
    }

    try {
      return { ok: true, value: JSON.parse(content) as unknown };
    } catch {
      return { ok: false, reason: "invalid_provider_json" };
    }
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error && error.name === "TimeoutError"
          ? "provider_timeout"
          : "provider_request_failed",
    };
  }
}
