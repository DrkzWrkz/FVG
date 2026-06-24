import { NextResponse } from "next/server";

export async function GET() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

  try {
    const response = await fetch(`${apiBaseUrl}/healthz`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          apiBaseUrl,
          status: "degraded",
          detail: "Backend health check responded with a non-200 status."
        },
        { status: 502 }
      );
    }

    const payload = await response.json();

    return NextResponse.json({
      status: "ok",
      apiBaseUrl,
      backend: payload
    });
  } catch (error) {
    return NextResponse.json(
      {
        apiBaseUrl,
        status: "offline",
        detail: error instanceof Error ? error.message : "Unknown health check failure."
      },
      { status: 503 }
    );
  }
}
