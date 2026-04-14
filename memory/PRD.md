# YDSE Simulation - PRD

## Original Problem Statement
Build an interactive Young's Double Slit Experiment (YDSE) simulation as a single-page website with HTML5 Canvas. Features include 2D interactive experiment setup, intensity vs position graph, parameter sliders, drag interactions, Huygens wavefronts, and mobile responsiveness.

## User Personas
- Physics students learning wave optics
- Teachers demonstrating YDSE in classrooms
- Self-learners exploring interference and diffraction

## Core Requirements (Static)
- 2D experiment canvas with laser, slit barrier, wavefronts, screen
- Intensity I(y) graph with diffraction envelope
- Sliders: wavelength (380-750nm), slit width (0.01-0.5mm), slit separation (0.1-3.0mm), screen distance (0.5-3.0m)
- Drag interactions: laser angle, slit separation, slit width, barrier/screen distance
- Wavefront toggle, reset button
- Mobile responsive with touch support
- Physics: I(y) = I0 * sinc²(β) * cos²(φ) with oblique incidence support

## Architecture
- React frontend with HTML5 Canvas rendering (no backend needed)
- Two canvas elements: experiment view + intensity graph
- Physics engine in utils/physics.js
- State management via useYDSE hook
- Custom CSS range sliders with neon glow aesthetic

## What's Been Implemented (Feb 2026)
- [x] Full experiment canvas with laser, beams, slit barrier, screen
- [x] Huygens wavefront visualization with constructive interference highlighting
- [x] Screen fringe pattern rendering
- [x] Real-time intensity graph with diffraction envelope (dashed)
- [x] All 4 parameter sliders with live readouts
- [x] Wavelength-to-RGB color mapping
- [x] Wavefront toggle switch
- [x] Reset button
- [x] Fringe width readout
- [x] Mobile responsive layout (stacked on mobile, side-by-side on desktop)
- [x] Dark theme with cyan neon accents (oscilloscope aesthetic)
- [x] Touch event support
- [x] Animated laser beam pulse

## Prioritized Backlog
### P0 (Done)
- All core features implemented and tested

### P1
- Canvas drag interactions for laser, slits, barrier, screen (partially implemented)
- Fringe tooltip on screen hover showing order number

### P2
- Off-screen canvas for wavefront calculation optimization
- Export simulation state / share URL
- Preset experiment configurations
- Info tooltips explaining physics concepts
