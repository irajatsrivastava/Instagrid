import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to fetch instagram html
  app.post("/api/fetch-insta-html", async (req, res) => {
    const { url } = req.body;

    if (!url || !url.includes("instagram.com")) {
      return res.status(400).json({ success: false, error: "Invalid Instagram URL" });
    }

    try {
      const regex = /\/(?:p|reels|reel)\/([A-Za-z0-9_-]+)/;
      const match = url.match(regex);
      const shortcode = match ? match[1] : null;

      if (!shortcode) {
          return res.status(400).json({ success: false, error: "Could not extract shortcode from URL" });
      }

      const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
      let html = "";
      try {
        const response = await axios.get(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 10000
        });
        html = response.data;
      } catch (e: any) {
        console.error("Content fetch failed:", e.message);
      }

      return res.json({ success: true, html, shortcode });
    } catch (error: any) {
      console.error("Critical HTML fetch error:", error.message);
      return res.status(500).json({ success: false, error: "The extraction engine is currently busy." });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
