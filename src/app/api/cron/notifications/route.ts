import { NextResponse } from "next/server";
import { runNotificationEngine } from "@/server/actions/notifications";

export async function GET(request: Request) {
  try {
    // Basic auth using URL search params for cron triggering
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    // In a real app, store this in process.env.CRON_SECRET
    // Since we don't have it defined in .env right now, we use a hardcoded fallback or skip it,
    // but for security it's best to check an env variable. Let's assume a basic one for now.
    const expectedSecret = process.env.CRON_SECRET || "local_dev_secret";
    
    if (secret !== expectedSecret && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mode = (searchParams.get("mode") as "all" | "missing_data" | "daily") || "all";

    const result = await runNotificationEngine(mode);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
