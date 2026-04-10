import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { subscriptions } from "@/app/api/stripe/webhook/route";

// In-memory usage store: userId -> number of free analyses used
// In production, use a real database
const usageStore = new Map<string, number>();

const FREE_ANALYSIS_LIMIT = 1;

export async function GET() {
    try {
          const { userId } = await auth();
          if (!userId) {
                  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
                }

          const usageCount = usageStore.get(userId) || 0;
          const subData = subscriptions.get(userId);
          const isSubscribed = subData?.subscribed && subData.expiresAt > Date.now();

          return NextResponse.json({
                  usageCount,
                  freeLimit: FREE_ANALYSIS_LIMIT,
                  isSubscribed,
                  canAnalyze: isSubscribed || usageCount < FREE_ANALYSIS_LIMIT,
                });
        } catch (error) {
          console.error("Usage GET error:", error);
          return NextResponse.json({ error: "Internal error" }, { status: 500 });
        }
  }

export async function POST(req: NextRequest) {
    try {
          const { userId } = await auth();
          if (!userId) {
                  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
                }

          const { action } = await req.json();

          if (action === "increment") {
                  const subData = subscriptions.get(userId);
                  const isSubscribed = subData?.subscribed && subData.expiresAt > Date.now();

                  if (!isSubscribed) {
                            const current = usageStore.get(userId) || 0;
                            if (current >= FREE_ANALYSIS_LIMIT) {
                                        return NextResponse.json(
                                                      { error: "Free limit reached", requiresUpgrade: true },
                                                      { status: 403 }
                                                    );
                                      }
                            usageStore.set(userId, current + 1);
                          }

                  return NextResponse.json({ success: true });
                }

          return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        } catch (error) {
          console.error("Usage POST error:", error);
          return NextResponse.json({ error: "Internal error" }, { status: 500 });
        }
  }
