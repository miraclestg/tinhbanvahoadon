import { useCallback, useEffect, useRef, useState } from 'react';
import { ImageIcon, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useI18n } from '@/lib/i18n';
import { loadImage } from '@/lib/image';

const OUT_W = 1000; // chiều rộng ảnh lưu lại, chiều cao theo đúng tỉ lệ khung (16:9)
const MAX_ZOOM = 4;

interface Props {
  src: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (dataUrl: string) => void;
  onPickOther: () => void;
}

interface Pt {
  x: number;
  y: number;
}

/** Căn chỉnh ảnh nền: kéo để di chuyển, thanh trượt / chụm hai ngón để phóng to. Khung trùng với khung hiển thị thật. */
export function BgCropper({ src, open, onOpenChange, onDone, onPickOther }: Props) {
  const { t } = useI18n();
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const [fs, setFs] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState<Pt>({ x: 0, y: 0 });
  const pts = useRef(new Map<number, Pt>());
  const pinch = useRef<{ d: number; zoom: number } | null>(null);

  // tải ảnh khi mở / đổi nguồn
  useEffect(() => {
    let cancelled = false;
    setImg(null);
    if (open && src) loadImage(src).then((i) => !cancelled && setImg(i)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [src, open]);

  // đo khung
  useEffect(() => {
    if (!frame) return;
    const measure = () => setFs({ w: frame.clientWidth, h: frame.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    return () => ro.disconnect();
  }, [frame]);

  const base = img && fs.w ? Math.max(fs.w / img.naturalWidth, fs.h / img.naturalHeight) : 1;
  const scale = base * zoom;

  const clampOff = useCallback(
    (o: Pt, s: number): Pt => {
      if (!img) return o;
      const W = img.naturalWidth * s;
      const H = img.naturalHeight * s;
      return { x: Math.min(0, Math.max(fs.w - W, o.x)), y: Math.min(0, Math.max(fs.h - H, o.y)) };
    },
    [img, fs.w, fs.h]
  );

  const reset = useCallback(() => {
    if (!img || !fs.w) return;
    const s = Math.max(fs.w / img.naturalWidth, fs.h / img.naturalHeight);
    setZoom(1);
    setOff({ x: (fs.w - img.naturalWidth * s) / 2, y: (fs.h - img.naturalHeight * s) / 2 });
  }, [img, fs.w, fs.h]);

  // đặt ảnh vào giữa khi ảnh / khung sẵn sàng
  useEffect(reset, [reset]);

  function changeZoom(nz: number) {
    if (!img) return;
    const z = Math.min(MAX_ZOOM, Math.max(1, nz));
    const cx = (fs.w / 2 - off.x) / scale;
    const cy = (fs.h / 2 - off.y) / scale;
    const ns = base * z;
    setZoom(z);
    setOff(clampOff({ x: fs.w / 2 - cx * ns, y: fs.h / 2 - cy * ns }, ns));
  }

  function onPointerDown(e: React.PointerEvent) {
    frame?.setPointerCapture(e.pointerId);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.current.size === 2) {
      const [a, b] = [...pts.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const prev = pts.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pts.current.set(e.pointerId, cur);
    if (pts.current.size === 2 && pinch.current) {
      const [a, b] = [...pts.current.values()];
      changeZoom((pinch.current.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.current.d);
    } else if (pts.current.size === 1) {
      setOff((o) => clampOff({ x: o.x + cur.x - prev.x, y: o.y + cur.y - prev.y }, scale));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pts.current.delete(e.pointerId);
    pinch.current = null;
  }

  function apply() {
    if (!img || !fs.w) return;
    const outH = Math.round((OUT_W * fs.h) / fs.w);
    const c = document.createElement('canvas');
    c.width = OUT_W;
    c.height = outH;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, -off.x / scale, -off.y / scale, fs.w / scale, fs.h / scale, 0, 0, OUT_W, outH);
    onDone(c.toDataURL('image/jpeg', 0.78));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('adjustBg')}</DialogTitle>
          <DialogDescription>{t('dragHint')}</DialogDescription>
        </DialogHeader>

        <div
          ref={setFrame}
          className="relative aspect-video w-full cursor-grab touch-none select-none overflow-hidden rounded-2xl bg-muted active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {img && (
            <img
              src={img.src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 max-w-none"
              style={{
                width: img.naturalWidth * scale,
                height: img.naturalHeight * scale,
                transform: `translate(${off.x}px, ${off.y}px)`,
              }}
            />
          )}
          {/* lưới 1/3 giúp canh bố cục */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/40 [background-image:linear-gradient(to_right,transparent_33%,rgba(255,255,255,.35)_33%,rgba(255,255,255,.35)_calc(33%+1px),transparent_calc(33%+1px),transparent_66%,rgba(255,255,255,.35)_66%,rgba(255,255,255,.35)_calc(66%+1px),transparent_calc(66%+1px)),linear-gradient(to_bottom,transparent_33%,rgba(255,255,255,.35)_33%,rgba(255,255,255,.35)_calc(33%+1px),transparent_calc(33%+1px),transparent_66%,rgba(255,255,255,.35)_66%,rgba(255,255,255,.35)_calc(66%+1px),transparent_calc(66%+1px))]" />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomOut className="size-5 text-muted-foreground" />
          <Slider
            aria-label={t('zoom')}
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={[zoom]}
            onValueChange={([v]) => changeZoom(v)}
          />
          <ZoomIn className="size-5 text-muted-foreground" />
        </div>

        <DialogFooter className="flex-wrap justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onPickOther}>
              <ImageIcon /> {t('pickImage')}
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw /> {t('resetFrame')}
            </Button>
          </div>
          <Button onClick={apply} disabled={!img}>
            {t('apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
