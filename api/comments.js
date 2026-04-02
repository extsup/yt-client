// api/comments.js
// Ambil komentar video YouTube
// Usage: /api/comments?id=VIDEO_ID&limit=20

const INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const INNERTUBE_CLIENT_VERSION = "2.20231121.05.00";

async function getComments(videoId, limit = 20) {
  // Step 1: Ambil continuation token dari halaman video
  const nextUrl = `https://www.youtube.com/youtubei/v1/next?key=${INNERTUBE_API_KEY}`;

  const body = {
    videoId,
    context: {
      client: {
        clientName: "WEB",
        clientVersion: INNERTUBE_CLIENT_VERSION,
        hl: "id",
        gl: "ID",
      },
    },
  };

  const nextRes = await fetch(nextUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!nextRes.ok) throw new Error(`Innertube error: ${nextRes.status}`);
  const nextData = await nextRes.json();

  // Cari continuation token untuk comments
  const engagementPanels = nextData?.engagementPanels || [];
  let continuationToken = null;

  for (const panel of engagementPanels) {
    const header = panel?.engagementPanelSectionListRenderer?.header
      ?.engagementPanelTitleHeaderRenderer?.title?.runs?.[0]?.text;
    if (header?.toLowerCase().includes("comment")) {
      const contents =
        panel?.engagementPanelSectionListRenderer?.content
          ?.sectionListRenderer?.contents || [];
      continuationToken =
        contents?.[0]?.itemSectionRenderer?.contents?.[0]
          ?.continuationItemRenderer?.continuationEndpoint?.continuationCommand
          ?.token;
      break;
    }
  }

  if (!continuationToken) {
    // Coba cara lain
    const contents =
      nextData?.contents?.twoColumnWatchNextResults?.results?.results
        ?.contents || [];
    for (const c of contents) {
      const token =
        c?.itemSectionRenderer?.contents?.[0]?.continuationItemRenderer
          ?.continuationEndpoint?.continuationCommand?.token;
      if (token) {
        continuationToken = token;
        break;
      }
    }
  }

  if (!continuationToken) throw new Error("Tidak bisa mengambil komentar");

  // Step 2: Ambil komentar dengan continuation token
  const browseUrl = `https://www.youtube.com/youtubei/v1/next?key=${INNERTUBE_API_KEY}`;

  const commentsRes = await fetch(browseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      continuation: continuationToken,
      context: body.context,
    }),
  });

  if (!commentsRes.ok) throw new Error(`Komentar error: ${commentsRes.status}`);
  const commentsData = await commentsRes.json();

  const items =
    commentsData?.onResponseReceivedEndpoints?.[1]
      ?.reloadContinuationItemsCommand?.continuationItems ||
    commentsData?.onResponseReceivedEndpoints?.[0]
      ?.reloadContinuationItemsCommand?.continuationItems ||
    [];

  const comments = [];

  for (const item of items) {
    if (comments.length >= limit) break;
    const cr = item?.commentThreadRenderer?.comment?.commentRenderer;
    if (!cr) continue;

    comments.push({
      commentId: cr.commentId,
      author: cr.authorText?.simpleText || "",
      authorChannelId:
        cr.authorEndpoint?.browseEndpoint?.browseId || "",
      avatar: cr.authorThumbnail?.thumbnails?.[0]?.url || "",
      text: cr.contentText?.runs?.map((r) => r.text).join("") || "",
      likes: cr.voteCount?.simpleText || "0",
      published: cr.publishedTimeText?.runs?.[0]?.text || "",
      isAuthorOwner: !!cr.authorIsChannelOwner,
      replyCount: item?.commentThreadRenderer?.replyCount || 0,
    });
  }

  return comments;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id, limit = "20" } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Parameter ?id= wajib diisi" });
  }

  try {
    const comments = await getComments(id, parseInt(limit));
    return res.status(200).json({
      videoId: id,
      total: comments.length,
      comments,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
