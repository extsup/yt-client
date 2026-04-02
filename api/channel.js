// api/channel.js
// Ambil info channel dan daftar video terbaru
// Usage: /api/channel?id=CHANNEL_ID  atau  /api/channel?handle=@channelhandle

const INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const INNERTUBE_CLIENT_VERSION = "2.20231121.05.00";

async function getChannel(browseId) {
  const url = `https://www.youtube.com/youtubei/v1/browse?key=${INNERTUBE_API_KEY}`;

  // Ambil info channel
  const body = {
    browseId,
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

  const header = data?.header?.c4TabbedHeaderRenderer;
  const channelInfo = {
    channelId: browseId,
    name: header?.title || "",
    handle: header?.channelHandleText?.runs?.[0]?.text || "",
    subscribers: header?.subscriberCountText?.simpleText || "",
    avatar: header?.avatar?.thumbnails?.at(-1)?.url || "",
    banner: header?.banner?.thumbnails?.at(-1)?.url || "",
    verified: !!header?.badges?.find(
      (b) => b?.metadataBadgeRenderer?.style?.includes("VERIFIED")
    ),
  };

  // Ambil video terbaru dari tab Videos
  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  const videosTab = tabs.find((t) =>
    t?.tabRenderer?.title?.toLowerCase().includes("video")
  );

  const gridItems =
    videosTab?.tabRenderer?.content?.richGridRenderer?.contents || [];

  const videos = [];
  for (const item of gridItems) {
    const vr = item?.richItemRenderer?.content?.videoRenderer;
    if (!vr) continue;

    const videoId = vr.videoId;
    videos.push({
      videoId,
      title: vr.title?.runs?.[0]?.text || "",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: vr.lengthText?.simpleText || "",
      views: vr.viewCountText?.simpleText || "",
      published: vr.publishedTimeText?.simpleText || "",
    });
  }

  return { ...channelInfo, videos };
}

async function resolveHandle(handle) {
  // Resolve @handle ke channelId via halaman web
  const cleanHandle = handle.startsWith("@") ? handle : `@${handle}`;
  const res = await fetch(`https://www.youtube.com/${cleanHandle}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const html = await res.text();
  const match = html.match(/"channelId":"(UC[^"]+)"/);
  if (!match) throw new Error("Channel tidak ditemukan");
  return match[1];
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  let { id, handle } = req.query;

  try {
    if (!id && handle) {
      id = await resolveHandle(handle);
    }

    if (!id) {
      return res.status(400).json({ error: "Parameter ?id= atau ?handle= wajib diisi" });
    }

    const result = await getChannel(id);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
