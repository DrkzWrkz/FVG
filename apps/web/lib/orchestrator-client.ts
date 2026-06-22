const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function parseResponse<TResponse>(response: Response): Promise<TResponse> {
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

  return parseResponse<TResponse>(response);
}

export async function postFormToOrchestrator<TResponse>(
  path: string,
  payload: FormData
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: payload,
    cache: "no-store"
  });

  return parseResponse<TResponse>(response);
}

export async function getFromOrchestrator<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    cache: "no-store"
  });

  return parseResponse<TResponse>(response);
}
