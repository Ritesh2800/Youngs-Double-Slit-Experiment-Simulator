import { useRef, useEffect, useCallback, useState } from 'react';
import { wavelengthToRGB, rgbToString, calculateIntensity } from '@/utils/physics';

/**
 * 2D interactive experiment canvas
 * Draws: laser, beams, slit barrier, Huygens wavefronts, screen with fringes
 * Supports drag interactions (mouse + touch)
 */
export default function ExperimentCanvas({
  wavelength, slitWidth, slitSeparation, screenDistance,
  laserAngle, showWavefronts,
  setSlitSeparation, setScreenDistance, setSlitWidth, setLaserAngle,
  physicsParams,
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const [hoveredElement, setHoveredElement] = useState(null);
  const dragRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  // Layout constants (in canvas-relative coordinates)
  const getLayout = useCallback((w, h) => {
    const padding = 40;
    const laserX = padding + 30;
    const barrierX = padding + (w - 2 * padding) * (0.25 + 0.15 * (1 - (screenDistance - 0.5) / 2.5));
    const screenX = w - padding - 30;
    const centerY = h / 2;
    const slitHalfSep = Math.min((slitSeparation / 3.0) * (h * 0.3), h * 0.3);
    const slitHalfWidth = Math.max((slitWidth / 0.5) * 8, 2);

    return {
      laserX, barrierX, screenX, centerY, padding,
      slitHalfSep, slitHalfWidth,
      slit1Y: centerY - slitHalfSep,
      slit2Y: centerY + slitHalfSep,
    };
  }, [slitSeparation, slitWidth, screenDistance]);

  // Wavelength color
  const color = wavelengthToRGB(wavelength);
  const colorStr = rgbToString(color);
  const colorDim = rgbToString({ ...color, a: 0.3 });
  const colorGlow = rgbToString({ ...color, a: 0.6 });

  // Hit testing for drag interactions
  const hitTest = useCallback((x, y, layout) => {
    const { laserX, barrierX, screenX, centerY, slit1Y, slit2Y, slitHalfWidth, slitHalfSep } = layout;

    // Laser source (drag up/down for angle)
    const laserY = centerY + Math.sin(laserAngle) * 200;
    if (Math.abs(x - laserX) < 25 && Math.abs(y - laserY) < 25) return 'laser';

    // Screen (drag left/right)
    if (Math.abs(x - screenX) < 15 && y > 40 && y < sizeRef.current.h - 40) return 'screen';

    // Slit edges (long-press for width change) - check first as they overlap with slit drag
    if (Math.abs(x - barrierX) < 20) {
      // Top slit edges
      if (Math.abs(y - (slit1Y - slitHalfWidth)) < 10) return 'slit1-top';
      if (Math.abs(y - (slit1Y + slitHalfWidth)) < 10) return 'slit1-bottom';
      // Bottom slit edges
      if (Math.abs(y - (slit2Y - slitHalfWidth)) < 10) return 'slit2-top';
      if (Math.abs(y - (slit2Y + slitHalfWidth)) < 10) return 'slit2-bottom';

      // Slit separation (drag slits apart/together)
      if (Math.abs(y - slit1Y) < slitHalfWidth + 15) return 'slit1';
      if (Math.abs(y - slit2Y) < slitHalfWidth + 15) return 'slit2';

      // Barrier drag (left/right)
      return 'barrier';
    }

    return null;
  }, [laserAngle]);

  // Draw functions
  const draw = useCallback((ctx, w, h, time) => {
    const layout = getLayout(w, h);
    const { laserX, barrierX, screenX, centerY, slit1Y, slit2Y, slitHalfWidth } = layout;

    // Clear using physical pixels then draw in CSS space
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();

    // Background grid
    drawGrid(ctx, w, h);

    // Laser source
    drawLaser(ctx, layout, time);

    // Laser beams
    drawBeams(ctx, layout);

    // Slit barrier
    drawBarrier(ctx, layout, w, h);

    // Wavefronts (Huygens principle)
    if (showWavefronts) {
      drawWavefronts(ctx, layout, time, w, h);
    }

    // CRITICAL: Force reset composite mode before screen drawing
    // (wavefronts use additive blending which can leak on some browsers)
    ctx.globalCompositeOperation = 'source-over';

    // Screen with fringes
    drawScreen(ctx, layout, h);

    // Draggable element highlights
    if (hoveredElement) {
      drawHighlight(ctx, layout, w, h);
    }

    // Labels
    drawLabels(ctx, layout, w, h);

  }, [getLayout, showWavefronts, hoveredElement, colorStr, colorDim, colorGlow, wavelength, physicsParams, laserAngle, color, slitWidth, slitSeparation, screenDistance]);

  const drawGrid = (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.04)';
    ctx.lineWidth = 0.5;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  };

  const drawLaser = (ctx, layout, time) => {
    const { laserX, centerY } = layout;
    const laserY = centerY + Math.sin(laserAngle) * 200;

    // Glow
    const pulse = 0.7 + 0.3 * Math.sin(time * 3);
    const grad = ctx.createRadialGradient(laserX, laserY, 2, laserX, laserY, 25);
    grad.addColorStop(0, rgbToString({ ...color, a: pulse }));
    grad.addColorStop(0.5, rgbToString({ ...color, a: pulse * 0.3 }));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(laserX - 30, laserY - 30, 60, 60);

    // Body
    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = colorStr;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(laserX - 18, laserY - 10, 36, 20, 4);
    ctx.fill();
    ctx.stroke();

    // Aperture
    ctx.fillStyle = colorStr;
    ctx.beginPath();
    ctx.arc(laserX + 18, laserY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LASER', laserX, laserY + 28);
  };

  const drawBeams = (ctx, layout) => {
    const { laserX, barrierX, centerY, slit1Y, slit2Y } = layout;
    const laserY = centerY + Math.sin(laserAngle) * 200;

    ctx.strokeStyle = rgbToString({ ...color, a: 0.5 });
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);

    // Beam to slit 1
    ctx.beginPath();
    ctx.moveTo(laserX + 20, laserY);
    ctx.lineTo(barrierX, slit1Y);
    ctx.stroke();

    // Beam to slit 2
    ctx.beginPath();
    ctx.moveTo(laserX + 20, laserY);
    ctx.lineTo(barrierX, slit2Y);
    ctx.stroke();

    // Animated pulse along beams
    const pulse = (timeRef.current * 0.5) % 1;
    const pulseX1 = laserX + 20 + (barrierX - laserX - 20) * pulse;
    const pulseY1 = laserY + (slit1Y - laserY) * pulse;
    const pulseX2 = laserX + 20 + (barrierX - laserX - 20) * pulse;
    const pulseY2 = laserY + (slit2Y - laserY) * pulse;

    const pulseGrad1 = ctx.createRadialGradient(pulseX1, pulseY1, 0, pulseX1, pulseY1, 8);
    pulseGrad1.addColorStop(0, rgbToString({ ...color, a: 0.8 }));
    pulseGrad1.addColorStop(1, 'transparent');
    ctx.fillStyle = pulseGrad1;
    ctx.fillRect(pulseX1 - 10, pulseY1 - 10, 20, 20);

    const pulseGrad2 = ctx.createRadialGradient(pulseX2, pulseY2, 0, pulseX2, pulseY2, 8);
    pulseGrad2.addColorStop(0, rgbToString({ ...color, a: 0.8 }));
    pulseGrad2.addColorStop(1, 'transparent');
    ctx.fillStyle = pulseGrad2;
    ctx.fillRect(pulseX2 - 10, pulseY2 - 10, 20, 20);
  };

  const drawBarrier = (ctx, layout, w, h) => {
    const { barrierX, centerY, slit1Y, slit2Y, slitHalfWidth } = layout;

    // Barrier body (dark with border)
    ctx.fillStyle = '#0d1117';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;

    // Top section (above slit 1)
    ctx.fillRect(barrierX - 6, 20, 12, slit1Y - slitHalfWidth - 20);
    ctx.strokeRect(barrierX - 6, 20, 12, slit1Y - slitHalfWidth - 20);

    // Middle section (between slits)
    ctx.fillRect(barrierX - 6, slit1Y + slitHalfWidth, 12, (slit2Y - slitHalfWidth) - (slit1Y + slitHalfWidth));
    ctx.strokeRect(barrierX - 6, slit1Y + slitHalfWidth, 12, (slit2Y - slitHalfWidth) - (slit1Y + slitHalfWidth));

    // Bottom section (below slit 2)
    ctx.fillRect(barrierX - 6, slit2Y + slitHalfWidth, 12, h - slit2Y - slitHalfWidth - 20);
    ctx.strokeRect(barrierX - 6, slit2Y + slitHalfWidth, 12, h - slit2Y - slitHalfWidth - 20);

    // Slit openings (glowing)
    ctx.fillStyle = rgbToString({ ...color, a: 0.6 });
    ctx.shadowColor = colorStr;
    ctx.shadowBlur = 8;
    ctx.fillRect(barrierX - 6, slit1Y - slitHalfWidth, 12, slitHalfWidth * 2);
    ctx.fillRect(barrierX - 6, slit2Y - slitHalfWidth, 12, slitHalfWidth * 2);
    ctx.shadowBlur = 0;

    // Labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BARRIER', barrierX, h - 8);

    // Dimension indicators
    // Slit separation 'd'
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(barrierX + 16, slit1Y);
    ctx.lineTo(barrierX + 16, slit2Y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(34, 211, 238, 0.7)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('d', barrierX + 20, centerY + 3);
  };

  const drawWavefronts = (ctx, layout, time, w, h) => {
    const { barrierX, slit1Y, slit2Y, screenX } = layout;

    const waveSpeed = 60;
    const maxRadius = screenX - barrierX - 20;
    const waveSpacing = 16 + (wavelength - 380) / (750 - 380) * 10;

    ctx.save();
    try {
      // Clip to region between barrier and screen (exclude screen area)
      ctx.beginPath();
      ctx.rect(barrierX + 6, 0, screenX - barrierX - 46, h);
      ctx.clip();

      const numWaves = Math.ceil(maxRadius / waveSpacing) + 5;
      const offset = (time * waveSpeed) % waveSpacing;

      ctx.globalCompositeOperation = 'screen';

      for (let i = 0; i < numWaves; i++) {
        const radius = i * waveSpacing + offset;
        if (radius < 2 || radius > maxRadius) continue;

        const distFade = 1 - radius / maxRadius;
        const alpha = Math.max(0, 0.25 * distFade);

        ctx.strokeStyle = rgbToString({ ...color, a: alpha });
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(barrierX, slit1Y, radius, -Math.PI * 0.48, Math.PI * 0.48);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(barrierX, slit2Y, radius, -Math.PI * 0.48, Math.PI * 0.48);
        ctx.stroke();
      }

      // Constructive interference dots
      ctx.globalCompositeOperation = 'lighter';
      const slitDist = slit2Y - slit1Y;
      const maxDotRadius = maxRadius * 0.75;

      for (let i = 0; i < numWaves; i++) {
        const r1 = i * waveSpacing + offset;
        if (r1 < 10 || r1 > maxDotRadius) continue;

        for (let j = 0; j < numWaves; j++) {
          const r2 = j * waveSpacing + offset;
          if (r2 < 10 || r2 > maxDotRadius) continue;

          const d = slitDist;
          if (Math.abs(r1 - r2) > d || r1 + r2 < d) continue;

          const a_val = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
          const hSq = r1 * r1 - a_val * a_val;
          if (hSq < 0) continue;
          const hVal = Math.sqrt(hSq);

          const iy = slit1Y + a_val;
          const ix1 = barrierX + hVal;

          if (ix1 > barrierX + 8 && ix1 < screenX - 50) {
            const distFromCenter = Math.sqrt((ix1 - barrierX) ** 2 + (iy - (slit1Y + slit2Y) / 2) ** 2);
            const distFade1 = 1 - Math.min(1, distFromCenter / maxDotRadius);
            const dotAlpha = 0.12 * distFade1;
            ctx.fillStyle = rgbToString({ ...color, a: dotAlpha });
            ctx.beginPath();
            ctx.arc(ix1, iy, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    } finally {
      // ALWAYS restore - even if an error occurs above
      ctx.restore();
      // Belt-and-suspenders: force composite mode back
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const drawScreen = (ctx, layout, h) => {
    const { screenX, centerY } = layout;
    const screenHeight = h - 80;
    const screenTop = 40;

    // Isolate screen rendering completely
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // clearRect ALWAYS clears regardless of composite mode
    ctx.clearRect(screenX - 40, screenTop - 5, 80, screenHeight + 10);

    // Black background behind screen area
    ctx.fillStyle = '#000000';
    ctx.fillRect(screenX - 40, screenTop - 5, 80, screenHeight + 10);

    // Screen backing
    ctx.fillStyle = '#080810';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.fillRect(screenX - 8, screenTop, 16, screenHeight);
    ctx.strokeRect(screenX - 8, screenTop, 16, screenHeight);

    // Draw interference pattern on screen
    const numPixels = Math.floor(screenHeight);
    for (let py = 0; py < numPixels; py++) {
      const screenPos = screenTop + py;
      const yPhys = ((screenPos - centerY) / (screenHeight / 2)) * physicsParams.L * 0.02;
      const { intensity } = calculateIntensity(yPhys, physicsParams);

      // Robust NaN/invalid clamping
      let safeIntensity = 0;
      if (Number.isFinite(intensity) && intensity > 0) {
        safeIntensity = Math.min(intensity, 1);
      }
      const bright = Math.sqrt(safeIntensity);
      const alpha = bright * 0.9;

      // Set fillStyle fresh for every pixel row
      ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha.toFixed(4)})`;
      ctx.fillRect(screenX - 6, screenPos, 12, 1);
    }

    // Subtle screen glow
    const glowGrad = ctx.createLinearGradient(screenX - 15, 0, screenX + 15, 0);
    glowGrad.addColorStop(0, 'transparent');
    glowGrad.addColorStop(0.4, `rgba(${color.r},${color.g},${color.b},0.03)`);
    glowGrad.addColorStop(0.5, `rgba(${color.r},${color.g},${color.b},0.05)`);
    glowGrad.addColorStop(0.6, `rgba(${color.r},${color.g},${color.b},0.03)`);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(screenX - 15, screenTop, 30, screenHeight);

    ctx.restore();

    // Label
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCREEN', screenX, h - 8);

    // L dimension line
    const { barrierX } = layout;
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(barrierX, h - 25);
    ctx.lineTo(screenX, h - 25);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`L = ${screenDistance.toFixed(2)}m`, (barrierX + screenX) / 2, h - 28);
  };

  const drawHighlight = (ctx, layout, w, h) => {
    const { laserX, barrierX, screenX, centerY, slit1Y, slit2Y, slitHalfWidth } = layout;
    const laserY = centerY + Math.sin(laserAngle) * 200;

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    if (hoveredElement === 'laser') {
      ctx.strokeRect(laserX - 22, laserY - 14, 44, 28);
    } else if (hoveredElement === 'barrier') {
      ctx.strokeRect(barrierX - 10, 16, 20, h - 32);
    } else if (hoveredElement === 'screen') {
      ctx.strokeRect(screenX - 12, 36, 24, h - 72);
    } else if (hoveredElement?.startsWith('slit')) {
      const sy = hoveredElement.includes('1') ? slit1Y : slit2Y;
      ctx.strokeRect(barrierX - 10, sy - slitHalfWidth - 4, 20, slitHalfWidth * 2 + 8);
    }
    ctx.setLineDash([]);
  };

  const drawLabels = (ctx, layout, w, h) => {
    // Title
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`\u03BB = ${wavelength}nm`, 10, 16);
    ctx.fillText(`d = ${slitSeparation.toFixed(2)}mm`, 10, 28);
    ctx.fillText(`a = ${slitWidth.toFixed(3)}mm`, 120, 16);
    ctx.fillText(`L = ${screenDistance.toFixed(2)}m`, 120, 28);
  };

  // Mouse/touch interaction handlers - returns CSS pixel coordinates
  const getCanvasPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handlePointerDown = useCallback((e) => {
    const pos = getCanvasPos(e);
    const layout = getLayout(sizeRef.current.w, sizeRef.current.h);
    const hit = hitTest(pos.x, pos.y, layout);
    if (hit) {
      dragRef.current = { type: hit, startX: pos.x, startY: pos.y, startAngle: laserAngle, startSep: slitSeparation, startWidth: slitWidth, startDist: screenDistance };
      e.preventDefault();
    }
  }, [getCanvasPos, getLayout, hitTest, laserAngle, slitSeparation, slitWidth, screenDistance]);

  const handlePointerMove = useCallback((e) => {
    const pos = getCanvasPos(e);
    const layout = getLayout(sizeRef.current.w, sizeRef.current.h);

    if (dragRef.current) {
      e.preventDefault();
      const drag = dragRef.current;
      const dx = pos.x - drag.startX;
      const dy = pos.y - drag.startY;

      if (drag.type === 'laser') {
        const newAngle = Math.max(-0.3, Math.min(0.3, drag.startAngle + dy * 0.002));
        setLaserAngle(newAngle);
      } else if (drag.type === 'slit1' || drag.type === 'slit2') {
        const sign = drag.type === 'slit1' ? -1 : 1;
        const newSep = Math.max(0.1, Math.min(3.0, drag.startSep + sign * dy * 0.005));
        setSlitSeparation(Math.round(newSep * 100) / 100);
      } else if (drag.type.includes('-top') || drag.type.includes('-bottom')) {
        const newWidth = Math.max(0.01, Math.min(0.5, drag.startWidth + Math.abs(dy) * 0.001 * Math.sign(dy)));
        setSlitWidth(Math.round(newWidth * 1000) / 1000);
      } else if (drag.type === 'screen' || drag.type === 'barrier') {
        const newDist = Math.max(0.5, Math.min(3.0, drag.startDist + dx * 0.003));
        setScreenDistance(Math.round(newDist * 100) / 100);
      }
    } else {
      const hit = hitTest(pos.x, pos.y, layout);
      setHoveredElement(hit);
    }
  }, [getCanvasPos, getLayout, hitTest, setLaserAngle, setSlitSeparation, setSlitWidth, setScreenDistance]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Animation loop with integrated resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const animate = (timestamp) => {
      const dt = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = timestamp;
      timeRef.current += dt;

      // Resize canvas to match CSS layout
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.floor(rect.width);
      const cssH = Math.floor(rect.height);
      if (cssW > 0 && cssH > 0) {
        const dpr = window.devicePixelRatio || 1;
        const physW = Math.floor(cssW * dpr);
        const physH = Math.floor(cssH * dpr);
        if (canvas.width !== physW || canvas.height !== physH) {
          canvas.width = physW;
          canvas.height = physH;
          const ctx2 = canvas.getContext('2d');
          ctx2.scale(dpr, dpr);
        }
        sizeRef.current = { w: cssW, h: cssH };
      }

      const ctx = canvas.getContext('2d');
      const { w, h } = sizeRef.current;
      if (w > 0 && h > 0) {
        draw(ctx, w, h, timeRef.current);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  // (resize is handled inside the animation loop above)

  return (
    <canvas
      ref={canvasRef}
      data-testid="experiment-canvas"
      className="absolute inset-0 w-full h-full cursor-crosshair"
      style={{ touchAction: 'none' }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    />
  );
}
