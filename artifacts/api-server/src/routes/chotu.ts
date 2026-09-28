import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { customersTable, db, productsTable, salesTable } from "@workspace/db";
import { toNum } from "../lib/numeric";
import { requireShop } from "../lib/tenant";

const router: IRouter = Router();
const MAX_MESSAGE_LENGTH = 2_000;

/**
 * Helper to query Google Gemini API
 */
async function callGemini(apiKey: string, systemPrompt: string, userMessage: string, shopContext: any): Promise<string | null> {
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `${systemPrompt}\n\nদোকানের রিয়েল-টাইম ডাটা (SHOP DATA):\n${JSON.stringify(shopContext, null, 2)}\n\nব্যবহারকারীর প্রশ্ন (USER MESSAGE):\n"${userMessage}"\n\nউত্তর (সংক্ষিপ্ত ও বন্ধুসুলভ):`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 600,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API error:", response.status, errText.slice(0, 300));
    return null;
  }

  const data = (await response.json()) as any;
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return reply || null;
}

/**
 * Helper to query OpenAI Chat Completions API
 */
async function callOpenAI(apiKey: string, systemPrompt: string, userMessage: string, shopContext: any): Promise<string | null> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const url = "https://api.openai.com/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `SHOP DATA:\n${JSON.stringify(shopContext)}\n\nUSER MESSAGE:\n${userMessage}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("OpenAI API error:", response.status, errText.slice(0, 300));
    return null;
  }

  const data = (await response.json()) as any;
  const reply = data?.choices?.[0]?.message?.content?.trim();
  return reply || null;
}

/**
 * Server-side Chotu chat. Supports Google Gemini & OpenAI with rich contextual shop data.
 */
