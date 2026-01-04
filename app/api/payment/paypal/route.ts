import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "edge";

async function verifyPayPalWebhook(headers: Headers, bodyText: string) {
  // Skeleton: implement server-side verification using PayPal's /v1/notifications/verify-webhook-signature
  // This requires PAYPAL_CLIENT_ID, PAYPAL_SECRET and PAYPAL_WEBHOOK_ID in env.
  // For now return false to indicate not-verified until implemented.
  return false;
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const verified = await verifyPayPalWebhook(req.headers, bodyText);

  if (!verified) return new NextResponse(JSON.stringify({ error: "Invalid webhook signature" }), { status: 400 });

  let payload: any = {};
  try {
    payload = JSON.parse(bodyText);
  } catch (e) {
    // continue
  }

  try {
    const amount = payload?.resource?.amount?.total ? Number(payload.resource.amount.total) : 0;
    await prisma.payment.create({
      data: {
        amount,
        provider: "paypal",
        externalId: payload.resource?.id,
        webhookPayload: payload,
        status: "PENDING",
      },
    });
  } catch (err) {
    // log in production
  }

  return NextResponse.json({ ok: true });
}
