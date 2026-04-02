// api/video.js
// Ambil info detail video YouTube
// Usage: /api/video?id=VIDEO_ID

import ytdl from "ytdl-core";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id, url } = req.query;

  const videoId = id || (url ? ytdl.getVideoID(url) : null);

  if (!videoId) {
    return res.status(400).json({ error: "Parameter ?id= atau ?url= wajib diisi" });
  }

  try {
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
    const details = info.videoDetails;

    // Format formats yang tersedia
    const formats = info.formats
      .filter((f) => f.hasVideo && f.hasAudio)
      .map((f) => ({
        itag: f.itag,
        quality: f.qualityLabel,
        container: f.container,
        codecs: f.codecs,
        bitrate: f.bitrate,
        url: f.url,
      }));

    const audioFormats = info.formats
      .filter((f) => !f.hasVideo && f.hasAudio)
      .map((f) => ({
        itag: f.itag,
        audioBitrate: f.audioBitrate,
        container: f.container,
        url: f.url,
      }));

    return res.status(200).json({
      videoId: details.videoId,
      title: details.title,
      description: details.description?.slice(0, 500) + (details.description?.length > 500 ? "..." : ""),
      author: details.author?.name,
      channelId: details.author?.id,
      channelUrl: details.author?.channel_url,
      duration: details.lengthSeconds,
      durationFormatted: formatDuration(details.lengthSeconds),
      viewCount: details.viewCount,
      likes: details.likes,
      thumbnail: details.thumbnails?.at(-1)?.url,
      isLive: details.isLiveContent,
      uploadDate: details.uploadDate,
      keywords: details.keywords?.slice(0, 10),
      category: details.category,
      formats,
      audioFormats,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function formatDuration(seconds) {
  const s = parseInt(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
