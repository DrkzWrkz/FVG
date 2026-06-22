const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function postToOrchestrator<TResponse, TRequest>(
  path: string,
  payload: TRequest
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}.`;

    try {
      const errorPayload = (await response.json()) as { detail?: string };
      throw new Error(errorPayload.detail ?? fallbackMessage);
    } catch {
      throw new Error(fallbackMessage);
    }
  }

  return (await response.json()) as TResponse;
}
