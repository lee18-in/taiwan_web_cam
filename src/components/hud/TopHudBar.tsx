import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  History,
  Monitor,
  Pin,
  Radio,
  Search,
  Share2,
  X,
  Zap
} from 'lucide-react';
import { buildShareUrl } from '../../core/urlSync';
import { useWarRoomStore } from '../../store/useWarRoomStore';
import type { PresetFilter, Webcam } from '../../types/webcam';

interface TopHudBarProps {
  webcams: Webcam[];
  isMobile: boolean;
  activeCount: number;
}

const FILTER_CHIPS: { id: PresetFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'coast', label: '🌊 沿海' },
  { id: 'mountain', label: '🏔️ 山區' },
  { id: 'reservoir', label: '💧 水庫' },
  { id: 'traffic', label: '🌧️ 路況' },
  { id: 'island', label: '🏝️ 離島' },
  { id: 'pinned', label: '📌 釘選' }
];

function useTaipeiClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);
}

export function TopHudBar({ webcams, isMobile, activeCount }: TopHudBarProps) {
  const clock = useTaipeiClock();
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const center = useWarRoomStore((s) => s.center);
  const zoom = useWarRoomStore((s) => s.zoom);
  const basemap = useWarRoomStore((s) => s.basemap);
  const activeLayer = useWarRoomStore((s) => s.activeLayer);
  const windEnabled = useWarRoomStore((s) => s.windEnabled);
  const maxTiles = useWarRoomStore((s) => s.maxTiles);
  const fullLiveMode = useWarRoomStore((s) => s.fullLiveMode);
  const presetFilter = useWarRoomStore((s) => s.presetFilter);
  const searchQuery = useWarRoomStore((s) => s.searchQuery);
  const pinnedIds = useWarRoomStore((s) => s.pinnedIds);
  const kioskMode = useWarRoomStore((s) => s.kioskMode);
  const wallsCollapsed = useWarRoomStore((s) => s.wallsCollapsed);

  const setMaxTiles = useWarRoomStore((s) => s.setMaxTiles);
  const setFullLiveMode = useWarRoomStore((s) => s.setFullLiveMode);
  const setPresetFilter = useWarRoomStore((s) => s.setPresetFilter);
  const setSearchQuery = useWarRoomStore((s) => s.setSearchQuery);
  const setKioskMode = useWarRoomStore((s) => s.setKioskMode);
  const setWallsCollapsed = useWarRoomStore((s) => s.setWallsCollapsed);
  const requestFlyTo = useWarRoomStore((s) => s.requestFlyTo);
  const setFocusedCamId = useWarRoomStore((s) => s.setFocusedCamId);

  useEffect(() => {
    if (!kioskMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setKioskMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [kioskMode, setKioskMode]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return webcams
      .filter((c) => `${c.name} ${c.county} ${c.tags.join(' ')}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [webcams, searchQuery]);

  const handleShare = async () => {
    const shareUrl = buildShareUrl(window.location.href, {
      lat: center[0],
      lng: center[1],
      zoom,
      basemap,
      activeLayer,
      pinnedIds,
      presetFilter,
      windEnabled,
      maxTiles,
      kioskMode
    });
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('複製戰情視角分享網址：', shareUrl);
    }
  };

  if (kioskMode) {
    return (
      <div className="fixed top-3 left-1/2 z-[900] -translate-x-1/2 flex items-center gap-3 rounded-full border border-cyan-400/30 bg-slate-950/70 px-4 py-1.5 backdrop-blur-md opacity-35 transition hover:opacity-100">
        <span className="inline-flex items-center gap-1.5 font-mono-tech text-xs text-cyan-300">
          <Radio className="h-3.5 w-3.5 animate-pulse text-rose-400" />
          TAIWAN WAR ROOM · {clock} TPE
        </span>
        <button
          type="button"
          onClick={() => setKioskMode(false)}
          className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[11px] font-medium text-cyan-200 hover:bg-cyan-500/35 cursor-pointer"
        >
          離開壁掛 (ESC)
        </button>
      </div>
    );
  }

  const legacyHref = `${import.meta.env.BASE_URL}legacy.html`;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-2.5 z-[800] flex flex-col items-center gap-1.5 px-2.5 sm:px-4">
      <div
        className={`hud-glass pointer-events-auto flex max-w-full items-center gap-2 rounded-2xl px-3 py-1.5 ${
          isMobile ? 'w-full justify-between' : 'flex-wrap'
        }`}
      >
        {/* 品牌與台北即時戰情時鐘 */}
        <div className="flex min-w-0 items-center gap-2 pr-1">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-white truncate">
              <span>台灣風雨戰情室</span>
              <span className="hidden rounded bg-cyan-500/20 px-1.5 py-0.5 font-mono-tech text-[10px] text-cyan-300 md:inline">
                v2
              </span>
            </div>
            <div className="font-mono-tech text-[10px] text-slate-400 truncate">
              {clock} TPE · {activeCount}/{webcams.length} CAM
            </div>
          </div>
        </div>

        {/* 桌機版即時搜尋列 */}
        {!isMobile && (
          <div ref={searchWrapRef} className="relative w-44 flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋地名／縣市…"
              className="w-full rounded-lg border border-slate-700/70 bg-slate-900/80 py-1 pl-8 pr-6 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="清除搜尋"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {searchFocused && searchMatches.length > 0 && (
              <div className="hud-glass-strong absolute left-0 top-full mt-1.5 w-64 overflow-hidden rounded-xl py-1 z-[950]">
                {searchMatches.map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => {
                      requestFlyTo(cam.lat, cam.lng, 12);
                      setFocusedCamId(cam.id);
                      setSearchFocused(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-cyan-500/15 cursor-pointer"
                  >
                    <span className="truncate font-medium">{cam.name}</span>
                    <span className="shrink-0 text-[10px] text-slate-400">{cam.county}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 桌機版颱風／豪雨情境快捷篩選 */}
        {!isMobile && (
          <div className="hidden items-center gap-1 border-l border-slate-700/70 pl-2 lg:flex">
            {FILTER_CHIPS.map((chip) => {
              const active = presetFilter === chip.id;
              const label =
                chip.id === 'pinned' && pinnedIds.length > 0
                  ? `${chip.label}(${pinnedIds.length})`
                  : chip.label;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setPresetFilter(chip.id)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
                    active
                      ? 'bg-cyan-500/25 text-cyan-200 ring-1 ring-cyan-400/50'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* 右側控制按鈕群 */}
        <div
          className={`flex shrink-0 items-center gap-1 ${
            isMobile ? '' : 'border-l border-slate-700/70 pl-2'
          }`}
        >
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="搜尋鏡頭"
              className={`rounded-lg border p-1.5 transition cursor-pointer ${
                mobileSearchOpen || searchQuery
                  ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                  : 'border-slate-700/70 bg-slate-900/70 text-slate-200'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          )}

          {!isMobile && (
            <>
              <div
                className="flex items-center rounded-lg border border-slate-700/70 bg-slate-900/75 p-0.5 text-[11px]"
                title="同時顯示鏡頭格數"
              >
                {([4, 6, 8] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaxTiles(n)}
                    className={`rounded-md px-1.5 py-0.5 font-mono-tech transition cursor-pointer ${
                      maxTiles === n
                        ? 'bg-cyan-500/30 text-cyan-200 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {maxTiles > 4 && (
                <button
                  type="button"
                  onClick={() => setFullLiveMode(!fullLiveMode)}
                  title={
                    fullLiveMode
                      ? '目前全直播滿載（點擊切回省電：前4活體＋其餘點即播）'
                      : '目前省電模式（點擊切換全直播滿載）'
                  }
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition cursor-pointer ${
                    fullLiveMode
                      ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                      : 'border-slate-700/70 bg-slate-900/70 text-slate-300 hover:text-white'
                  }`}
                >
                  <Zap className="h-3 w-3" />
                  <span className="hidden xl:inline">{fullLiveMode ? '滿載' : '省電'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setWallsCollapsed(!wallsCollapsed)}
                title={wallsCollapsed ? '展開影片牆' : '收合影片牆（專心看大型地圖）'}
                className={`rounded-lg border p-1.5 transition cursor-pointer ${
                  wallsCollapsed
                    ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                    : 'border-slate-700/70 bg-slate-900/70 text-slate-300 hover:text-white'
                }`}
              >
                {wallsCollapsed ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setKioskMode(true)}
                title="Kiosk 壁掛指揮模式（隱藏工具列掛副螢幕）"
                className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-1.5 text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-200 cursor-pointer"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => void handleShare()}
            title="複製目前視角與配置連結"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700/70 bg-slate-900/70 px-2 py-1.5 text-[11px] text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-200 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline text-emerald-300">已複製</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">分享</span>
              </>
            )}
          </button>

          {isMobile && pinnedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setPresetFilter(presetFilter === 'pinned' ? 'all' : 'pinned')}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs cursor-pointer ${
                presetFilter === 'pinned'
                  ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                  : 'border-slate-700/70 bg-slate-900/70 text-amber-300'
              }`}
            >
              <Pin className="h-3.5 w-3.5" />
              {pinnedIds.length}
            </button>
          )}

          <a
            href={legacyHref}
            title="切換檢視原始單檔舊版 (Classic v1)"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-900/60 px-2 py-1.5 text-[11px] text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">舊版</span>
          </a>
        </div>
      </div>

      {/* 手機版展開搜尋列 */}
      {isMobile && mobileSearchOpen && (
        <div
          ref={searchWrapRef}
          className="hud-glass-strong pointer-events-auto relative w-full rounded-xl p-2"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="輸入台灣地名、縣市或景點搜尋…"
              className="w-full rounded-lg border border-slate-700/70 bg-slate-900/90 py-1.5 pl-8 pr-8 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {searchMatches.length > 0 && (
            <div className="mt-1.5 max-h-48 overflow-y-auto divide-y divide-slate-800/70">
              {searchMatches.map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => {
                    requestFlyTo(cam.lat, cam.lng, 12);
                    setFocusedCamId(cam.id);
                    setMobileSearchOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-2 py-2 text-left text-xs text-slate-200 active:bg-cyan-500/20"
                >
                  <span className="truncate font-medium">{cam.name}</span>
                  <span className="shrink-0 text-[10px] text-slate-400">{cam.county}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
