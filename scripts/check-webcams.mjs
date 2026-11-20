#!/usr/bin/env node
/**
 * 每日自動巡檢 src/data/webcams.json 中所有 YouTube 鏡頭君之可嵌入狀態，
 * 透過免 API Key 的 YouTube oEmbed 端點檢查並輸出至 public/health.json。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const webcamsPath = path.join(rootDir, 'src', 'data', 'webcams.json');
const outputPath = path.join(rootDir, 'public', 'health.json');

const CONCURRENCY = 6;
const TIMEOUT_MS = 10000;

async function checkSingleWebcam(cam) {
  const videoId = cam?.stream?.videoId;
  if (!videoId) {
    return [cam.id, { ok: false, statusCode: 0, checkedAt: new Date().toISOString() }];
  }

  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`
  )}&format=json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'taiwan-web-cam-health-check/2.0' }
    });
    if (res.ok) {
      const data = await res.json();
      return [
        cam.id,
        {
          ok: true,
          statusCode: res.status,
          title: typeof data?.title === 'string' ? data.title.slice(0, 80) : undefined,
          checkedAt: new Date().toISOString()
        }
      ];
    }
    return [
      cam.id,
      {
        ok: false,
        statusCode: res.status,
        checkedAt: new Date().toISOString()
      }
    ];
  } catch {
    // 網路逾時或暫時性錯誤不誤判離線，標記 ok: true 交由前端實際播放器判斷
    return [
      cam.id,
      {
        ok: true,
        statusCode: 0,
        checkedAt: new Date().toISOString()
      }
    ];
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const raw = await fs.readFile(webcamsPath, 'utf-8');
  const webcams = JSON.parse(raw);

  const statusById = {};
  let index = 0;

  async function worker() {
    while (index < webcams.length) {
      const current = webcams[index++];
      const [id, entry] = await checkSingleWebcam(current);
      statusById[id] = entry;
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const entries = Object.values(statusById);
  const online = entries.filter((e) => e.ok).length;
  const offline = entries.length - online;

  const manifest = {
    checkedAt: new Date().toISOString(),
    summary: {
      total: webcams.length,
      online,
      offline
    },
    statusById
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
  console.log(`Health check complete: ${online}/${webcams.length} online, ${offline} offline.`);
}

main().catch((err) => {
  console.error('Health check failed:', err);
  process.exit(1);
});
