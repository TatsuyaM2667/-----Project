import { useMemo, useState } from 'react';
import { ArrowRight, Building2, Layers, MapPin, Play } from 'lucide-react';
import type { ScenarioKey } from './ai_bim_3d';
import { SAMPLE_FIELD_SITES, type PresetFieldSite } from './realSiteData';
import { TILE, blueprintForLand, latToPx, lngToPx } from './LandMapExplorer';
import { inferLandSubsurface, renderSubsurfaceSurveyCadSvg } from './SubsurfaceInferenceEngine';
import ThemeToggle from './ThemeToggle';

interface WelcomeProps {
  onStartWizard: (presetSiteId?: string) => void;
  onLaunchDemoTour: (presetKey?: ScenarioKey) => void;
}

const STEPS = [
  { icon: MapPin, title: '地図で土地を選ぶ', desc: '住所検索・現在地・地図のタップで敷地を指定します。' },
  { icon: Layers, title: '地下の埋設物を確認', desc: 'ガス管・上下水管・残置杭の推定位置と深さ、撤去費の目安を表示します。' },
  { icon: Building2, title: '建物プランを作る', desc: '埋設物を避けた3つのプランを比べ、図面と3Dで確認します。' }
];

const photoUrl = (z: number, x: number, y: number) =>
  `https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/${z}/${x}/${y}.jpg`;

// 指定地点を中心に w×h px を覆う航空写真タイルを並べる
function AerialPhoto({ lat, lng, zoom, w, h, className = '' }: { lat: number; lng: number; zoom: number; w: number; h: number; className?: string }) {
  const ox = lngToPx(lng, zoom) - w / 2;
  const oy = latToPx(lat, zoom) - h / 2;
  const tiles = [];
  for (let x = Math.floor(ox / TILE); x <= Math.floor((ox + w) / TILE); x++) {
    for (let y = Math.floor(oy / TILE); y <= Math.floor((oy + h) / TILE); y++) {
      tiles.push(
        <img
          key={`${x}-${y}`}
          src={photoUrl(zoom, x, y)}
          alt=""
          draggable={false}
          className="absolute max-w-none select-none"
          style={{ left: x * TILE - ox, top: y * TILE - oy, width: TILE, height: TILE }}
        />
      );
    }
  }
  return (
    <div className={`absolute left-1/2 top-1/2 ${className}`} style={{ width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2 }}>
      {tiles}
    </div>
  );
}

function useSiteDrawing(site: PresetFieldSite) {
  return useMemo(() => {
    const bp = blueprintForLand({ width: 10, depth: 9.5, prevType: site.prevType });
    const analysis = inferLandSubsurface(bp, site.prevType, site.roadDir, site.surrounding);
    return { analysis, svg: renderSubsurfaceSurveyCadSvg(bp, analysis, true) };
  }, [site]);
}

