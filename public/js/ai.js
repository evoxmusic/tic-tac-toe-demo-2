/**
 * AI module for Tic Tac Toe
 * Supports three difficulty levels (easy, medium, hard) on any square board.
 *
 * The board is a flat array of length size*size. A "config" object describes
 * the active game:
 *   { size, winLength, combos, aiMark, humanMark }
 * where `combos` is the list of winning lines produced by buildCombos().
 */
const AI = (() => {
  /**
   * Build every winning line (length `winLength`) for a `size` x `size` board.
   * Covers horizontals, verticals and both diagonal directions.
   * @returns {number[][]} array of cell-index combos
   */
  function buildCombos(size, winLength) {
    const combos = [];
    const idx = (row, col) => row * size + col;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        // Horizontal (left to right)
        if (col + winLength <= size) {
          combos.push(line(winLength, k => idx(row, col + k)));
        }
        // Vertical (top to bottom)
        if (row + winLength <= size) {
          combos.push(line(winLength, k => idx(row + k, col)));
        }
        // Diagonal (down-right)
        if (row + winLength <= size && col + winLength <= size) {
          combos.push(line(winLength, k => idx(row + k, col + k)));
        }
        // Diagonal (down-left)
        if (row + winLength <= size && col - winLength + 1 >= 0) {
          combos.push(line(winLength, k => idx(row + k, col - k)));
        }
      }
    }

    return combos;
  }

  function line(length, fn) {
    const result = [];
    for (let k = 0; k < length; k++) result.push(fn(k));
    return result;
  }

  /**
   * Get available (empty) cells
   */
  function getEmpty(board) {
    return board.reduce((acc, val, i) => {
      if (!val) acc.push(i);
      return acc;
    }, []);
  }

  /**
   * Return the winning combo for `player`, or null if there is none.
   */
  function getWinningCombo(board, player, combos) {
    return combos.find(combo => combo.every(i => board[i] === player)) || null;
  }

  /**
   * Check if a player has won
   */
  function checkWin(board, player, combos) {
    return combos.some(combo => combo.every(i => board[i] === player));
  }

  /**
   * Check if board is full
   */
  function isFull(board) {
    return board.every(cell => cell !== null);
  }

  // ===== EASY: Purely random moves =====
  function easyMove(board) {
    const empty = getEmpty(board);
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // ===== MEDIUM: Block wins and take wins, otherwise positional =====
  function mediumMove(board, cfg) {
    const empty = getEmpty(board);
    const { size, combos, aiMark, humanMark } = cfg;

    // 1. Can we win? Take it.
    for (const idx of empty) {
      board[idx] = aiMark;
      if (checkWin(board, aiMark, combos)) {
        board[idx] = null;
        return idx;
      }
      board[idx] = null;
    }

    // 2. Can opponent win? Block it.
    for (const idx of empty) {
      board[idx] = humanMark;
      if (checkWin(board, humanMark, combos)) {
        board[idx] = null;
        return idx;
      }
      board[idx] = null;
    }

    // 3. Take center if the board has one and it's free
    const center = Math.floor((size * size) / 2);
    if (size % 2 === 1 && !board[center]) return center;

    // 4. Take a corner
    const last = size * size - 1;
    const corners = [0, size - 1, size * (size - 1), last].filter(i => !board[i]);
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // 5. Random
    return easyMove(board);
  }

  // ===== HARD: Alpha-beta minimax =====
  // For 3x3 the search is exhaustive (unbeatable). Larger boards have too many
  // states to search fully, so the search is depth-limited and leaf positions
  // are scored with a heuristic that rewards lines close to completion.
  const HEURISTIC_DEPTH = 3;
  const WIN_SCORE = 100000;

  function heuristic(board, cfg) {
    const { combos, aiMark, humanMark } = cfg;
    let score = 0;

    for (const combo of combos) {
      let ai = 0;
      let human = 0;
      for (const i of combo) {
        if (board[i] === aiMark) ai++;
        else if (board[i] === humanMark) human++;
      }
      // A line containing both marks can never be completed by either side.
      if (ai > 0 && human > 0) continue;
      if (ai > 0) score += Math.pow(10, ai);
      else if (human > 0) score -= Math.pow(10, human);
    }

    return score;
  }

  function minimax(board, depth, maxDepth, isMaximizing, alpha, beta, cfg) {
    const { combos, aiMark, humanMark } = cfg;

    if (checkWin(board, aiMark, combos)) return WIN_SCORE - depth;
    if (checkWin(board, humanMark, combos)) return depth - WIN_SCORE;
    if (isFull(board)) return 0;
    if (depth >= maxDepth) return heuristic(board, cfg);

    const empty = getEmpty(board);

    if (isMaximizing) {
      let best = -Infinity;
      for (const idx of empty) {
        board[idx] = aiMark;
        best = Math.max(best, minimax(board, depth + 1, maxDepth, false, alpha, beta, cfg));
        board[idx] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const idx of empty) {
        board[idx] = humanMark;
        best = Math.min(best, minimax(board, depth + 1, maxDepth, true, alpha, beta, cfg));
        board[idx] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  function hardMove(board, cfg) {
    const empty = getEmpty(board);
    const maxDepth = cfg.size <= 3 ? Infinity : HEURISTIC_DEPTH;

    let bestScore = -Infinity;
    let bestMove = empty[0];

    for (const idx of empty) {
      board[idx] = cfg.aiMark;
      const score = minimax(board, 1, maxDepth, false, -Infinity, Infinity, cfg);
      board[idx] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
    }

    return bestMove;
  }

  /**
   * Main entry: get AI move based on difficulty
   * @param {Array} board - current board state (size*size elements, null/'X'/'O')
   * @param {string} difficulty - 'easy', 'medium', or 'hard'
   * @param {Object} config - { size, winLength, combos, aiMark, humanMark }
   * @returns {number} - index of the chosen cell
   */
  function getMove(board, difficulty, config) {
    const cfg = {
      size: config.size,
      winLength: config.winLength,
      combos: config.combos,
      aiMark: config.aiMark || 'O',
      humanMark: config.humanMark || 'X',
    };

    switch (difficulty) {
      case 'easy': return easyMove(board);
      case 'medium': return mediumMove(board, cfg);
      case 'hard': return hardMove(board, cfg);
      default: return easyMove(board);
    }
  }

  return { buildCombos, getMove, checkWin, getWinningCombo, isFull };
})();
