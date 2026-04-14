import { useState, useCallback, useMemo } from 'react';
import { DEFAULT_PARAMS, generateIntensityProfile, fringeWidth, brightFringePositions } from '@/utils/physics';

/**
 * Hook managing all YDSE simulation state and derived calculations
 */
export function useYDSE() {
  const [wavelength, setWavelength] = useState(DEFAULT_PARAMS.wavelength);
  const [slitWidth, setSlitWidth] = useState(DEFAULT_PARAMS.slitWidth);
  const [slitSeparation, setSlitSeparation] = useState(DEFAULT_PARAMS.slitSeparation);
  const [screenDistance, setScreenDistance] = useState(DEFAULT_PARAMS.screenDistance);
  const [laserAngle, setLaserAngle] = useState(DEFAULT_PARAMS.laserAngle);
  const [showWavefronts, setShowWavefronts] = useState(DEFAULT_PARAMS.showWavefronts);

  // Convert to SI units for physics calculations
  const physicsParams = useMemo(() => ({
    lambda: wavelength * 1e-9,     // nm -> m
    a: slitWidth * 1e-3,           // mm -> m
    d: slitSeparation * 1e-3,      // mm -> m
    L: screenDistance,              // already in m
    thetaI: laserAngle,            // already in radians
  }), [wavelength, slitWidth, slitSeparation, screenDistance, laserAngle]);

  // Calculate fringe width in mm
  const beta = useMemo(() => {
    const fw = fringeWidth(physicsParams);
    return fw * 1000; // convert to mm
  }, [physicsParams]);

  // Calculate y-range for graph (show ~10 fringes on each side)
  const yRange = useMemo(() => {
    const extent = Math.max(beta * 12 * 1e-3, 0.005); // at least 5mm range
    return [-extent, extent];
  }, [beta]);

  // Generate intensity profile
  const intensityProfile = useMemo(() => {
    return generateIntensityProfile(physicsParams, yRange, 600);
  }, [physicsParams, yRange]);

  // Calculate fringe positions
  const fringes = useMemo(() => {
    return brightFringePositions(physicsParams, 15);
  }, [physicsParams]);

  const reset = useCallback(() => {
    setWavelength(DEFAULT_PARAMS.wavelength);
    setSlitWidth(DEFAULT_PARAMS.slitWidth);
    setSlitSeparation(DEFAULT_PARAMS.slitSeparation);
    setScreenDistance(DEFAULT_PARAMS.screenDistance);
    setLaserAngle(DEFAULT_PARAMS.laserAngle);
    setShowWavefronts(DEFAULT_PARAMS.showWavefronts);
  }, []);

  return {
    // State
    wavelength, setWavelength,
    slitWidth, setSlitWidth,
    slitSeparation, setSlitSeparation,
    screenDistance, setScreenDistance,
    laserAngle, setLaserAngle,
    showWavefronts, setShowWavefronts,

    // Derived
    physicsParams,
    beta,
    yRange,
    intensityProfile,
    fringes,

    // Actions
    reset,
  };
}
