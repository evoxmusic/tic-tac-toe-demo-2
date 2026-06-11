/**
 * Matrix digital rain background effect.
 * Renders an animated canvas of falling glyphs behind the app.
 * Respects prefers-reduced-motion by drawing a single static frame.
 */
const Matrix = (() => {
  const canvas = document.getElementById('matrix-bg');
  if (!canvas) return {};

  const ctx = canvas.getContext('2d');

  // Katakana + latin digits/letters — the classic "rain" alphabet.
  const CHARS =
    'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const FONT_SIZE = 16;
  const HEAD_COLOR = '#c8ffd6';   // bright leading glyph
  const TRAIL_COLOR = '#00ff66';  // green trail
  const FRAME_INTERVAL = 1000 / 20; // ~20fps for the stepped, retro cadence

  let width = 0;
  let height = 0;
  let drops = [];        // current row (in glyph units) per column
  let rafId = null;
  let lastTime = 0;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    const columns = Math.ceil(width / FONT_SIZE);

    // Preserve existing drop positions on resize; seed new columns at random
    // heights so the rain doesn't restart in a flat line.
    const next = new Array(columns);
    for (let i = 0; i < columns; i++) {
      next[i] = drops[i] !== undefined
        ? drops[i]
        : Math.floor((Math.random() * -height) / FONT_SIZE);
    }
    drops = next;

    ctx.font = `${FONT_SIZE}px monospace`;
    ctx.textBaseline = 'top';
  }

  function draw() {
    // Translucent fill leaves a fading trail behind each glyph.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < drops.length; i++) {
      const char = CHARS[Math.floor(Math.random() * CHARS.length)];
      const x = i * FONT_SIZE;
      const y = drops[i] * FONT_SIZE;

      ctx.fillStyle = HEAD_COLOR;
      ctx.fillText(char, x, y);
      // A dimmer glyph just above the head reinforces the trail.
      ctx.fillStyle = TRAIL_COLOR;
      ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, y - FONT_SIZE);

      // Reset the column to the top once it falls off-screen (randomized so
      // columns desynchronize over time).
      if (y > height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  function loop(time) {
    rafId = requestAnimationFrame(loop);
    if (time - lastTime < FRAME_INTERVAL) return;
    lastTime = time;
    draw();
  }

  function start() {
    if (rafId === null) {
      rafId = requestAnimationFrame(loop);
    }
  }

  function drawStaticFrame() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = TRAIL_COLOR;
    for (let i = 0; i < drops.length; i++) {
      const char = CHARS[Math.floor(Math.random() * CHARS.length)];
      ctx.fillText(char, i * FONT_SIZE, ((i * 7) % 40) * FONT_SIZE);
    }
  }

  window.addEventListener('resize', resize);
  resize();

  const reduceMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    drawStaticFrame();
  } else {
    start();
  }

  return { start, resize };
})();
