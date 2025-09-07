export function computeHullGeom(w, h, opts) {
  const {
    tailFrac, midFrac, noseFrac,
    strokePx = 2, tailSharpness = 1.0, noseSharpness = 1.0
  } = opts;

  const sum = Math.max(0.001, tailFrac + midFrac + noseFrac);
  const tailW = (w * tailFrac) / sum;
  const midW  = (w * midFrac)  / sum;
  const noseW = (w * noseFrac) / sum;

  const seamTail = tailW;
  const seamNose = tailW + midW;

  const bPad = Math.max(1, strokePx + 1);
  const b    = (h / 2) - bPad;

  return { w, h, b, tailW, midW, noseW, seamTail, seamNose, tailSharpness, noseSharpness };
}

export function hullHalfHeightAt(x, G) {
  const { w, b, seamTail, seamNose, tailW, noseW, tailSharpness, noseSharpness } = G;
  if (x <= seamTail) {
    const dx = x - seamTail; const u = 1 - (dx*dx)/(tailW*tailW);
    return u > 0 ? b * Math.pow(u, tailSharpness * 0.5) : 0;
  } else if (x < seamNose) {
    return b;
  } else if (x <= w) {
    const dx = x - seamNose; const u = 1 - (dx*dx)/(noseW*noseW);
    return u > 0 ? b * Math.pow(u, noseSharpness * 0.5) : 0;
  }
  return 0;
}
