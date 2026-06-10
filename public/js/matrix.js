/**
 * Matrix Rain Background
 * Renders a live "digital rain" effect (à la The Matrix) on a full-screen
 * canvas that sits behind the app. Self-contained, dependency-free, and
 * pauses automatically when the tab is hidden to save resources.
 */
(() => {
  const canvas = document.getElementById('matrix-bg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Katakana, Latin and digits — the classic Matrix glyph set.
  const GLYPHS =
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const FONT_SIZE = 16;
  const FADE = 'rgba(10, 10, 16, 0.08)'; // trailing fade per frame
  const HEAD_COLOR = '#cfffcf';          // bright leading character
  const TAIL_COLOR = '#00ff66';          // green trail

  let columns = 0;
  let drops = []; // y position (in rows) of the leading glyph per column
  let rafId = null;
  let lastTime = 0;
  const STEP_MS = 1000 / 24; // advance the rain at ~24 fps

  function resize() {
    // Account for device pixel ratio so glyphs stay crisp on HiDPI screens.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    columns = Math.ceil(window.innerWidth / FONT_SIZE);
    drops = new Array(columns);
    for (let i = 0; i < columns; i++) {
      // Stagger starting positions so the rain doesn't fall in a straight line.
      drops[i] = Math.floor(Math.random() * -50);
    }
  }

  function randomGlyph() {
    return GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
  }

  function draw() {
    // Translucent overlay creates the fading trail behind each glyph.
    ctx.fillStyle = FADE;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.font = `${FONT_SIZE}px monospace`;
    ctx.textBaseline = 'top';

    for (let i = 0; i < columns; i++) {
      const x = i * FONT_SIZE;
      const y = drops[i] * FONT_SIZE;
      const glyph = randomGlyph();

      if (y >= 0) {
        ctx.fillStyle = HEAD_COLOR;
        ctx.fillText(glyph, x, y);
        // A dimmer character just above the head reinforces the trail.
        ctx.fillStyle = TAIL_COLOR;
        ctx.fillText(randomGlyph(), x, y - FONT_SIZE);
      }

      // Reset the column to the top once it falls off-screen, at random,
      // so the streams desynchronise over time.
      if (y > window.innerHeight && Math.random() > 0.975) {
        drops[i] = 0;
      } else {
        drops[i]++;
      }
    }
  }

  function loop(time) {
    rafId = window.requestAnimationFrame(loop);
    if (time - lastTime < STEP_MS) return;
    lastTime = time;
    draw();
  }

  function start() {
    if (rafId === null) {
      lastTime = 0;
      rafId = window.requestAnimationFrame(loop);
    }
  }

  function stop() {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  resize();
  start();
})();
