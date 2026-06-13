import { NextRequest, NextResponse } from "next/server";
import {
  addWaitlistEntry,
  getWaitlistEntries,
  isWaitlistStorageConfigured,
} from "@/lib/waitlist/store";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!isWaitlistStorageConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Waitlist storage is not configured on the server." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email address." },
        { status: 400 }
      );
    }

    const result = await addWaitlistEntry(name, email);

    if (result.duplicate) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    return NextResponse.json({ ok: true, duplicate: false });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to save signup." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isWaitlistStorageConfigured()) {
    return NextResponse.json(
      { error: "Waitlist storage is not configured." },
      { status: 503 }
    );
  }

  const entries = await getWaitlistEntries();
  return NextResponse.json({ entries, total: entries.length });
}
