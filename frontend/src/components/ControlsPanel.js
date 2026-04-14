import { RotateCcw, Eye, EyeOff, Waves } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { wavelengthToRGB, rgbToString, rgbToHex, PARAM_RANGES } from '@/utils/physics';

/**
 * Controls panel with sliders for YDSE simulation parameters
 */
export default function ControlsPanel({
  wavelength, setWavelength,
  slitWidth, setSlitWidth,
  slitSeparation, setSlitSeparation,
  screenDistance, setScreenDistance,
  showWavefronts, setShowWavefronts,
  beta, reset,
}) {
  const color = wavelengthToRGB(wavelength);
  const colorStr = rgbToString(color);
  const colorHex = rgbToHex(color);

  const sliders = [
    {
      id: 'wavelength',
      label: 'Wavelength',
      symbol: '\u03BB',
      value: wavelength,
      onChange: setWavelength,
      ...PARAM_RANGES.wavelength,
      format: (v) => `${v} nm`,
    },
    {
      id: 'slit-width',
      label: 'Slit Width',
      symbol: 'a',
      value: slitWidth,
      onChange: setSlitWidth,
      ...PARAM_RANGES.slitWidth,
      format: (v) => `${v.toFixed(3)} mm`,
    },
    {
      id: 'slit-separation',
      label: 'Slit Separation',
      symbol: 'd',
      value: slitSeparation,
      onChange: setSlitSeparation,
      ...PARAM_RANGES.slitSeparation,
      format: (v) => `${v.toFixed(2)} mm`,
    },
    {
      id: 'screen-distance',
      label: 'Screen Distance',
      symbol: 'L',
      value: screenDistance,
      onChange: setScreenDistance,
      ...PARAM_RANGES.screenDistance,
      format: (v) => `${v.toFixed(2)} m`,
    },
  ];

  return (
    <div className="flex flex-col gap-5" data-testid="controls-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-500/80"
          data-testid="controls-title"
        >
          Parameters
        </h3>
        <button
          onClick={reset}
          data-testid="reset-button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono
            bg-cyan-950/50 text-cyan-400 border border-cyan-800/50
            hover:bg-cyan-900/50 hover:text-cyan-300 transition-all duration-200"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      {/* Sliders */}
      {sliders.map((s) => (
        <div key={s.id} className="space-y-2" data-testid={`slider-group-${s.id}`}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono text-zinc-400 flex items-center gap-2">
              <span className="text-cyan-400/80 font-bold">{s.symbol}</span>
              {s.label}
            </label>
            <span
              className="text-xs font-mono tabular-nums px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800"
              style={{ color: s.id === 'wavelength' ? colorStr : '#94a3b8' }}
              data-testid={`value-${s.id}`}
            >
              {s.format(s.value)}
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={s.value}
              onChange={(e) => s.onChange(parseFloat(e.target.value))}
              data-testid={`slider-${s.id}`}
              className="ydse-slider w-full"
              style={{
                '--slider-color': s.id === 'wavelength' ? colorHex : '#22d3ee',
                '--progress': `${((s.value - s.min) / (s.max - s.min)) * 100}%`,
                background: `linear-gradient(to right, ${s.id === 'wavelength' ? colorHex : '#22d3ee'} 0%, ${s.id === 'wavelength' ? colorHex : '#22d3ee'} ${((s.value - s.min) / (s.max - s.min)) * 100}%, #27272a ${((s.value - s.min) / (s.max - s.min)) * 100}%, #27272a 100%)`,
              }}
            />
          </div>
        </div>
      ))}

      {/* Divider */}
      <div className="border-t border-zinc-800/50" />

      {/* Wavefront toggle */}
      <div className="flex items-center justify-between" data-testid="wavefront-toggle-group">
        <label className="text-xs font-mono text-zinc-400 flex items-center gap-2">
          <Waves size={14} className="text-cyan-400/80" />
          Wavefronts
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-500">
            {showWavefronts ? 'ON' : 'OFF'}
          </span>
          <Switch
            checked={showWavefronts}
            onCheckedChange={setShowWavefronts}
            data-testid="wavefront-toggle"
            className="data-[state=checked]:bg-cyan-600 data-[state=unchecked]:bg-zinc-700"
          />
        </div>
      </div>

      {/* Info readout */}
      <div className="border-t border-zinc-800/50 pt-3" data-testid="info-readout">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-500/80 mb-3">
          Readout
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-900/50 rounded-md px-3 py-2 border border-zinc-800/50">
            <div className="text-[10px] text-zinc-500 font-mono">Fringe Width</div>
            <div className="text-sm font-mono text-zinc-200 tabular-nums" data-testid="fringe-width-value">
              {beta.toFixed(3)} mm
            </div>
          </div>
          <div className="bg-zinc-900/50 rounded-md px-3 py-2 border border-zinc-800/50">
            <div className="text-[10px] text-zinc-500 font-mono">Color</div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colorStr, boxShadow: `0 0 8px ${colorStr}` }}
              />
              <span className="text-sm font-mono text-zinc-200">{wavelength}nm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Drag instructions */}
      <div className="text-[10px] font-mono text-zinc-600 leading-relaxed border-t border-zinc-800/50 pt-3">
        <div className="text-zinc-500 mb-1">Interactive Controls:</div>
        <div>Drag laser up/down to change angle</div>
        <div>Drag slits apart/together for separation</div>
        <div>Drag barrier or screen to adjust distance</div>
      </div>
    </div>
  );
}
