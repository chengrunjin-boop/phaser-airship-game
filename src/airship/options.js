// src/airship/options.js
const hullOptions = {
  tailFrac: 0.30,
  midFrac:  0.50,
  noseFrac: 0.20,
  color:    0xffffff,
  outline:  0x000000,
  strokePx: 2,

  // ribs (visual)
  ribCount: 4,
  ribColor: 0x000000,
  ribWidthPx: 1,
  ribAlpha: 0.10,
  ribInnerFrac: 1,

  // shaping
  tailSharpness: 1.5,
  noseSharpness: 1.3,

  // fin controls
  fins: {
    tail: {
      top: true, bottom: true,
      basePx: 40,
      topPx: 5,        // controls far (top) edge length
      heightPx: 20,
      rotationDeg: -18  , // rotate whole trapezoid
      color: 0xffffff,
      outline: 0x000000,
      alpha: 1.0
    }
  },

gondola: {
  width: 60,
  height: 13,
  offsetY: 0 ,   // distance below hull bottom
  skewX: 10,
  color: 0xFFFFFF,   // same as hull
  outline: 0x000000, // same as hull outline
  windowCount: 4,
  windowSize: 5,
  windowSpacing: 12,
  windowColor: 0x87ceeb
},

landingGear: [
  { xFrac: 0.25, strutLen: 10, strutW: 3, wheelR: 2 ,triangleScale: -1},
  { xFrac: 0.76, strutLen: 27, strutW: 3, wheelR: 2 ,triangleTopFrac: 0.7, topOffset: 3, triangleScale: 6},
]




};

export default hullOptions;
