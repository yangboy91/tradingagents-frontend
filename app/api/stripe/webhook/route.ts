import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia",
  });

// In-memory store for subscriptions (use a real DB in production)
// This is a simple Map: userId -> { subscribed: boolean, expiresAt: number }
// In production, use a real database like Supabase, PlanetScale, etc.
export const subscriptions = new Map<string, { subscribed: boolean; expiresAt: number }>();

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
          event = stripe.webhooks.constructEvent(
                  body,
                  signature,
                  process.env.STRIPE_WEBHOOK_SECRET!
                );
        } catch (err) {
          console.error("Webhook signature verification failed:", err);
          return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

    switch (event.type) {
          case "checkout.session.completed": {
                  const session = event.data.object as Stripe.Checkout.Session;
                  const userId = session.metadata?.userId;
                  if (userId && session.subscription) {
                            // Mark user as subscribed
                            subscriptions.set(userId, {
                                        subscribed: true,
                                        expiresAt: Date.now() + 400 * 24 * 60 * 60 * 1000, // 400 days max
                                      });
                            console.log(`User ${userId} subscribed`);
                          }
                  break;
                }

          case "customer.subscription.deleted": {
                  const subscription = event.data.object as Stripe.Subscription;
                  const userId = subscription.metadata?.userId;
                  if (userId) {
                            subscriptions.set(userId, {
                                        subscribed: false,
                                        expiresAt: 0,
                                      });
                            console.log(`User ${userId} subscription cancelled`);
                          }
                  break;
                }

          case "invoice.payment_failed": {
                  const invoice = event.data.object as Stripe.Invoice;
                  const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
                  if (subId) {
                            const sub = await stripe.subscriptions.retrieve(subId);
                            const userId = sub.metadata?.userId;
                            if (userId) {
                                        subscriptions.set(userId, {
                                                      subscribed: false,
                                                      expiresAt: 0,
                                                    });
                                      }
                          }
                  break;
                }
        }

    return NextResponse.json({ received: true });
  }
