# 🎬 YouTube Scraper API — Vercel

API scraping YouTube menggunakan **Innertube API** (internal YouTube API) dan `ytdl-core`. Tidak perlu API key YouTube!

## Endpoints

### 🔍 Search
```
GET /api/search?q=keyword&limit=10
```
| Param | Wajib | Default | Keterangan |
|-------|-------|---------|------------|
| `q` | ✅ | — | Kata kunci pencarian |
| `limit` | ❌ | 10 | Jumlah hasil |

---

### 📹 Info Video
```
GET /api/video?id=VIDEO_ID
GET /api/video?url=https://youtu.be/VIDEO_ID
```
Mengembalikan detail video + semua format download (video+audio dan audio saja).

---

### 🔥 Trending
```
GET /api/trending?region=ID&limit=20
```
| Param | Default | Keterangan |
|-------|---------|------------|
| `region` | `ID` | Kode negara (ID, US, JP, dll) |
| `limit` | 20 | Jumlah video |

---

### 👤 Channel
```
GET /api/channel?id=UCxxxxxxxx
GET /api/channel?handle=@channelname
```
Mengembalikan info channel + daftar video terbaru.

---

### 💬 Komentar
```
GET /api/comments?id=VIDEO_ID&limit=20
```

---

## Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Install dependencies
npm install

# Deploy
vercel --prod
```

## Contoh Response Search

```json
{
  "query": "tutorial javascript",
  "total": 10,
  "results": [
    {
      "videoId": "abc123",
      "title": "Belajar JavaScript untuk Pemula",
      "url": "https://www.youtube.com/watch?v=abc123",
      "thumbnail": "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
      "channel": "CodeChannel",
      "duration": "15:32",
      "views": "1.2 juta tayangan",
      "published": "2 bulan yang lalu"
    }
  ]
}
```

## Catatan

- Innertube API adalah internal API YouTube — bisa berubah sewaktu-waktu
- Tidak cocok untuk scraping massal (rate limit)
- `ytdl-core` mungkin perlu update berkala karena YouTube sering berubah
- Untuk production berat, pertimbangkan caching dengan Vercel KV atau Redis
