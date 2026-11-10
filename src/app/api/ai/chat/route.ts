import { NextResponse } from "next/server";
import { addHistory, getProducts } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { chatWithGemini, isGeminiConfigured } from "@/lib/gemini";
import { answerChat } from "@/lib/recommend";

interface Body {
  message?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "Please type a question." }, { status: 400 });
  if (message.length > 600) {
    return NextResponse.json({ error: "Please keep questions under 600 characters." }, { status: 400 });
  }

  const products = getProducts();
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
  const user = await getSessionUser();

  let reply: { message: string; productIds: string[] };
  let source: "gemini" | "fallback" = "fallback";

  const aiReply = isGeminiConfigured() ? await chatWithGemini(message, products, history) : null;
  if (aiReply) {
    reply = aiReply;
    source = "gemini";
  } else {
    reply = answerChat(message, products);
  }

  if (user) {
    addHistory({ userId: user.id, kind: "chat", prompt: message.slice(0, 200), source });
  }

  return NextResponse.json({
    message: reply.message,
    productIds: reply.productIds,
    source,
    configured: isGeminiConfigured(),
  });
}
