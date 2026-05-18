/**
 * Main App Controller
 * Manages screens, game state, single-player & multiplayer flows
 */
const App = (() => {
  // ===== DOM REFERENCES =====
  const screens = {
    menu: document.getElementById('menu-screen'),
    difficulty: document.getElementById('difficulty-screen'),
    lobby: document.getElementById('lobby-screen'),
    game: document.getElementById('game-screen'),
    leaderboard: document.getElementById('leaderboard-screen'),
  };

  const els = {
    playerName: document.getElementById('player-name'),
    lobbyStatus: document.getElementById('lobby-status'),
    roomCodeInput: document.getElementById('room-code-input'),
    gameStatus: document.getElementById('game-status'),
    playerXName: document.getElementById('player-x-name'),
    playerOName: document.getElementById('player-o-name'),
    scoreX: document.getElementById('score-x'),
    scoreO: document.getElementById('score-o'),
    leaderboardBody: document.getElementById('leaderboard-body'),
    modalOverlay: document.getElementById('modal-overlay'),
    modalIcon: document.getElementById('modal-icon'),
    modalTitle: document.getElementById('modal-title'),
    modalMessage: document.getElementById('modal-message'),
  };

  // ===== STATE =====
  let state = {
    mode: null,           // 'single' or 'multi'
    difficulty: null,     // 'easy', 'medium', 'hard'
    board: Array(9).fill(null),
    currentTurn: 'X',
    myMark: 'X',
    playerXName: '',
    playerOName: '',
    scores: { X: 0, O: 0 },
    gameActive: false,
    isMyTurn: true,
    roomCode: null,
    rematchPending: false,
  };

  // ===== SCREEN MANAGEMENT =====
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // ===== TOAST =====
  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // ===== GAME LOGIC =====
  function getName() {
    return els.playerName.value.trim() || 'Player';
  }

  function startSinglePlayer(difficulty) {
    state.mode = 'single';
    state.difficulty = difficulty;
    state.myMark = 'X';
    state.playerXName = getName();
    state.playerOName = `AI (${difficulty})`;
    state.isMyTurn = true;
    resetGame();
    showScreen('game');
    updateHeader();
  }

  function resetGame() {
    state.board = Array(9).fill(null);
    state.currentTurn = 'X';
    state.gameActive = true;
    state.rematchPending = false;
    Board.clear();
    Board.enable();
    updateStatus();
    updateActivePlayer();
  }

  function updateHeader() {
    els.playerXName.textContent = state.playerXName;
    els.playerOName.textContent = state.playerOName;
    els.scoreX.textContent = state.scores.X;
    els.scoreO.textContent = state.scores.O;
  }

  function updateStatus() {
    if (!state.gameActive) return;
    if (state.mode === 'single') {
      els.gameStatus.textContent = state.currentTurn === state.myMark ? 'Your turn' : 'AI thinking...';
    } else {
      els.gameStatus.textContent = state.isMyTurn ? 'Your turn' : "Opponent's turn";
    }
  }

  function updateActivePlayer() {
    const xInfo = document.querySelector('.player-x');
    const oInfo = document.querySelector('.player-o');
    xInfo.classList.toggle('active', state.currentTurn === 'X');
    oInfo.classList.toggle('active', state.currentTurn === 'O');
  }

  function makeMove(index) {
    if (!state.gameActive) return;
    if (state.board[index] !== null) return;

    state.board[index] = state.currentTurn;
    Board.setCell(index, state.currentTurn);

    // Check for win
    const winCombo = getWinCombo(state.currentTurn);
    if (winCombo) {
      handleWin(state.currentTurn, winCombo);
      return;
    }

    // Check for draw
    if (AI.isFull(state.board)) {
      handleDraw();
      return;
    }

    // Switch turns
    state.currentTurn = state.currentTurn === 'X' ? 'O' : 'X';
    updateActivePlayer();
    updateStatus();
  }

  function getWinCombo(mark) {
    return AI.WINNING_COMBOS.find(combo =>
      combo.every(i => state.board[i] === mark)
    ) || null;
  }

  function handleWin(winner, combo) {
    state.gameActive = false;
    Board.disable();
    Board.showWin(combo);
    state.scores[winner]++;
    els.scoreX.textContent = state.scores.X;
    els.scoreO.textContent = state.scores.O;

    const winnerName = winner === 'X' ? state.playerXName : state.playerOName;
    const isMe = (state.mode === 'single' && winner === state.myMark) ||
                 (state.mode === 'multi' && winner === state.myMark);

    setTimeout(() => {
      showGameOverModal(
        isMe ? 'victory' : 'defeat',
        isMe ? 'You Win!' : `${winnerName} Wins!`,
        isMe ? 'Great job!' : 'Better luck next time.'
      );
    }, 800);

    // Save score
    saveScore(winner);

    // Notify server for multiplayer
    if (state.mode === 'multi') {
      Multiplayer.sendGameOver(winner);
    }
  }

  function handleDraw() {
    state.gameActive = false;
    Board.disable();
    els.gameStatus.textContent = "It's a draw!";

    setTimeout(() => {
      showGameOverModal('draw', "It's a Draw!", 'Nobody wins this round.');
    }, 500);

    saveScore('D');

    if (state.mode === 'multi') {
      Multiplayer.sendGameOver('D');
    }
  }

  function showGameOverModal(type, title, message) {
    const icons = { victory: '&#x1F389;', defeat: '&#x1F614;', draw: '&#x1F91D;' };
    els.modalIcon.innerHTML = icons[type] || '';
    els.modalTitle.textContent = title;
    els.modalMessage.textContent = message;
    els.modalOverlay.classList.remove('hidden');
  }

  function hideModal() {
    els.modalOverlay.classList.add('hidden');
  }

  // ===== SCORE PERSISTENCE =====
  async function saveScore(winner) {
    const body = {
      playerXName: state.playerXName,
      playerOName: state.mode === 'single' ? null : state.playerOName,
      winner,
      mode: state.mode === 'single' ? `single_${state.difficulty}` : 'multiplayer',
    };

    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error('Failed to save score:', err);
    }
  }

  async function loadLeaderboard() {
    try {
      const res = await fetch('/api/scores');
      const data = await res.json();
      renderLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      els.leaderboardBody.innerHTML = '<tr><td colspan="7" class="empty-state">Failed to load leaderboard</td></tr>';
    }
  }

  function renderLeaderboard(rows) {
    if (!rows.length) {
      els.leaderboardBody.innerHTML = '<tr><td colspan="7" class="empty-state">No games played yet</td></tr>';
      return;
    }

    els.leaderboardBody.innerHTML = rows.map((row, i) => {
      const rankClass = i < 3 ? `rank-${i + 1}` : '';
      const winPct = row.total > 0 ? Math.round((row.wins / row.total) * 100) : 0;
      return `
        <tr class="${rankClass}">
          <td>${i + 1}</td>
          <td>${escapeHtml(row.name)}</td>
          <td>${row.wins}</td>
          <td>${row.losses}</td>
          <td>${row.draws}</td>
          <td>${row.total}</td>
          <td>${winPct}%</td>
        </tr>
      `;
    }).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== SINGLE PLAYER: AI TURN =====
  function handleCellClick(index) {
    if (state.mode === 'single') {
      if (state.currentTurn !== state.myMark) return;
      if (!state.gameActive) return;

      makeMove(index);

      // AI responds
      if (state.gameActive) {
        Board.disable();
        setTimeout(() => {
          const aiMove = AI.getMove([...state.board], state.difficulty, 'O', 'X');
          makeMove(aiMove);
          if (state.gameActive) Board.enable();
        }, 400);
      }
    } else if (state.mode === 'multi') {
      if (!state.isMyTurn) return;
      if (!state.gameActive) return;

      makeMove(index);
      state.isMyTurn = false;
      Board.disable();
      Multiplayer.sendMove(index);
      updateStatus();
    }
  }

  // ===== MULTIPLAYER SETUP =====
  function setupMultiplayer() {
    Multiplayer.on('onRoomCreated', (data) => {
      state.roomCode = data.roomCode;
      els.lobbyStatus.classList.remove('hidden', 'error');
      els.lobbyStatus.classList.add('waiting');
      els.lobbyStatus.innerHTML = `
        Room created! Share this code:<br>
        <div class="room-code">${data.roomCode}</div><br>
        <span class="spinner"></span> Waiting for opponent...
      `;
    });

    Multiplayer.on('onGameStart', (data) => {
      state.mode = 'multi';
      state.myMark = data.mark;
      state.playerXName = data.playerX;
      state.playerOName = data.playerO;
      state.isMyTurn = data.mark === 'X';
      state.scores = { X: 0, O: 0 };
      resetGame();
      showScreen('game');
      updateHeader();

      if (!state.isMyTurn) {
        Board.disable();
      }
      updateStatus();
      showToast(`Game started! You are ${data.mark}`);
    });

    Multiplayer.on('onOpponentMove', (data) => {
      makeMove(data.index);
      state.isMyTurn = true;
      if (state.gameActive) Board.enable();
      updateStatus();
    });

    Multiplayer.on('onOpponentDisconnected', () => {
      state.gameActive = false;
      Board.disable();
      showToast('Opponent disconnected');
      setTimeout(() => {
        hideModal();
        Multiplayer.disconnect();
        showScreen('menu');
      }, 2000);
    });

    Multiplayer.on('onError', (message) => {
      els.lobbyStatus.classList.remove('hidden', 'waiting');
      els.lobbyStatus.classList.add('error');
      els.lobbyStatus.textContent = message;
    });

    Multiplayer.on('onRematchRequested', () => {
      showToast('Opponent wants a rematch!');
      state.rematchPending = true;
    });

    Multiplayer.on('onRematchAccepted', (data) => {
      hideModal();
      state.myMark = data.mark;
      state.isMyTurn = data.mark === 'X';
      resetGame();
      updateHeader();
      if (!state.isMyTurn) Board.disable();
      updateStatus();
      showToast('Rematch started!');
    });
  }

  // ===== EVENT BINDING =====
  function init() {
    Board.setClickHandler(handleCellClick);
    setupMultiplayer();

    // Load saved name
    const savedName = localStorage.getItem('ttt-player-name');
    if (savedName) els.playerName.value = savedName;

    // Save name on change
    els.playerName.addEventListener('input', () => {
      localStorage.setItem('ttt-player-name', els.playerName.value);
    });

    // Menu buttons
    document.getElementById('btn-single').addEventListener('click', () => {
      if (!getName()) {
        els.playerName.focus();
        showToast('Please enter your name');
        return;
      }
      showScreen('difficulty');
    });

    document.getElementById('btn-multi').addEventListener('click', () => {
      if (!getName()) {
        els.playerName.focus();
        showToast('Please enter your name');
        return;
      }
      els.lobbyStatus.classList.add('hidden');
      showScreen('lobby');
    });

    document.getElementById('btn-leaderboard').addEventListener('click', () => {
      loadLeaderboard();
      showScreen('leaderboard');
    });

    // Difficulty buttons
    document.querySelectorAll('[data-difficulty]').forEach(btn => {
      btn.addEventListener('click', () => {
        startSinglePlayer(btn.dataset.difficulty);
      });
    });

    // Back buttons
    document.getElementById('btn-back-menu').addEventListener('click', () => showScreen('menu'));
    document.getElementById('btn-back-menu-2').addEventListener('click', () => {
      Multiplayer.leaveRoom();
      showScreen('menu');
    });
    document.getElementById('btn-back-menu-3').addEventListener('click', () => showScreen('menu'));

    // Lobby buttons
    document.getElementById('btn-create-room').addEventListener('click', () => {
      Multiplayer.createRoom(getName());
    });

    document.getElementById('btn-join-room').addEventListener('click', () => {
      const code = els.roomCodeInput.value.trim().toUpperCase();
      if (code.length !== 4) {
        els.lobbyStatus.classList.remove('hidden', 'waiting');
        els.lobbyStatus.classList.add('error');
        els.lobbyStatus.textContent = 'Please enter a 4-character room code';
        return;
      }
      Multiplayer.joinRoom(code, getName());
      els.lobbyStatus.classList.remove('hidden', 'error');
      els.lobbyStatus.classList.add('waiting');
      els.lobbyStatus.innerHTML = '<span class="spinner"></span> Joining room...';
    });

    // Game controls
    document.getElementById('btn-quit').addEventListener('click', () => {
      state.gameActive = false;
      if (state.mode === 'multi') {
        Multiplayer.leaveRoom();
        Multiplayer.disconnect();
      }
      state.scores = { X: 0, O: 0 };
      hideModal();
      showScreen('menu');
    });

    // Modal buttons
    document.getElementById('btn-rematch').addEventListener('click', () => {
      if (state.mode === 'single') {
        hideModal();
        resetGame();
        updateHeader();
      } else {
        if (state.rematchPending) {
          // Both players agree
          Multiplayer.requestRematch();
        } else {
          Multiplayer.requestRematch();
          showToast('Rematch requested! Waiting for opponent...');
        }
      }
    });

    document.getElementById('btn-modal-quit').addEventListener('click', () => {
      hideModal();
      state.gameActive = false;
      if (state.mode === 'multi') {
        Multiplayer.leaveRoom();
        Multiplayer.disconnect();
      }
      state.scores = { X: 0, O: 0 };
      showScreen('menu');
    });
  }

  // Initialize when DOM is ready
  init();
})();
