// api/trending.js
// Ambil video trending YouTube (default: Indonesia)
// Usage: /api/trending?region=ID&limit=20

const INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const INNERTUBE_CLIENT_VERSION = "2.20231121.05.00";

async function getTrending(region = "ID", limit = 20) {
  const url = `https://www.youtube.com/youtubei/v1/browse?key=${INNERTUBE_API_KEY}`;

  const body = {
    browseId: "FEtrending",
    context: {
      client: {
        clientName: "WEB",
        clientVersion: INNERTUBE_CLIENT_VERSION,
        hl: "id",
        gl: region,
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

  // Navigasi ke section trending
  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  const tab = tabs.find((t) => t?.tabRenderer?.selected) || tabs[0];
  const sections =
    tab?.tabRenderer?.content?.sectionListRenderer?.contents || [];

  const results = [];

  for (const section of sections) {
    if (results.length >= limit) break;
    const items =
      section?.itemSectionRenderer?.contents?.[0]?.shelfRenderer?.content
        ?.expandedShelfContentsRenderer?.items || [];

    for (const item of items) {
      if (results.length >= limit) break;
      const vr = item?.videoRenderer;
      if (!vr) continue;

      const videoId = vr.videoId;
      results.push({
        videoId,
        title: vr.title?.runs?.[0]?.text || "",
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        channel:
          vr.ownerText?.runs?.[0]?.text ||
          vr.longBylineText?.runs?.[0]?.text ||
          "",
        duration: vr.lengthText?.simpleText || "",
        views: vr.viewCountText?.simpleText || "",
        published: vr.publishedTimeText?.simpleText || "",
      });
    }
  }

  return results;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const { region = "ID", limit = "20" } = req.query;

  try {
    const results = await getTrending(region, parseInt(limit));
    return res.status(200).json({
      region,
      total: results.length,
      results,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
