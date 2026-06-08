/**
 * Matrix Rain Background
 * Renders a live "digital rain" effect on a full-screen canvas that sits
 * behind the app UI. Self-contained: attaches to #matrix-bg and starts on load.
 *
 * Behaviour notes:
 *   - Honours `prefers-reduced-motion`: paints a single static frame instead
 *     of animating.
 *   - Pauses the animation loop while the tab is hidden to save CPU/battery.
 *   - Resizes with the viewport (debounced) so columns always fill the screen.
 */
(() => {
  const canvas = document.getElementById('matrix-bg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // ===== CONFIG =====
  const FONT_SIZE = 16;                 // glyph size in px (also column width)
  const TRAIL_FADE = 'rgba(8, 10, 12, 0.08)'; // translucent paint => fading trail
  const HEAD_COLOR = '#d6ffe0';         // bright leading glyph
  const TRAIL_COLOR = '#00ff5f';        // classic matrix green
  const FRAME_INTERVAL = 1000 / 24;     // throttle to ~24fps for the rain look
  // Katakana + latin digits/letters, mirroring the iconic look.
  const GLYPHS =
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ' +
    'マミムメモヤユヨラリルレロワヲン0123456789ABCDEFZ:.=*+-<>¦';

  // ===== STATE =====
  let width = 0;
  let height = 0;
  let columns = 0;
  let drops = [];          // y position (in rows) of each column's leading glyph
  let animationId = null;
  let lastFrame = 0;

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function randomGlyph() {
    return GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    columns = Math.ceil(width / FONT_SIZE);

    // Seed each column at a random negative-ish offset so streams are staggered.
    drops = new Array(columns)
      .fill(0)
      .map(() => Math.floor((Math.random() * -height) / FONT_SIZE));

    // Repaint an opaque base so resizing never leaves stale pixels behind.
    ctx.fillStyle = '#080a0c';
    ctx.fillRect(0, 0, width, height);
  }

  function drawFrame() {
    // Translucent fill leaves faint trails behind each falling glyph.
    ctx.fillStyle = TRAIL_FADE;
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${FONT_SIZE}px monospace`;
    ctx.textBaseline = 'top';

    for (let i = 0; i < columns; i++) {
      const x = i * FONT_SIZE;
      const y = drops[i] * FONT_SIZE;
      const glyph = randomGlyph();

      // Bright "head" glyph, then a green trail underneath it.
      ctx.fillStyle = HEAD_COLOR;
      ctx.fillText(glyph, x, y);
      ctx.fillStyle = TRAIL_COLOR;
      ctx.fillText(randomGlyph(), x, y - FONT_SIZE);

      // Once a stream passes the bottom, randomly reset it to the top.
      if (y > height && Math.random() > 0.975) {
        drops[i] = 0;
      } else {
        drops[i]++;
      }
    }
  }

  function loop(timestamp) {
    animationId = window.requestAnimationFrame(loop);
    if (timestamp - lastFrame < FRAME_INTERVAL) return;
    lastFrame = timestamp;
    drawFrame();
  }

  function start() {
    if (animationId !== null) return;
    lastFrame = 0;
    animationId = window.requestAnimationFrame(loop);
  }

  function stop() {
    if (animationId === null) return;
    window.cancelAnimationFrame(animationId);
    animationId = null;
  }

  // ===== INIT =====
  resize();

  // Debounce resize so rapid drags don't thrash the canvas.
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 150);
  });

  if (prefersReducedMotion) {
    // Static single frame — no motion for users who opt out of animation.
    drawFrame();
    return;
  }

  // Pause while hidden, resume when visible again.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  start();
})();
