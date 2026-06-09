/**
 * Live "Matrix" digital-rain background effect.
 * Renders falling glyphs onto a full-screen canvas that sits behind the app.
 * Respects prefers-reduced-motion: paints a single static frame instead of
 * animating when the user asks for reduced motion.
 */
(function () {
  const canvas = document.getElementById('matrix-bg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Katakana + Latin digits + a few symbols, the classic rain alphabet.
  const GLYPHS =
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ0123456789:.=*+-<>¦'.split('');
  const FONT_SIZE = 16;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let columns = 0;
  let drops = [];

  function randomGlyph() {
    return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }

  function resize() {
    // Match the canvas drawing buffer to the viewport (handles HiDPI cheaply
    // by drawing at CSS-pixel resolution; the rain looks intentionally crisp).
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.max(1, Math.floor(canvas.width / FONT_SIZE));

    // Seed each column above the top edge at a random offset so streams are
    // staggered rather than starting in a single horizontal line.
    drops = new Array(columns)
      .fill(0)
      .map(() => Math.floor((Math.random() * -canvas.height) / FONT_SIZE));

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = FONT_SIZE + 'px monospace';
  }

  function draw() {
    // Translucent black overlay creates the trailing fade behind each glyph.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = FONT_SIZE + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
      const x = i * FONT_SIZE;
      const y = drops[i] * FONT_SIZE;

      // The leading character is brighter (almost white) for a glowing head.
      ctx.fillStyle = Math.random() > 0.975 ? '#cfffd0' : '#00ff66';
      ctx.fillText(randomGlyph(), x, y);

      // Once a stream passes the bottom, randomly recycle it back to the top.
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  // Throttle the animation to a steady cadence independent of refresh rate.
  const FRAME_INTERVAL = 50; // ms between frames (~20fps), the classic look
  let last = 0;

  function loop(timestamp) {
    if (timestamp - last >= FRAME_INTERVAL) {
      last = timestamp;
      draw();
    }
    requestAnimationFrame(loop);
  }

  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(resize);
  });

  resize();

  if (reduceMotion) {
    draw(); // single static frame, no animation
  } else {
    requestAnimationFrame(loop);
  }
})();
