/**
 * Matrix Digital Rain
 * Renders a live "falling characters" effect on a full-screen canvas that sits
 * behind the app content. Designed to be self-contained: it has no dependencies
 * and degrades gracefully when the canvas or 2D context is unavailable, or when
 * the user prefers reduced motion.
 */
(() => {
  const canvas = document.getElementById('matrix-bg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Katakana + latin digits/letters give the classic Matrix glyph soup.
  const GLYPHS =
    'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエ0123456789ABCDEFZ'.split('');
  const FONT_SIZE = 16;
  const FADE = 'rgba(0, 0, 0, 0.07)'; // trailing fade applied each frame
  const HEAD_COLOR = '#cfffe0';       // bright leading glyph
  const TAIL_COLOR = '#00ff66';       // classic green trail
  const FRAME_INTERVAL = 50;          // ms between rain updates (~20fps)

  let columns = 0;
  let drops = [];     // current row (in glyph units) per column
  let lastFrame = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.ceil(canvas.width / FONT_SIZE);

    const next = [];
    for (let i = 0; i < columns; i++) {
      // Preserve existing drop positions on resize; seed new columns randomly
      // above the viewport so the rain doesn't all start from the same line.
      next[i] = drops[i] !== undefined
        ? drops[i]
        : Math.floor((Math.random() * -canvas.height) / FONT_SIZE);
    }
    drops = next;

    // Paint solid black immediately so there's never a flash of empty canvas.
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawFrame() {
    // Translucent black overlay fades prior glyphs, producing the trailing look.
    ctx.fillStyle = FADE;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${FONT_SIZE}px monospace`;
    ctx.textBaseline = 'top';

    for (let i = 0; i < columns; i++) {
      const glyph = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      const x = i * FONT_SIZE;
      const y = drops[i] * FONT_SIZE;

      // Only the leading glyph of each falling stream is highlighted.
      ctx.fillStyle = y >= 0 && Math.random() > 0.85 ? HEAD_COLOR : TAIL_COLOR;
      ctx.fillText(glyph, x, y);

      // Once a stream passes the bottom, randomly recycle it to the top.
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      } else {
        drops[i]++;
      }
    }
  }

  function loop(timestamp) {
    if (timestamp - lastFrame >= FRAME_INTERVAL) {
      lastFrame = timestamp;
      drawFrame();
    }
    requestAnimationFrame(loop);
  }

  const reducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.addEventListener('resize', resize);
  resize();

  if (reducedMotion) {
    // Honor the user's preference: render a single static frame, no animation.
    drawFrame();
  } else {
    requestAnimationFrame(loop);
  }
})();
