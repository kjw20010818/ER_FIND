// server.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const API_BASE = process.env.BSER_API_BASE;
const TOKEN = process.env.BSER_API_TOKEN ? process.env.BSER_API_TOKEN.trim() : "";

// 최신 시즌 ID
async function getLatestSeasonId() {
    const url = `${API_BASE}/v2/data/Season`;
    const res = await fetch(url, { headers: { "X-Api-Key": TOKEN } });
    const data = await res.json();
    if (!data || !Array.isArray(data.data)) return null;
    const current = data.data.find(s => s.isCurrent === 1);
    return current ? current.seasonID : null;
}

// Top 1000 API
app.get("/api/top1000", async (req, res) => {
    try {
        const seasonId = await getLatestSeasonId();
        if (!seasonId) return res.status(500).json({ error: "seasonID 없음" });

        const teamMode = req.query.mode || "3";       // 1: Solo, 2: Duo, 3: Squad
        const serverCode = req.query.server || "global";
        let url;

        if (serverCode === "global") {
            url = `${API_BASE}/v1/rank/top/${seasonId}/${teamMode}`;
        } else {
            url = `${API_BASE}/v1/rank/top/${seasonId}/${teamMode}/${serverCode}`;
        }

        console.log("Request:", url);

        const response = await fetch(url, { headers: { "X-Api-Key": TOKEN } });
        const data = await response.json();

        if (!data.topRanks) {
            return res.status(500).json({ error: "topRanks 없음", raw: data });
        }

        res.json(data.topRanks.slice(0, 1000)); // ✅ 최대 1000명
    } catch (err) {
        console.error("API Error:", err);
        res.status(500).json({ error: err.message });
    }
});



// 정적 파일
app.use(express.static("public"));

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
