import { NextRequest, NextResponse } from "next/server";

// Simple proxy to backend auth service, keeping request/response shapes

const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://23.27.186.134:8080";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const url = `${AUTH_BASE_URL.replace(/\/$/, "")}/v1/auth/login`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(
      data ?? { error: "Empty response from auth server" },
      { status: res.status }
    );
  } catch (error: any) {
    console.error("/api/auth/login error", error);
    return NextResponse.json(
      { error: error?.message || "Auth proxy error" },
      { status: 500 }
    );
  }
}
