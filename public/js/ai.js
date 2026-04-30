/**
 * AI module for Tic Tac Toe
 * Supports three difficulty levels: easy, medium, hard
 */
const AI = (() => {
  const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],             // diagonals
  ];

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
   * Check if a player has won
   */
  function checkWin(board, player) {
    return WINNING_COMBOS.some(combo =>
      combo.every(i => board[i] === player)
    );
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

  // ===== MEDIUM: Block wins and take wins, otherwise random =====
  function mediumMove(board, aiMark, humanMark) {
    const empty = getEmpty(board);

    // 1. Can we win? Take it.
    for (const idx of empty) {
      board[idx] = aiMark;
      if (checkWin(board, aiMark)) {
        board[idx] = null;
        return idx;
      }
      board[idx] = null;
    }

    // 2. Can opponent win? Block it.
    for (const idx of empty) {
      board[idx] = humanMark;
      if (checkWin(board, humanMark)) {
        board[idx] = null;
        return idx;
      }
      board[idx] = null;
    }

    // 3. Take center if available
    if (!board[4]) return 4;

    // 4. Take a corner
    const corners = [0, 2, 6, 8].filter(i => !board[i]);
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // 5. Random
    return easyMove(board);
  }

  // ===== HARD: Minimax algorithm (unbeatable) =====
  function minimax(board, depth, isMaximizing, aiMark, humanMark) {
    if (checkWin(board, aiMark)) return 10 - depth;
    if (checkWin(board, humanMark)) return depth - 10;
    if (isFull(board)) return 0;

    const empty = getEmpty(board);

    if (isMaximizing) {
      let best = -Infinity;
      for (const idx of empty) {
        board[idx] = aiMark;
        best = Math.max(best, minimax(board, depth + 1, false, aiMark, humanMark));
        board[idx] = null;
      }
      return best;
    } else {
      let best = Infinity;
      for (const idx of empty) {
        board[idx] = humanMark;
        best = Math.min(best, minimax(board, depth + 1, true, aiMark, humanMark));
        board[idx] = null;
      }
      return best;
    }
  }

  function hardMove(board, aiMark, humanMark) {
    const empty = getEmpty(board);
    let bestScore = -Infinity;
    let bestMove = empty[0];

    for (const idx of empty) {
      board[idx] = aiMark;
      const score = minimax(board, 0, false, aiMark, humanMark);
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
   * @param {Array} board - current board state (9 elements, null/'X'/'O')
   * @param {string} difficulty - 'easy', 'medium', or 'hard'
   * @param {string} aiMark - 'X' or 'O'
   * @param {string} humanMark - 'X' or 'O'
   * @returns {number} - index of the chosen cell (0-8)
   */
  function getMove(board, difficulty, aiMark = 'O', humanMark = 'X') {
    switch (difficulty) {
      case 'easy': return easyMove(board);
      case 'medium': return mediumMove(board, aiMark, humanMark);
      case 'hard': return hardMove(board, aiMark, humanMark);
      default: return easyMove(board);
    }
  }

  return { getMove, checkWin, isFull, WINNING_COMBOS };
})();
