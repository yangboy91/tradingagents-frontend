import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
  });

  export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
            if (!userId) {
                  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
                      }

                          const { plan } = await req.json();

                              const priceId =
                                    plan === "yearly"
                                            ? process.env.STRIPE_YEARLY_PRICE_ID!
                                                    : process.env.STRIPE_MONTHLY_PRICE_ID!;

                                                        const session = await stripe.checkout.sessions.create({
                                                              mode: "subscription",
                                                                    payment_method_types: ["card"],
                                                                          line_items: [
                                                                                    {
                                                                                              price: priceId,
                                                                                                        quantity: 1,
                                                                                                                },
],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
                  metadata: {
                          userId,
                                },
                                      subscription_data: {
                                              metadata: {
                                                        userId,
                                                                },
                                                                      },
                                                                          });

                                                                              return NextResponse.json({ url: session.url });
                                                                                } catch (error) {
                                                                                    console.error("Stripe checkout error:", error);
                                                                                        return NextResponse.json(
                                                                                              { error: "Failed to create checkout session" },
                                                                                                    { status: 500 }
                                                                                                        );
                                                                                                          }
                                                                                                          }
