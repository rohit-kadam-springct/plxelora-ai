import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const evt: WebhookEvent = await request.json();

    if (evt.type === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      // Create user in database when they sign up
      await db.insert(users).values({
        clerkId: id,
        email: email_addresses[0]?.email_address || "",
        firstName: first_name,
        lastName: last_name,
        imageUrl: image_url,
        plan: "FREE",
        credits: 5,
      });

      console.log(`✅ User created in database: ${id}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
