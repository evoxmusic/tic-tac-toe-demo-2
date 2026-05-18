/**
 * Board rendering and interaction module
 */
const Board = (() => {
  const boardEl = document.getElementById('board');
  const cells = boardEl.querySelectorAll('.cell');
  const winLineEl = document.getElementById('win-line');
  const winLine = winLineEl.querySelector('line');

  let onCellClick = null;

  // Initialize click handlers
  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      const index = parseInt(cell.dataset.index);
      if (onCellClick) onCellClick(index);
    });
  });

  /**
   * Set the click callback
   */
  function setClickHandler(handler) {
    onCellClick = handler;
  }

  /**
   * Render a single cell
   */
  function setCell(index, mark) {
    const cell = cells[index];
    cell.textContent = mark;
    cell.classList.add('taken', mark.toLowerCase());
  }

  /**
   * Clear the board
   */
  function clear() {
    cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'cell';
    });
    winLineEl.classList.remove('show');
    winLine.setAttribute('x1', 0);
    winLine.setAttribute('y1', 0);
    winLine.setAttribute('x2', 0);
    winLine.setAttribute('y2', 0);
  }

  /**
   * Disable all cells
   */
  function disable() {
    cells.forEach(c => c.classList.add('disabled'));
  }

  /**
   * Enable empty cells
   */
  function enable() {
    cells.forEach(c => {
      if (!c.classList.contains('taken')) {
        c.classList.remove('disabled');
      }
    });
  }

  /**
   * Highlight winning cells and draw win line
   */
  function showWin(combo) {
    combo.forEach(i => cells[i].classList.add('win-cell'));

    // Calculate line coordinates
    // Each cell is 96px with 6px gap, within a 6px padding
    const cellSize = 96;
    const gap = 6;
    const getCenter = (idx) => {
      const row = Math.floor(idx / 3);
      const col = idx % 3;
      const x = col * (cellSize + gap) + cellSize / 2;
      const y = row * (cellSize + gap) + cellSize / 2;
      return { x, y };
    };

    const start = getCenter(combo[0]);
    const end = getCenter(combo[2]);

    winLine.setAttribute('x1', start.x);
    winLine.setAttribute('y1', start.y);
    winLine.setAttribute('x2', end.x);
    winLine.setAttribute('y2', end.y);

    // Trigger animation
    requestAnimationFrame(() => {
      winLineEl.classList.add('show');
    });
  }

  return { setClickHandler, setCell, clear, disable, enable, showWin };
})();
