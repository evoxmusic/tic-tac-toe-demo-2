/**
 * Live "Matrix" digital-rain background effect.
 * Renders falling glyph columns onto a full-screen canvas behind the UI.
 * Honors prefers-reduced-motion by drawing a single static frame.
 */
const Matrix = (() => {
  const canvas = document.getElementById('matrix-bg');
  if (!canvas) return {};
  const ctx = canvas.getContext('2d');

  // Glyphs: katakana + latin + digits for the classic cascade look.
  const GLYPHS =
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ' +
    'マミムメモヤユヨラリルレロワヲン0123456789ABCDEFXO';
  const FONT_SIZE = 16;
  const TRAIL_ALPHA = 0.06; // lower = longer trails
  const HEAD_COLOR = '#cfffcf';
  const BODY_COLOR = '#22dd55';

  let columns = 0;
  let drops = [];
  let rafId = null;

  const reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  /**
   * Resize the canvas to the viewport and recompute columns.
   */
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.ceil(canvas.width / FONT_SIZE);
    // Start each column at a random height so the rain looks staggered.
    drops = Array.from({ length: columns }, () =>
      Math.floor((Math.random() * canvas.height) / FONT_SIZE)
    );
    // Clear to black after a resize to avoid stretched artifacts.
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Draw a single animation frame of falling glyphs.
   */
  function draw() {
    // Translucent black fill creates the fading trail behind each glyph.
    ctx.fillStyle = `rgba(0, 0, 0, ${TRAIL_ALPHA})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${FONT_SIZE}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const char = GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
      const x = i * FONT_SIZE;
      const y = drops[i] * FONT_SIZE;

      // Bright leading glyph, dimmer green for the rest of the stream.
      ctx.fillStyle = Math.random() > 0.975 ? HEAD_COLOR : BODY_COLOR;
      ctx.fillText(char, x, y);

      // Reset the column once it falls past the bottom (randomized).
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  let last = 0;
  const FRAME_INTERVAL = 50; // ~20fps is plenty for the rain and easy on the CPU

  /**
   * Animation loop, throttled to FRAME_INTERVAL.
   */
  function loop(now) {
    rafId = window.requestAnimationFrame(loop);
    if (now - last < FRAME_INTERVAL) return;
    last = now;
    draw();
  }

  /**
   * Start (or restart) the effect.
   */
  function start() {
    if (rafId !== null) window.cancelAnimationFrame(rafId);
    resize();
    if (reduceMotion.matches) {
      draw(); // single static frame, no animation
      return;
    }
    rafId = window.requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  if (typeof reduceMotion.addEventListener === 'function') {
    reduceMotion.addEventListener('change', start);
  }

  start();

  return { start };
})();