router.post("/chotu/chat", async (req, res): Promise<void> => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const language = req.body?.language === "en" ? "en" : "bn";

  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: "Please send a message under 2,000 characters." });
    return;
  }

  const { shopId } = requireShop(req);
  const [products, customers, sales] = await Promise.all([
    db.select().from(productsTable).where(eq(productsTable.shopId, shopId)),
    db.select().from(customersTable).where(eq(customersTable.shopId, shopId)),
    db.select().from(salesTable).where(eq(salesTable.shopId, shopId)),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaySales = sales.filter((sale) => sale.createdAt >= todayStart);

  // Pre-computed summaries
  const lowStockItems = products
    .filter((p) => {
      const stock = toNum(p.stock);
      const threshold = toNum(p.lowStockThreshold);
      return stock <= (threshold > 0 ? threshold : 5);
    })
    .sort((a, b) => toNum(a.stock) - toNum(b.stock))
    .slice(0, 20)
    .map((p) => ({ name: p.name, stock: toNum(p.stock), unit: p.unit }));

  const topDebtors = [...customers]
    .filter((c) => toNum(c.bakiBalance) > 0)
    .sort((a, b) => toNum(b.bakiBalance) - toNum(a.bakiBalance))
    .slice(0, 10)
    .map((c) => ({ name: c.name, due: toNum(c.bakiBalance) }));

  const productNames = products.slice(0, 30).map((p) => `${p.name} (স্টক: ${toNum(p.stock)})`);

  const shopContext = {
    generatedAt: new Date().toISOString(),
    totalProducts: products.length,
    totalCustomers: customers.length,
    todaySalesAmount: todaySales.reduce((sum, sale) => sum + toNum(sale.total), 0),
    todayTransactionCount: todaySales.length,
    totalDueAmount: customers.reduce((sum, c) => sum + toNum(c.bakiBalance), 0),
    customersWithDue: customers.filter((c) => toNum(c.bakiBalance) > 0).length,
    lowStockItems,
    topDebtors,
    sampleProducts: productNames,
  };

  const systemPrompt = language === "en"
    ? "You are Chotu (ছোটু), a warm, intelligent, and super-smart Bangladeshi retail shop AI assistant in 'Dokandar Mama'. You respond with high intelligence like ChatGPT or Google Gemini, while maintaining a friendly, helpful shop companion persona. Answer the user's questions clearly, concisely, and accurately based on the real-time SHOP DATA provided. If the user asks general, retail, business, or conversational questions, answer them smartly and warmly. Do not invent false sales numbers."
    : "তুমি ছোটু (Chotu), 'দোকানদার মামা' অ্যাপের একজন অত্যন্ত বুদ্ধিমান, বন্ধুসুলভ এবং নির্ভরযোগ্য এআই শপ অ্যাসিস্ট্যান্ট (ChatGPT / Google Gemini এর মতো দক্ষ)। তুমি স্বাভাবিক, মিষ্টি ও সম্মানজনক বাংলায় মামাদের সাথে কথা বলো। দোকানের রিয়েল-টাইম ডাটা (SHOP DATA) ব্যবহার করে স্টক, বিক্রি, বাকি, হিসাব বা ব্যবসার সঠিক তথ্য দাও। ব্যবহারকারী যেকোনো সাধারণ প্রশ্ন, ব্যবসার পরামর্শ বা হিসাব জানতে চাইলে বুদ্ধিমত্তার সাথে সংক্ষিপ্ত ও দারুণভাবে উত্তর দাও।";

  const geminiKey = process.env.GEMINI_API_KEY || process.env.Gemini_api || process.env.GEMINI_API || process.env.gemini_api_key || process.env.GOOGLE_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY || process.env.openai_api_key;

  let reply: string | null = null;

  // 1. Try Google Gemini first
  if (geminiKey) {
    reply = await callGemini(geminiKey, systemPrompt, message, shopContext);
  }

  // 2. Try OpenAI if Gemini not configured or failed
  if (!reply && openAiKey) {
    reply = await callOpenAI(openAiKey, systemPrompt, message, shopContext);
  }

  // 3. Smart local heuristic fallback if no AI key configured
  if (!reply) {
    const lower = message.toLowerCase();
    if (lower.includes("বিক্রি") || lower.includes("sales") || lower.includes("sell")) {
      reply = language === "en"
        ? `Today's sales: ৳${shopContext.todaySalesAmount} from ${shopContext.todayTransactionCount} orders. Total products in store: ${shopContext.totalProducts}.`
        : `মামা, আজকে মোট ${shopContext.todayTransactionCount} টি অর্ডারে ৳${shopContext.todaySalesAmount} টাকা বিক্রি হয়েছে! মোট পণ্য আছে ${shopContext.totalProducts} টি।`;
    } else if (lower.includes("বাকি") || lower.includes("due") || lower.includes("baki")) {
      reply = language === "en"
        ? `Total customer due: ৳${shopContext.totalDueAmount} across ${shopContext.customersWithDue} customers.`
        : `মামা, বর্তমানে ${shopContext.customersWithDue} জন কাস্টমারের কাছে মোট ৳${shopContext.totalDueAmount} টাকা বাকি আছে।`;
    } else if (lower.includes("স্টক") || lower.includes("stock") || lower.includes("কম")) {
      if (shopContext.lowStockItems.length > 0) {
        const list = shopContext.lowStockItems.slice(0, 3).map((i) => `${i.name} (${i.stock})`).join(", ");
        reply = language === "en"
          ? `${shopContext.lowStockItems.length} items low on stock: ${list}.`
          : `মামা, ${shopContext.lowStockItems.length} টি পণ্যের স্টক কম আছে: ${list}। তাড়াতাড়ি অর্ডার দিয়ে নিন!`;
      } else {
        reply = language === "en" ? "All product stocks are sufficient, boss!" : "মামা, সব পণ্যের স্টক একদম পর্যাপ্ত আছে!";
      }
    } else {
      reply = language === "en"
        ? `I am ready to help, boss! You have ${shopContext.totalProducts} products and ৳${shopContext.todaySalesAmount} in today's sales. Ask me anything about stock, sales, dues, or billing!`
        : `মামা, আমি ছোটু আছি আপনার সাথে! আজকে ৳${shopContext.todaySalesAmount} টাকা বিক্রি হয়েছে। স্টক, বাকি বা বিলিং সম্পর্কে যা জানতে চান বলুন!`;
    }
  }

  res.json({ reply, generatedAt: shopContext.generatedAt });
});

export default router;
