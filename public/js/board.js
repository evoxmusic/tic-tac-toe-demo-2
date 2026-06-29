/**
 * Board rendering and interaction module.
 * The grid is built dynamically so it can host any square board size.
 */
const Board = (() => {
  const boardEl = document.getElementById('board');
  const winLineEl = document.getElementById('win-line');
  const winLine = winLineEl.querySelector('line');

  let cells = [];
  let onCellClick = null;

  /**
   * Set the click callback
   */
  function setClickHandler(handler) {
    onCellClick = handler;
  }

  /**
   * Build a `size` x `size` grid of cells, replacing any existing board.
   */
  function init(size) {
    boardEl.innerHTML = '';
    boardEl.dataset.size = size;
    boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    cells = [];

    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = i;
      cell.addEventListener('click', () => {
        const index = parseInt(cell.dataset.index, 10);
        if (onCellClick) onCellClick(index);
      });
      boardEl.appendChild(cell);
      cells.push(cell);
    }

    clear();
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
   * Highlight winning cells and draw the win line from the first to the last
   * cell of the combo. Coordinates are read from the live layout so the line
   * is correct for any board size or responsive cell size.
   */
  function showWin(combo) {
    combo.forEach(i => cells[i].classList.add('win-cell'));

    const boardRect = boardEl.getBoundingClientRect();
    const center = (idx) => {
      const r = cells[idx].getBoundingClientRect();
      return {
        x: r.left - boardRect.left + r.width / 2,
        y: r.top - boardRect.top + r.height / 2,
      };
    };

    const start = center(combo[0]);
    const end = center(combo[combo.length - 1]);

    winLineEl.setAttribute('viewBox', `0 0 ${boardRect.width} ${boardRect.height}`);
    winLine.setAttribute('x1', start.x);
    winLine.setAttribute('y1', start.y);
    winLine.setAttribute('x2', end.x);
    winLine.setAttribute('y2', end.y);

    // Trigger animation
    requestAnimationFrame(() => {
      winLineEl.classList.add('show');
    });
  }

  return { setClickHandler, init, setCell, clear, disable, enable, showWin };
})();