export default function Welcome({ onStartWizard, onLaunchDemoTour }: WelcomeProps) {
  const [active, setActive] = useState<PresetFieldSite>(SAMPLE_FIELD_SITES[0]);
  const { analysis, svg } = useSiteDrawing(active);

  return (
    <div className="min-h-dvh w-full bg-canvas text-slate-100 antialiased flex flex-col">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-md bg-cyan-400 text-on-accent grid place-items-center font-bold">S</span>
            <span className="font-semibold text-white">Stratum Geo-BIM</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* ヒーロー：選択中の事例地の航空写真を背景に、その土地で実際に作成される埋設図を並べる */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0" aria-hidden>
          <AerialPhoto key={active.id} lat={active.lat} lng={active.lng} zoom={17} w={2048} h={1024} className="animate-fade-in" />
          <div className="absolute inset-0 bg-canvas/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/90 to-canvas/30" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-canvas to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16 lg:pt-32 lg:pb-20 grid lg:grid-cols-[1fr_460px] gap-12 items-center">
          <div className="space-y-7">
            <p className="text-sm font-semibold text-cyan-300">地下埋設物の推定と建物計画</p>
            <h1 className="text-3xl sm:text-[40px] font-bold leading-tight text-white">
              土地を選んで、
              <br />
              地下と建物をまとめて検討する
            </h1>
            <p className="text-base text-slate-300 leading-relaxed max-w-xl">
              周囲の建物や前面道路、以前その土地に建っていた建物の記録から地中の埋設物を推定し、それを避けた建物プランと図面を作成します。
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onStartWizard()}
                className="h-12 px-6 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-on-accent font-semibold flex items-center gap-2 shadow-lg transition cursor-pointer"
              >
                <MapPin className="w-4.5 h-4.5" />
                地図から土地を選ぶ
              </button>
              <button
                onClick={() => onLaunchDemoTour('family_house_4ldk')}
                className="h-12 px-5 rounded-lg bg-surface/80 ring-1 ring-white/15 hover:bg-surface text-slate-100 font-medium flex items-center gap-2 transition cursor-pointer"
              >
                <Play className="w-4 h-4" />
                デモを見る
              </button>
            </div>
          </div>

          <figure className="rounded-xl bg-surface ring-1 ring-white/10 shadow-2xl overflow-hidden">
            <div className="bg-[#FAF9F5] p-3 [&>svg]:w-full [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
            <figcaption className="px-4 py-3 border-t border-white/10 flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <div className="font-medium text-white truncate">{active.label}</div>
                <div className="text-xs text-slate-400">この土地で自動作成した地下埋設図</div>
              </div>
              <div className="shrink-0 text-xs text-slate-400 text-right">
                配管 <strong className="text-white">{analysis.pipes.length}</strong> 系統
                <br />
                障害物 <strong className="text-white">{analysis.obstacles.length}</strong> 箇所
              </div>
            </figcaption>
          </figure>
        </div>
      </section>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-14 space-y-16">
        <section aria-labelledby="samples">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
            <div>
              <h2 id="samples" className="text-xl font-bold text-white">
                事例の土地から始める
              </h2>
              <p className="text-sm text-slate-400 mt-1">カードにカーソルを合わせると、上の図面がその土地のものに切り替わります。</p>
            </div>
            <button
              onClick={() => onStartWizard()}
              className="text-sm text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              住所で探す
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SAMPLE_FIELD_SITES.map((s) => (
              <button
                key={s.id}
                onClick={() => onStartWizard(s.id)}
                onMouseEnter={() => setActive(s)}
                onFocus={() => setActive(s)}
                className={`group text-left rounded-xl bg-surface ring-1 overflow-hidden transition cursor-pointer hover:shadow-xl ${
                  active.id === s.id ? 'ring-cyan-400' : 'ring-white/10 hover:ring-white/25'
                }`}
              >
                <div className="relative h-36 overflow-hidden bg-raised">
                  <AerialPhoto lat={s.lat} lng={s.lng} zoom={18} w={512} h={256} className="transition-transform duration-300 group-hover:scale-105" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full ring-2 ring-[#fff] shadow" aria-hidden />
                </div>
                <div className="p-4">
                  <div className="font-semibold text-white leading-snug">{s.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{s.badge}</div>
                  <div className="mt-3 text-sm text-cyan-300 flex items-center gap-1">
                    この土地を開く
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="howto">
          <h2 id="howto" className="text-xl font-bold text-white mb-5">
            使い方
          </h2>
          <ol className="grid md:grid-cols-3 gap-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-xl bg-surface ring-1 ring-white/10 p-5">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg bg-cyan-400/15 text-cyan-300 grid place-items-center">
                    <s.icon className="w-5 h-5" />
                  </span>
                  <span className="text-sm text-slate-400">ステップ {i + 1}</span>
                </div>
                <div className="font-semibold text-white mt-4">{s.title}</div>
                <div className="text-sm text-slate-400 mt-1 leading-relaxed">{s.desc}</div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 text-xs text-slate-500">
          航空写真：国土地理院 ／ 建物・道路：© OpenStreetMap contributors。埋設物の位置は推定であり、着工前に試掘・台帳での確認が必要です。
        </div>
      </footer>
    </div>
  );
}
