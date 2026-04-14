import { useRef, useEffect, useCallback } from 'react';
import { wavelengthToRGB, rgbToString, brightFringePositions } from '@/utils/physics';

/**
 * Intensity vs Position graph rendered on HTML5 Canvas
 * Shows I(y) curve with wavelength color fill and diffraction envelope
 */
export default function IntensityGraph({
  wavelength, intensityProfile, yRange, physicsParams, beta
}) {
  const canvasRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  const color = wavelengthToRGB(wavelength);
  const colorStr = rgbToString(color);

  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { w, h } = sizeRef.current;

    if (w === 0 || h === 0) return;

    // Clear using physical pixels
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Margins
    const margin = { top: 30, right: 25, bottom: 50, left: 55 };
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;

    if (plotW < 10 || plotH < 10) return;

    // Scales
    const yMin = yRange[0] * 1000; // convert to mm
    const yMax = yRange[1] * 1000;
    const xScale = (val) => margin.left + ((val - yMin) / (yMax - yMin)) * plotW;
    const yScale = (val) => margin.top + (1 - val) * plotH;

    // Background grid
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.06)';
    ctx.lineWidth = 0.5;
    const numGridX = 10;
    const numGridY = 5;
    for (let i = 0; i <= numGridX; i++) {
      const gx = margin.left + (i / numGridX) * plotW;
      ctx.beginPath();
      ctx.moveTo(gx, margin.top);
      ctx.lineTo(gx, margin.top + plotH);
      ctx.stroke();
    }
    for (let i = 0; i <= numGridY; i++) {
      const gy = margin.top + (i / numGridY) * plotH;
      ctx.beginPath();
      ctx.moveTo(margin.left, gy);
      ctx.lineTo(margin.left + plotW, gy);
      ctx.stroke();
    }

    // Plot area border
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(margin.left, margin.top, plotW, plotH);

    if (!intensityProfile || intensityProfile.length === 0) return;

    // Draw filled intensity curve
    ctx.beginPath();
    ctx.moveTo(xScale(intensityProfile[0].y * 1000), yScale(0));
    for (const point of intensityProfile) {
      ctx.lineTo(xScale(point.y * 1000), yScale(point.intensity));
    }
    ctx.lineTo(xScale(intensityProfile[intensityProfile.length - 1].y * 1000), yScale(0));
    ctx.closePath();

    // Gradient fill
    const fillGrad = ctx.createLinearGradient(0, margin.top, 0, margin.top + plotH);
    fillGrad.addColorStop(0, rgbToString({ ...color, a: 0.4 }));
    fillGrad.addColorStop(1, rgbToString({ ...color, a: 0.02 }));
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Intensity line
    ctx.beginPath();
    for (let i = 0; i < intensityProfile.length; i++) {
      const point = intensityProfile[i];
      const px = xScale(point.y * 1000);
      const py = yScale(point.intensity);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = colorStr;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = colorStr;
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Diffraction envelope (dashed)
    ctx.beginPath();
    for (let i = 0; i < intensityProfile.length; i++) {
      const point = intensityProfile[i];
      const px = xScale(point.y * 1000);
      const py = yScale(point.envelope);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // Mark fringe orders - only if there's enough space between labels
    const fringes = brightFringePositions(physicsParams, 8);

    let lastLabelX = -Infinity;
    const minLabelGap = 30; // minimum pixel gap between labels

    for (const fringe of fringes) {
      const fringeMm = fringe.y * 1000;
      if (fringeMm < yMin || fringeMm > yMax) continue;
      const fx = xScale(fringeMm);

      // Tick mark
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fx, margin.top + plotH);
      ctx.lineTo(fx, margin.top + plotH + 6);
      ctx.stroke();

      // Order label - only if enough space and within visible range
      if (Math.abs(fringe.order) <= 4 && Math.abs(fx - lastLabelX) > minLabelGap) {
        ctx.fillStyle = 'rgba(34, 211, 238, 0.7)';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`n=${fringe.order}`, fx, margin.top + plotH + 16);
        lastLabelX = fx;
      }
    }

    // Axes labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '11px "IBM Plex Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Position y (mm)', margin.left + plotW / 2, h - 6);

    // Y-axis label
    ctx.save();
    ctx.translate(14, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Intensity I(y)', 0, 0);
    ctx.restore();

    // X-axis ticks
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const xTickCount = 6;
    for (let i = 0; i <= xTickCount; i++) {
      const val = yMin + (i / xTickCount) * (yMax - yMin);
      const tx = xScale(val);
      ctx.fillText(val.toFixed(1), tx, margin.top + plotH + 28);
    }

    // Y-axis ticks
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = i / 4;
      ctx.fillText(val.toFixed(2), margin.left - 8, yScale(val) + 3);
    }

    // Title
    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.font = '12px "Azeret Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Intensity Profile', margin.left, margin.top - 12);

    // Fringe width info
    ctx.fillStyle = 'rgba(34, 211, 238, 0.7)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`\u03B2 = ${beta.toFixed(3)} mm`, w - margin.right, margin.top - 12);

    // Legend
    const legendX = w - margin.right - 100;
    const legendY = margin.top + 15;
    // Intensity line
    ctx.strokeStyle = colorStr;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + 20, legendY);
    ctx.stroke();
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '9px "IBM Plex Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('I(y)', legendX + 24, legendY + 3);
    // Envelope line
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 16);
    ctx.lineTo(legendX + 20, legendY + 16);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('Envelope', legendX + 24, legendY + 19);

  }, [wavelength, intensityProfile, yRange, physicsParams, beta, color, colorStr]);

  // Resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.floor(rect.width);
      const cssH = Math.floor(rect.height);
      if (cssW === 0 || cssH === 0) return;
      const dpr = window.devicePixelRatio || 1;
      const physW = Math.floor(cssW * dpr);
      const physH = Math.floor(cssH * dpr);
      if (canvas.width !== physW || canvas.height !== physH) {
        canvas.width = physW;
        canvas.height = physH;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        sizeRef.current = { w: cssW, h: cssH };
      }
      drawGraph();
    };

    resize();
    window.addEventListener('resize', resize);
    const timer = setTimeout(resize, 200);
    return () => {
      window.removeEventListener('resize', resize);
      clearTimeout(timer);
    };
  }, [drawGraph]);

  // Redraw on data changes
  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="intensity-graph"
      className="absolute inset-0 w-full h-full"
    />
  );
}
