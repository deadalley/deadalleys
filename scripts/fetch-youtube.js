#!/usr/bin/env node

/**
 * Fetch YouTube video metadata and generate data file for Hugo
 * Requires: YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID environment variables
 *
 * Usage:
 *   YOUTUBE_API_KEY="your-key" YOUTUBE_CHANNEL_ID="your-channel-id" node scripts/fetch-youtube.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const DATA_DIR = path.join(__dirname, "../data");
const OUTPUT_FILE = path.join(DATA_DIR, "youtube.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Validate required environment variables
if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
  console.error(
    "⚠️  YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID environment variables are required",
  );
  console.error("");
  console.error("Usage:");
  console.error(
    '  YOUTUBE_API_KEY="your-api-key" YOUTUBE_CHANNEL_ID="your-channel-id" node scripts/fetch-youtube.js',
  );
  console.error("");
  console.error("Skipping YouTube data fetch. Using empty data file instead.");

  // Create a default empty file so Hugo doesn't fail
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ videos: [] }, null, 2));
  process.exit(0);
}

/**
 * Make HTTPS request to YouTube API
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * Fetch upload playlist ID from channel
 */
async function getUploadPlaylistId() {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`;
  const response = await makeRequest(url);

  if (!response.items || response.items.length === 0) {
    throw new Error("Channel not found");
  }

  return response.items[0].contentDetails.relatedPlaylists.uploads;
}

/**
 * Fetch videos from upload playlist
 */
async function fetchVideos(playlistId, pageToken = null, allVideos = []) {
  let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&key=${YOUTUBE_API_KEY}`;

  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }

  const response = await makeRequest(url);
  const videos = [...allVideos, ...response.items];

  // Paginate through all videos (max 50 at a time)
  // Limit to 100 videos total for reasonable API usage
  if (response.nextPageToken && videos.length < 100) {
    return fetchVideos(playlistId, response.nextPageToken, videos);
  }

  return { items: videos.slice(0, 100), pageInfo: response.pageInfo };
}

/**
 * Fetch video statuses to filter for published videos
 */
async function getVideoStatuses(videoIds) {
  if (videoIds.length === 0) return {};

  // YouTube API limits to 50 videos per request
  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  const statuses = {};

  for (const chunk of chunks) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=status&id=${chunk.join(",")}&key=${YOUTUBE_API_KEY}`;
    const response = await makeRequest(url);

    if (response.items) {
      response.items.forEach((item) => {
        statuses[item.id] = item.status;
      });
    }
  }

  return statuses;
}

/**
 * Transform YouTube video data into our format
 */
function transformVideos(items) {
  return items.map((item) => {
    const snippet = item.snippet;
    return {
      id: item.contentDetails.videoId,
      title: snippet.title,
      description: snippet.description,
      thumbnail: snippet.thumbnails.high.url,
      publishedAt: snippet.publishedAt,
      publishedDate: new Date(snippet.publishedAt).toISOString().split("T")[0],
      url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${item.contentDetails.videoId}`,
      channelTitle: snippet.channelTitle,
    };
  });
}

/**
 * Main function
 */
async function main() {
  try {
    console.log("🎥 Fetching YouTube video metadata...");

    // Get the uploads playlist ID
    console.log("📋 Getting channel uploads playlist...");
    const playlistId = await getUploadPlaylistId();
    console.log(`✓ Found uploads playlist: ${playlistId}`);

    // Fetch videos
    console.log("📹 Fetching video metadata...");
    const response = await fetchVideos(playlistId);

    // Get video statuses to filter for published videos only
    console.log("🔍 Checking video publication status...");
    const videoIds = response.items.map((item) => item.contentDetails.videoId);
    const statuses = await getVideoStatuses(videoIds);

    // Filter to only include published (public) videos
    const publishedItems = response.items.filter((item) => {
      const status = statuses[item.contentDetails.videoId];
      return status && status.privacyStatus === "public";
    });

    const videos = transformVideos(publishedItems);

    console.log(
      `✓ Fetched ${videos.length} published videos (${response.items.length} total)`,
    );

    // Save to data file
    const data = {
      videos: videos,
      lastUpdated: new Date().toISOString(),
      totalResults: response.pageInfo.totalResults,
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log(`✓ Saved to ${OUTPUT_FILE}`);

    console.log("✅ YouTube metadata fetch complete!");
  } catch (error) {
    console.error("❌ Error fetching YouTube data:", error.message);
    process.exit(1);
  }
}

main();
