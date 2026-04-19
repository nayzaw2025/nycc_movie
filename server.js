import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const ALLOWED_DOMAINS = new Set([
  "www.homietv.com",
  "homietv.com",
  "www.ysflix.com",
  "ysflix.com",
]);

app.get("/api", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: "Missing url parameter" });
  try {
    const targetHost = new URL(targetUrl).hostname;
    const isAllowed = Array.from(ALLOWED_DOMAINS).some(
      (domain) => targetHost === domain || targetHost.endsWith("." + domain)
    );
    if (!isAllowed)
      return res.status(403).json({ error: "Domain not allowed: " + targetHost });
  } catch (e) {
    return res.status(400).json({ error: "Invalid URL" });
  }
  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!response.ok) {
      let text;
      try { text = await response.text(); } catch {}
      return res.status(response.status).json({
        error: `API returned status ${response.status}`,
        details: text,
      });
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      let text;
      try { text = await response.text(); } catch {}
      return res.status(502).json({ error: "Upstream did not return JSON", details: text });
    }
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch",
      details: error.message,
    });
  }
});

export default app;
