// Claude 호출(얇음). fetch 주입 가능(테스트). 실패 시 throw → 핸들러가 502/504 매핑.
export async function callClaude(
  args: { system: string; user: string; apiKey: string; model?: string; maxTokens?: number },
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': args.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: args.model ?? 'claude-sonnet-4-5',
      max_tokens: args.maxTokens ?? 1024,
      system: args.system,
      messages: [{ role: 'user', content: args.user }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}`);
  const json: any = await res.json();
  const text = Array.isArray(json?.content) ? json.content.map((c: any) => c?.text ?? '').join('').trim() : '';
  if (!text) throw new Error('anthropic empty');
  return text;
}
