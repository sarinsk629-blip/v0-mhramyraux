import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export const runtime = "edge";

const RAZORPAY_SECRET = process.env.RAZORPAY_SECRET || "";

export async function POST(req: NextRequest) {
  // This handler supports webhook verification and storing payment events.
  const signature = req.headers.get("x-razorpay-signature") || "";
  const bodyText = await req.text();

  if (signature) {
    const expected = crypto.createHmac("sha256", RAZORPAY_SECRET).update(bodyText).digest("hex");
    if (expected !== signature) {
      return new NextResponse(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(bodyText);
    } catch (e) {
      // continue with empty payload
    }

    // Store payment event and mark PENDING. Actual release happens after satisfaction vote.
    try {
      const amountPaise = Number(payload?.payload?.payment?.entity?.amount || 0);
      await prisma.payment.create({
        data: {
          amount: amountPaise / 100, // store in currency units (as Decimal)
          provider: "razorpay",
          externalId: payload?.payload?.payment?.entity?.id,
          webhookPayload: payload,
          status: "PENDING",
        },
      });
    } catch (err) {
      // In Edge runtime we avoid throwing; log in production
    }

    return NextResponse.json({ ok: true });
  }

  return new NextResponse(JSON.stringify({ error: "Unsupported operation" }), { status: 400 });
}
