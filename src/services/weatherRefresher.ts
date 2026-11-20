/**
 * 雙緩衝背景預載氣象圖資（附帶 no-referrer 防呆），載入完成才切換 URL 避免畫面閃白。
 */
export function preloadImageNoReferrer(url: string, timeoutMs = 12000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    let settled = false;

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(ok);
    };

    const timer = window.setTimeout(() => finish(false), timeoutMs);
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = url;
  });
}

export function withCacheBust(url: string, stamp: number): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}t=${stamp}`;
}
