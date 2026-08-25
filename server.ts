import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // AI Assistant Endpoint using Gemini API server-side
  app.post("/api/ai/assistant", async (req, res) => {
    try {
      const { prompt, mode, contextItem, buyerQuestionType } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(503).json({
          error: "GEMINI_API_KEY is not configured on the server",
          fallbackAvailable: true
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let systemInstruction = `You are the Part-Smart-ZA automotive and heavy machinery assistant specialized in the South African spares and scrap yard marketplace.
You provide professional, practical, and context-rich answers in South African context (ZAR pricing, Courier Guy / The Freight Company shipping, SA provinces, engine/transmission fitment, VIN verification).`;

      if (buyerQuestionType === 'shipping_costs') {
        systemInstruction += `\nFocus specifically on South African freight, courier logistics, crating for heavy parts (engines/gearboxes), collection terms, and estimated delivery transit times between major hubs (Johannesburg, Cape Town, Durban, Port Elizabeth, Bloemfontein, Polokwane).`;
      } else if (buyerQuestionType === 'stock_availability') {
        systemInstruction += `\nFocus specifically on scrap yard inventory status, yard verification protocols, testing condition, serial number verification, holding periods, and WhatsApp photo confirmation.`;
      }

      let contents = prompt;
      if (contextItem) {
        contents = `Context Part Details:\n- Title: ${contextItem.title}\n- Category: ${contextItem.category}\n- Make/Model: ${contextItem.make} ${contextItem.model || ''}\n- Price: R${contextItem.priceZar}\n- City/Province: ${contextItem.city}, ${contextItem.province}\n- Part Number: ${contextItem.partNumber || 'N/A'}\n- Condition: ${contextItem.condition}\n\nRequest:\n${prompt}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents,
        config: {
          systemInstruction,
        }
      });

      res.json({
        text: response.text || "No response generated.",
        success: true
      });
    } catch (error: any) {
      console.error("Gemini API Error in /api/ai/assistant:", error);
      res.status(500).json({
        error: error.message || "Failed to generate AI response",
        success: false
      });
    }
  });

  // API Health Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Search Engine Robots.txt
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(
      `User-agent: *\nAllow: /\nSitemap: https://partsmart.co.za/sitemap.xml\n`
    );
  });

  // Dynamic XML Sitemap for Search Engines
  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://partsmart.co.za/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://partsmart.co.za/heavy-equipment</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://partsmart.co.za/trucks</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://partsmart.co.za/cars</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://partsmart.co.za/sellers</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
    res.send(sitemap);
  });

  // Example API endpoint for general server status / config
  app.get("/api/info", (req, res) => {
    res.json({
      name: "Part-Smart-ZA API Server",
      environment: process.env.NODE_ENV || "development",
      features: ["search_engine", "sitemap", "robots_txt", "seo_schema"],
    });
  });

  // Vite middleware in development vs static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Part-Smart-ZA Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
