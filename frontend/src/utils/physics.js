/**
 * Physics utilities for Young's Double Slit Experiment
 */

/**
 * Convert wavelength in nanometers to RGB color
 * Based on Dan Bruton's approximation
 */
export function wavelengthToRGB(lambda_nm, alpha = 1.0) {
  let r = 0, g = 0, b = 0;
  const w = lambda_nm;

  if (w >= 380 && w < 440) {
    r = -(w - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (w >= 440 && w < 490) {
    r = 0;
    g = (w - 440) / (490 - 440);
    b = 1;
  } else if (w >= 490 && w < 510) {
    r = 0;
    g = 1;
    b = -(w - 510) / (510 - 490);
  } else if (w >= 510 && w < 580) {
    r = (w - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (w >= 580 && w < 645) {
    r = 1;
    g = -(w - 645) / (645 - 580);
    b = 0;
  } else if (w >= 645 && w <= 750) {
    r = 1;
    g = 0;
    b = 0;
  }

  // Intensity correction at spectrum edges
  let factor;
  if (w >= 380 && w < 420) {
    factor = 0.3 + 0.7 * (w - 380) / (420 - 380);
  } else if (w >= 420 && w <= 700) {
    factor = 1.0;
  } else if (w > 700 && w <= 750) {
    factor = 0.3 + 0.7 * (750 - w) / (750 - 700);
  } else {
    factor = 0.0;
  }

  r = Math.round(255 * Math.pow(r * factor, 0.8));
  g = Math.round(255 * Math.pow(g * factor, 0.8));
  b = Math.round(255 * Math.pow(b * factor, 0.8));

  return { r, g, b, a: alpha };
}

export function rgbToString({ r, g, b, a = 1 }) {
  return `rgba(${r},${g},${b},${a})`;
}

export function rgbToHex({ r, g, b }) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * sinc(x) = sin(x)/x, with sinc(0) = 1
 */
export function sinc(x) {
  if (Math.abs(x) < 1e-10) return 1;
  return Math.sin(x) / x;
}

/**
 * Calculate intensity at position y on screen
 * @param {number} y - position on screen (meters, 0 = center)
 * @param {object} params - { lambda, d, a, L, thetaI }
 *   lambda: wavelength in meters
 *   d: slit separation in meters
 *   a: slit width in meters
 *   L: screen distance in meters
 *   thetaI: angle of incidence in radians
 * @returns {{ intensity: number, envelope: number }}
 */
export function calculateIntensity(y, params) {
  const { lambda, d, a, L, thetaI = 0 } = params;

  const sinTheta = y / Math.sqrt(y * y + L * L);
  const sinThetaEff = sinTheta - Math.sin(thetaI);

  const beta = (Math.PI * a * sinThetaEff) / lambda;
  const phi = (Math.PI * d * sinThetaEff) / lambda;

  const envelopeVal = sinc(beta);
  const envelope = envelopeVal * envelopeVal;
  const interference = Math.cos(phi) * Math.cos(phi);
  const intensity = envelope * interference;

  return { intensity, envelope };
}

/**
 * Calculate bright fringe positions
 * y_n = n * lambda * L / d (shifted by oblique incidence)
 */
export function brightFringePositions(params, maxOrder = 10) {
  const { lambda, d, L, thetaI = 0 } = params;
  const fringes = [];
  const shift = L * Math.sin(thetaI);

  for (let n = -maxOrder; n <= maxOrder; n++) {
    const y = (n * lambda * L) / d + shift;
    fringes.push({ order: n, y });
  }
  return fringes;
}

/**
 * Calculate fringe width (distance between adjacent bright fringes)
 */
export function fringeWidth(params) {
  const { lambda, d, L } = params;
  return (lambda * L) / d;
}

/**
 * Generate intensity profile data for graphing
 * @returns {Array<{y: number, intensity: number, envelope: number}>}
 */
export function generateIntensityProfile(params, yRange, numPoints = 500) {
  const data = [];
  const step = (yRange[1] - yRange[0]) / numPoints;

  for (let i = 0; i <= numPoints; i++) {
    const y = yRange[0] + i * step;
    const { intensity, envelope } = calculateIntensity(y, params);
    data.push({ y, intensity, envelope });
  }
  return data;
}

/**
 * Default simulation parameters
 */
export const DEFAULT_PARAMS = {
  wavelength: 550,     // nm
  slitWidth: 0.08,     // mm
  slitSeparation: 0.5, // mm
  screenDistance: 1.0,  // m
  laserAngle: 0,       // radians
  showWavefronts: true,
};

/**
 * Parameter ranges
 */
export const PARAM_RANGES = {
  wavelength: { min: 380, max: 750, step: 1, unit: 'nm' },
  slitWidth: { min: 0.01, max: 0.5, step: 0.001, unit: 'mm' },
  slitSeparation: { min: 0.1, max: 3.0, step: 0.01, unit: 'mm' },
  screenDistance: { min: 0.5, max: 3.0, step: 0.01, unit: 'm' },
};
