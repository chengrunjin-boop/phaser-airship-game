// src/airship/HullTexture.js
export function makeEllipseCylinderHullTexture(scene, key, w, h, opts = {}) {
  const {
    tailFrac = 0.28, midFrac = 0.44, noseFrac = 0.28,
    color = 0xffffff, outline = 0x000000, strokePx = 2,
    ribCount = 3, ribColor = 0x000000, ribWidthPx = 1, ribAlpha = 0.18, ribInnerFrac = 1,
    tailSharpness = 1.0, noseSharpness = 1.0,
    // existing optional fins config (unchanged)
    fins = {},
    // NEW (optional): landing gear visuals (array of { xFrac, strutLen, strutW, wheelR })
    landingGear = []
  } = opts;

  // Extra canvas height: keep existing gondola space, and add space for landing gear if provided
  const gearExtra = landingGear.length > 0
    ? Math.max(
        ...landingGear.map(s => {
          const strutLen = s.strutLen ?? 30;
          const wheelR   = s.wheelR   ?? 14;
          const margin   = strokePx + 4; // a bit of breathing room
          return strutLen + wheelR * 2 + margin;
        })
      )
    : 0;

  const gondolaExtra = opts.gondola ? (opts.gondola.offsetY + opts.gondola.height + 4) : 0;
  const extraH = Math.max(gondolaExtra, gearExtra);
  const fullH = h + extraH; // final texture height (adds space *below* the hull only)

  const sum = Math.max(0.001, tailFrac + midFrac + noseFrac);
  const tailW = (w * tailFrac) / sum;
  const midW  = (w * midFrac)  / sum;
  const noseW = (w * noseFrac) / sum;

  const seamTail = tailW;
  const seamNose = tailW + midW;
  const cY       = h / 2; // hull center stays in the top h pixels
  const bPad     = Math.max(1, strokePx + 1);
  const b        = (h / 2) - bPad;

  const N = 64, powT = tailSharpness * 0.5, powN = noseSharpness * 0.5;
  const halfAt = (x) => {
    if (x <= seamTail) {
      const dx = x - seamTail, u = 1 - (dx*dx)/(tailW*tailW);
      return u > 0 ? b * Math.pow(u, powT) : 0;
    } else if (x < seamNose) {
      return b;
    } else {
      const dx = x - seamNose, u = 1 - (dx*dx)/(noseW*noseW);
      return u > 0 ? b * Math.pow(u, powN) : 0;
    }
  };

  // --- helper: draw a trapezoid fin (unchanged) ---
  const drawFinTrapezoid = (g, {
    xAttach, side, basePx, heightPx, topPx,
    finColor, finOutline, finAlpha,
    rotationDeg = -10
  }) => {
    rotationDeg = -1 * rotationDeg; // invert for y-down coord
    const yHull = cY + (side === 'top' ? -halfAt(xAttach) : halfAt(xAttach));
    const anchor = new Phaser.Math.Vector2(xAttach, yHull);

    // base edge at hull
    const halfBase = basePx / 2;
    const nearL = new Phaser.Math.Vector2(-halfBase, 0);
    const nearR = new Phaser.Math.Vector2( halfBase, 0);

    // back edge vertical
    const farL = new Phaser.Math.Vector2(nearL.x, side === 'top' ? -heightPx : heightPx);

    // front edge tapered by topPx
    const halfTop = (topPx ?? basePx * 0.7) / 2;
    const farR = new Phaser.Math.Vector2( halfTop, side === 'top' ? -heightPx : heightPx);

    // rotate around anchor
    const angle = Phaser.Math.DegToRad(side === 'top' ? -rotationDeg: rotationDeg);
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const rot = (p) => new Phaser.Math.Vector2(
      anchor.x + p.x * cos - p.y * sin,
      anchor.y + p.x * sin + p.y * cos
    );

    const pL  = rot(nearL);
    const pR  = rot(nearR);
    const pFR = rot(farR);
    const pFL = rot(farL);

    g.fillStyle(finColor, finAlpha);
    g.lineStyle(strokePx, finOutline, finAlpha);
    g.beginPath();
    g.moveTo(pL.x,  pL.y);
    g.lineTo(pR.x,  pR.y);
    g.lineTo(pFR.x, pFR.y);
    g.lineTo(pFL.x, pFL.y);
    g.closePath();
    g.fillPath();
    g.strokePath();
  };

  // Build hull outline (unchanged)
  const top = [], bottom = [];
  for (let i = 0; i <= N; i++) { const x = (i/N)*seamTail; top.push(new Phaser.Math.Vector2(x, cY - halfAt(x))); }
  top.push(new Phaser.Math.Vector2(seamNose, cY - b));
  for (let i = 1; i <= N; i++) { const x = seamNose + (i/N)*(w - seamNose); top.push(new Phaser.Math.Vector2(x, cY - halfAt(x))); }
  for (let i = 0; i <= N; i++) { const x = w - (i/N)*(w - seamNose); bottom.push(new Phaser.Math.Vector2(x, cY + halfAt(x))); }
  bottom.push(new Phaser.Math.Vector2(seamTail, cY + b));
  for (let i = 0; i <= N; i++) { const x = seamTail - (i/N)*seamTail; bottom.push(new Phaser.Math.Vector2(x, cY + halfAt(x))); }
  const outerPoly = top.concat(bottom);

  const g = scene.add.graphics();

  // Hull fill (unchanged)
  g.fillStyle(color, 1).lineStyle(strokePx, outline, 1);
  g.beginPath(); g.moveTo(outerPoly[0].x, outerPoly[0].y);
  for (let i = 1; i < outerPoly.length; i++) g.lineTo(outerPoly[i].x, outerPoly[i].y);
  g.closePath(); g.fillPath(); g.strokePath();

  // Fins (unchanged)
  const tailCfg = fins.tail || {};
  const finDefaults = (cfg) => ({
    basePx:   cfg.basePx   ?? 26,
    topPx:    cfg.topPx    ?? (cfg.basePx * 0.7),
    heightPx: cfg.heightPx ?? 10,
    rotationDeg: cfg.rotationDeg ?? -10,
    color:    cfg.color    ?? color,
    outline:  cfg.outline  ?? outline,
    alpha:    cfg.alpha    ?? 1.0
  });
  if (tailCfg.top || tailCfg.bottom) {
    const { basePx, topPx, heightPx, rotationDeg, color: finColor, outline: finOutline, alpha: finAlpha } = finDefaults(tailCfg);
    const xTailAttach = seamTail * 0.3;
    if (tailCfg.top) {
      drawFinTrapezoid(g, { xAttach: xTailAttach, side: 'top', basePx, topPx, heightPx, finColor, finOutline, finAlpha, rotationDeg });
    }
    if (tailCfg.bottom) {
      drawFinTrapezoid(g, { xAttach: xTailAttach, side: 'bottom', basePx, topPx, heightPx, finColor, finOutline, finAlpha, rotationDeg });
    }
  }
// --- Landing gear visuals (static) ---
if (landingGear && landingGear.length) {
  landingGear.forEach(s => {
    const xFrac     = s.xFrac     ?? 0.6;
    const strutLen  = s.strutLen  ?? 30;
    const strutW    = s.strutW    ?? 6;
    const wheelR    = s.wheelR    ?? 14;
    const bracePx   = s.bracePx   ?? 4;        // thickness of the two bars
    const topFrac   = s.triangleTopFrac ?? 0.3; // 0 (hull) .. 1 (bottom). 0.5 = halfway down
    const topOffset = s.topOffset ?? 3; // vertical offset for top of strut (to meet hull contour better)
    const triangleScale  = s.triangleScale  ?? 0;       // controls size of triangle bars
    
    const gx = xFrac * w;           // across hull width
    
    const gyHullBottom = h- topOffset;         // bottom of hull in texture space
    const gyWheel = gyHullBottom + strutLen + wheelR;

    // STRUT: white with thin black outline (vertical)
    g.fillStyle(0xffffff, 1);
    g.fillRect(gx - strutW / 2, gyHullBottom, strutW, strutLen);
    g.lineStyle(1, outline ?? 0x000000, 0.9);
    g.strokeRect(gx - strutW / 2, gyHullBottom, strutW, strutLen);

    // WHEEL: black with thin black outline
    g.fillStyle(0x000000, 1);
    g.fillCircle(gx, gyWheel, wheelR);
    g.lineStyle(1, outline ?? 0x000000, 0.9);
    g.strokeCircle(gx, gyWheel, wheelR);

    // --- TRIANGLE BARS (scaled by topFrac) ---
    // Normalized y-units: 0..2 spans the entire strut length.
    const scale = strutLen / 2;

    // bottom of strut (1,2)
    const pBottomX = gx;
    const pBottomY = gyHullBottom + 2 * scale;

    // apex on strut at y = 2*topFrac  (e.g., 0.5 -> halfway down)
    const pApexX = gx;
    const pApexY = gyHullBottom + (2 * topFrac) * scale;

    // left meeting point at y = 1 + topFrac  (scales with topFrac)
    // x stays one "unit" left of strut center (i.e., -scale)
    const pLeftX = gx - scale + triangleScale;
    const pLeftY = gyHullBottom + (1 + topFrac) * scale;

    // bar1: bottom -> left
    g.lineStyle(bracePx, 0xffffff, 1);
    g.beginPath(); g.moveTo(pBottomX, pBottomY); g.lineTo(pLeftX, pLeftY); g.strokePath();
    g.lineStyle(2, outline ?? 0x000000, 0.9);
    g.beginPath(); g.moveTo(pBottomX, pBottomY); g.lineTo(pLeftX, pLeftY); g.strokePath();

    // bar2: left -> apex
    g.lineStyle(bracePx, 0xffffff, 1);
    g.beginPath(); g.moveTo(pLeftX, pLeftY); g.lineTo(pApexX, pApexY); g.strokePath();
    g.lineStyle(2, outline ?? 0x000000, 0.9);
    g.beginPath(); g.moveTo(pLeftX, pLeftY); g.lineTo(pApexX, pApexY); g.strokePath();
  });
}


  // Gondola (unchanged)
  if (opts.gondola) {
    const gOpt = opts.gondola;
    const gx = w / 1.4;
    const gy = cY + b + gOpt.offsetY;
    const halfW = gOpt.width / 2, hG = gOpt.height;
    const skew = gOpt.skewX;
    const gondolastrokePx = strokePx;
    const r = gOpt.cornerRadius ?? 4;

    // corners
    const p1 = new Phaser.Math.Vector2(gx - halfW, gy);             // top-left
    const p2 = new Phaser.Math.Vector2(gx + halfW, gy);             // top-right
    const p3 = new Phaser.Math.Vector2(gx + halfW + skew, gy + hG); // bottom-right
    const p4 = new Phaser.Math.Vector2(gx - halfW + skew, gy + hG); // bottom-left

    g.fillStyle(gOpt.color ?? color, 1);
    g.lineStyle(gondolastrokePx, gOpt.outline ?? outline, 1);

    g.beginPath();
    g.moveTo(p1.x, p1.y);
    g.lineTo(p2.x, p2.y);

    // rounded bottom-right corner
    g.lineTo(p3.x-5, p3.y-r);
    g.arc(p3.x-r, p3.y, r, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(90), false);

    // bottom edge to bottom-left
    g.lineTo(p4.x + r, p4.y+r);

    // rounded bottom-left corner
    g.arc(p4.x + r, p4.y, r, Phaser.Math.DegToRad(90), Phaser.Math.DegToRad(160), false);

    g.lineTo(p1.x, p1.y);
    g.closePath();
    g.fillPath();
    g.strokePath();

    // windows
    const wCount = gOpt.windowCount, wSize = gOpt.windowSize, spacing = gOpt.windowSpacing;
    const startX = gx - ((wCount - 1) / 2) * spacing + skew / 2 + 5;
    for (let i = 0; i < wCount; i++) {
      const wx = startX + i * spacing;
      const wy = gy + hG / 1.8;
      g.fillStyle(gOpt.windowColor, 1);
      g.fillRect(wx - wSize / 2 , wy - wSize / 2, wSize+3, wSize);
      g.lineStyle(1, gOpt.outline ?? outline, 1);
      g.strokeRect(wx - wSize / 2, wy - wSize / 2, wSize+3, wSize);
    }
  }



  // Ribs (unchanged)
  if (ribCount > 0) {
    for (let k = 1; k <= ribCount; k++) {
      const bInner = b * (1 - (k/(ribCount+1))*ribInnerFrac);
      if (bInner <= 0) continue;
      const rTop = [], rBot = [];
      for (let i = 0; i <= N; i++) { const x = (i/N)*seamTail; const dx = x - seamTail; const u = 1 - (dx*dx)/(tailW*tailW); const dy = u>0 ? bInner*Math.pow(u,powT) : 0; rTop.push(new Phaser.Math.Vector2(x, cY - dy)); }
      rTop.push(new Phaser.Math.Vector2(seamNose, cY - bInner));
      for (let i = 1; i <= N; i++) { const x = seamNose + (i/N)*(w - seamNose); const dx = x - seamNose; const u = 1 - (dx*dx)/(noseW*noseW); const dy = u>0 ? bInner*Math.pow(u,powN) : 0; rTop.push(new Phaser.Math.Vector2(x, cY - dy)); }
      for (let i = 0; i <= N; i++) { const x = w - (i/N)*(w - seamNose); const dx = x - seamNose; const u = 1 - (dx*dx)/(noseW*noseW); const dy = u>0 ? bInner*Math.pow(u,powN) : 0; rBot.push(new Phaser.Math.Vector2(x, cY + dy)); }
      rBot.push(new Phaser.Math.Vector2(seamTail, cY + bInner));
      for (let i = 0; i <= N; i++) { const x = seamTail - (i/N)*seamTail; const dx = x - seamTail; const u = 1 - (dx*dx)/(tailW*tailW); const dy = u>0 ? bInner*Math.pow(u,powT) : 0; rBot.push(new Phaser.Math.Vector2(x, cY + dy)); }
      const ribPoly = rTop.concat(rBot);
      g.lineStyle(ribWidthPx, ribColor, ribAlpha);
      g.beginPath();
      g.moveTo(ribPoly[0].x, ribPoly[0].y);
      for (let i = 1; i < ribPoly.length; i++) g.lineTo(ribPoly[i].x, ribPoly[i].y);
      g.closePath(); g.strokePath();
    }
  }

  // Midline (unchanged)
  g.lineStyle(ribWidthPx, ribColor, ribAlpha);
  g.beginPath();
  g.moveTo(0, cY);
  g.lineTo(w, cY);
  g.strokePath();

  // Use fullH so gear/gondola aren’t cropped
  g.generateTexture(key, w, fullH);
  g.destroy();
}
