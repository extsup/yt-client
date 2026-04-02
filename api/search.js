// api/search.js
// Search YouTube menggunakan Innertube API (tanpa API key)
// Usage: /api/search?q=keyword&limit=10

const INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const INNERTUBE_CLIENT_VERSION = "2.20231121.05.00";

async function searchYouTube(query, limit = 10) {
  const url = `https://www.youtube.com/youtubei/v1/search?key=${INNERTUBE_API_KEY}`;

  const body = {
    query,
    context: {
      client: {
        clientName: "WEB",
        clientVersion: INNERTUBE_CLIENT_VERSION,
        hl: "id",
        gl: "ID",
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Innertube error: ${res.status}`);

  const data = await res.json();

  const contents =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

  const results = [];

  for (const item of contents) {
    if (results.length >= limit) break;

    const vr = item?.videoRenderer;
    if (!vr) continue;

    const videoId = vr.videoId;
    const title = vr.title?.runs?.[0]?.text || "";
    const channel =
      vr.ownerText?.runs?.[0]?.text ||
      vr.longBylineText?.runs?.[0]?.text ||
      "";
    const channelId =
      vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
      "";
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const duration = vr.lengthText?.simpleText || "";
    const views = vr.viewCountText?.simpleText || "";
    const published = vr.publishedTimeText?.simpleText || "";
    const description = vr.descriptionSnippet?.runs?.map((r) => r.text).join("") || "";

    results.push({
      videoId,
      title,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail,
      channel,
      channelId,
      channelUrl: channelId ? `https://www.youtube.com/channel/${channelId}` : "",
      duration,
      views,
      published,
      description,
    });
  }

  return results;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const { q, limit = "10" } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Parameter ?q= wajib diisi" });
  }

  try {
    const results = await searchYouTube(q, parseInt(limit));
    return res.status(200).json({
      query: q,
      total: results.length,
      results,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
