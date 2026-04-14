import "@/App.css";
import { useYDSE } from '@/hooks/useYDSE';
import ExperimentCanvas from '@/components/ExperimentCanvas';
import IntensityGraph from '@/components/IntensityGraph';
import ControlsPanel from '@/components/ControlsPanel';
import { Atom } from 'lucide-react';

function App() {
  const ydse = useYDSE();

  return (
    <div className="ydse-app min-h-screen bg-black text-slate-200 p-2 md:p-4 lg:p-6 font-body selection:bg-cyan-500/30">
      {/* Header */}
      <header
        className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-900"
        data-testid="app-header"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/50 border border-cyan-800/40 flex items-center justify-center">
            <Atom size={18} className="text-cyan-400" strokeWidth={1.5} />
          </div>
          <div>
            <h1
              className="text-lg sm:text-xl font-heading tracking-tight text-cyan-400"
              style={{ textShadow: '0 0 12px rgba(34,211,238,0.3)' }}
              data-testid="app-title"
            >
              Young's Double Slit Experiment
            </h1>
            <p className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase">
              Interactive Wave Optics Simulation
            </p>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-3 lg:gap-4" style={{ minHeight: 'calc(100vh - 5rem)' }}>

        {/* Experiment Canvas - Takes ~66% width on desktop */}
        <div
          className="lg:flex-[2] relative rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden ring-1 ring-white/5 h-[400px] sm:h-[450px] lg:h-auto"
          data-testid="canvas-container"
        >
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] opacity-10" />
          <ExperimentCanvas
            wavelength={ydse.wavelength}
            slitWidth={ydse.slitWidth}
            slitSeparation={ydse.slitSeparation}
            screenDistance={ydse.screenDistance}
            laserAngle={ydse.laserAngle}
            showWavefronts={ydse.showWavefronts}
            setSlitSeparation={ydse.setSlitSeparation}
            setScreenDistance={ydse.setScreenDistance}
            setSlitWidth={ydse.setSlitWidth}
            setLaserAngle={ydse.setLaserAngle}
            physicsParams={ydse.physicsParams}
          />
        </div>

        {/* Right panel: Graph + Controls stacked */}
        <div className="lg:flex-[1] flex flex-col gap-3 lg:gap-4 lg:min-w-[380px] lg:max-w-[440px] lg:overflow-auto lg:max-h-[calc(100vh-5rem)]">
          {/* Intensity Graph */}
          <div
            className="relative rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden ring-1 ring-white/5 h-[300px] sm:h-[320px] lg:min-h-[300px]"
            data-testid="graph-container"
          >
            <IntensityGraph
              wavelength={ydse.wavelength}
              intensityProfile={ydse.intensityProfile}
              yRange={ydse.yRange}
              physicsParams={ydse.physicsParams}
              beta={ydse.beta}
            />
          </div>

          {/* Controls Panel */}
          <div
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 lg:p-5 ring-1 ring-white/5"
            data-testid="controls-container"
          >
            <ControlsPanel
              wavelength={ydse.wavelength}
              setWavelength={ydse.setWavelength}
              slitWidth={ydse.slitWidth}
              setSlitWidth={ydse.setSlitWidth}
              slitSeparation={ydse.slitSeparation}
              setSlitSeparation={ydse.setSlitSeparation}
              screenDistance={ydse.screenDistance}
              setScreenDistance={ydse.setScreenDistance}
              showWavefronts={ydse.showWavefronts}
              setShowWavefronts={ydse.setShowWavefronts}
              beta={ydse.beta}
              reset={ydse.reset}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
