"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const TOTAL_FRAMES = 240;

/* ── Runtime mobile detection (avoids SSR issues) ── */
function getMobileConfig() {
  if (typeof window === "undefined") return { isMobile: false, framePath: "/brain-frames-webp/frame_", frameStep: 1 };
  const mobile = window.innerWidth < 768;

  // Detect slow connections: 2G / slow-3G → halve frames further
  const conn = navigator?.connection;
  const slowNet = conn && (conn.effectiveType === "2g" || conn.saveData);

  return {
    isMobile: mobile,
    framePath: mobile
      ? "/brain-frames-webp-mobile/frame_"
      : "/brain-frames-webp/frame_",
    frameStep: slowNet ? 4 : mobile ? 2 : 1,
  };
}

function padNumber(num, size) {
  let s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

export default function CanvasSequence({ heroRef }) {
  const canvasRef          = useRef(null);
  const imagesRef          = useRef(new Array(TOTAL_FRAMES).fill(null));
  const loadedSetRef       = useRef(new Set());
  const currentFrame       = useRef(0);
  const rafPending         = useRef(false);
  const isReadyRef         = useRef(false);
  const configRef          = useRef(null);
  const totalActiveFrames  = useRef(TOTAL_FRAMES); // actual frames we'll load (less on mobile)
  const [loadProgress, setLoadProgress] = useState(0);

  /* ── Draw helpers ── */
  const drawImageOnCanvas = useCallback((canvas, img) => {
    const ctx = canvas.getContext("2d", { alpha: false });
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2× — no need for 3× on mobile
    const dW = window.innerWidth, dH = window.innerHeight;

    if (canvas.width !== dW * dpr || canvas.height !== dH * dpr) {
      canvas.width  = dW * dpr;
      canvas.height = dH * dpr;
      canvas.style.width  = dW + "px";
      canvas.style.height = dH + "px";
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const scale = Math.max(dW / img.naturalWidth, dH / img.naturalHeight);
    const x = (dW - img.naturalWidth  * scale) / 2;
    const y = (dH - img.naturalHeight * scale) / 2;
    ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
    ctx.restore();
  }, []);

  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let img = imagesRef.current[frameIndex];

    if (!img || !img.complete || !img.naturalWidth) {
      // fallback: nearest loaded frame
      let nearest = null, minDist = Infinity;
      for (const idx of loadedSetRef.current) {
        const d = Math.abs(idx - frameIndex);
        if (d < minDist) { minDist = d; nearest = idx; }
      }
      if (nearest !== null) img = imagesRef.current[nearest];
      if (!img || !img.complete || !img.naturalWidth) return;
    }

    drawImageOnCanvas(canvas, img);
  }, [drawImageOnCanvas]);

  /* ── Scroll handler — passive + single RAF per event ── */
  const onScroll = useCallback(() => {
    if (!heroRef.current || !isReadyRef.current || !configRef.current) return;
    if (rafPending.current) return;

    rafPending.current = true;
    requestAnimationFrame(() => {
      rafPending.current = false;

      const hero = heroRef.current;
      if (!hero) return;
      const scrollStart = hero.offsetTop;
      const scrollEnd   = scrollStart + hero.offsetHeight - window.innerHeight;
      const raw         = (window.scrollY - scrollStart) / (scrollEnd - scrollStart);
      const progress    = Math.min(Math.max(raw, 0), 1);

      const { frameStep } = configRef.current;
      let fi = Math.min(Math.floor(progress * (TOTAL_FRAMES - 1)), TOTAL_FRAMES - 1);
      fi = Math.floor(fi / frameStep) * frameStep;

      if (fi !== currentFrame.current) {
        currentFrame.current = fi;
        drawFrame(fi);
      }
    });
  }, [heroRef, drawFrame]);

  /* ── Image loading ── */
  const loadImage = useCallback((frameNum) => {
    return new Promise((resolve) => {
      const idx = frameNum - 1;
      if (imagesRef.current[idx] && loadedSetRef.current.has(idx)) { resolve(); return; }

      const config = configRef.current;
      if (!config) { resolve(); return; }

      const img = new Image();
      img.decoding = "async";
      img.src = `${config.framePath}${padNumber(frameNum, 4)}.webp`;
      img.onload = () => {
        imagesRef.current[idx] = img;
        loadedSetRef.current.add(idx);
        setLoadProgress(loadedSetRef.current.size);
        if (idx === 0 && !isReadyRef.current) {
          isReadyRef.current = true;
          drawFrame(0);
        }
        resolve();
      };
      img.onerror = () => resolve();
    });
  }, [drawFrame]);

  /* ── Progressive loading: 4-phase ── */
  const loadAllFrames = useCallback(async () => {
    const config = configRef.current;
    const { frameStep } = config;

    // Compute how many frames we'll actually load so the progress bar reaches 100%
    const activeCount = Math.ceil(TOTAL_FRAMES / frameStep);
    totalActiveFrames.current = activeCount;

    const PRIORITY_STEP  = frameStep * (config.isMobile ? 12 : 8);
    const SECONDARY_STEP = frameStep * (config.isMobile ? 6  : 4);
    // More parallel requests = faster finish; mobile handles 6 fine with WebP
    const BATCH_SIZE     = config.isMobile ? 6 : 10;

    // Phase 1 — first frame immediately
    await loadImage(1);
    isReadyRef.current = true;
    drawFrame(0);

    // Phase 2 — priority skeleton (no delays — fire and forget batches)
    const phase2 = [];
    for (let i = 1; i <= TOTAL_FRAMES; i += PRIORITY_STEP) if (i !== 1) phase2.push(i);
    for (let b = 0; b < phase2.length; b += BATCH_SIZE)
      await Promise.all(phase2.slice(b, b + BATCH_SIZE).map(loadImage));

    // Phase 3 — fill gaps
    const phase3 = [];
    for (let i = 1; i <= TOTAL_FRAMES; i += SECONDARY_STEP)
      if (!loadedSetRef.current.has(i - 1)) phase3.push(i);
    for (let b = 0; b < phase3.length; b += BATCH_SIZE)
      await Promise.all(phase3.slice(b, b + BATCH_SIZE).map(loadImage));

    // Phase 4 — all remaining frames at frameStep intervals
    const phase4 = [];
    for (let i = 1; i <= TOTAL_FRAMES; i += frameStep)
      if (!loadedSetRef.current.has(i - 1)) phase4.push(i);
    for (let b = 0; b < phase4.length; b += BATCH_SIZE)
      await Promise.all(phase4.slice(b, b + BATCH_SIZE).map(loadImage));
  }, [loadImage, drawFrame]);

  /* ── Init ── */
  useEffect(() => {
    configRef.current = getMobileConfig();
    loadAllFrames();
  }, [loadAllFrames]);

  /* ── Scroll listener (passive for 60fps, no RAF loop) ── */
  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => drawFrame(currentFrame.current);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [onScroll, drawFrame]);

  // Divide by actual active frames (not TOTAL_FRAMES) — on mobile frameStep=2 means 120 frames total
  const pct = Math.min(100, Math.round((loadProgress / totalActiveFrames.current) * 100));

  return (
    <div className="canvas-layer">
      <canvas ref={canvasRef} />
      <div className="canvas-overlay" />
      {pct < 100 && pct > 0 && (
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            position: "absolute", bottom: 24, left: "50%",
            transform: "translateX(-50%)", width: 120, zIndex: 5,
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 6, opacity: pct > 95 ? 0 : 0.7,
            transition: "opacity 0.5s", pointerEvents: "none",
          }}
        >
          <div style={{ width: "100%", height: 3, borderRadius: 2, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "rgba(255,255,255,0.5)", borderRadius: 2, transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}
    </div>
  );
}
