/**
 * Socket.IO multiplayer client module
 */
const Multiplayer = (() => {
  let socket = null;
  let callbacks = {};

  function connect() {
    if (socket && socket.connected) return;
    socket = io();

    socket.on('room-created', (data) => {
      if (callbacks.onRoomCreated) callbacks.onRoomCreated(data);
    });

    socket.on('game-start', (data) => {
      if (callbacks.onGameStart) callbacks.onGameStart(data);
    });

    socket.on('opponent-move', (data) => {
      if (callbacks.onOpponentMove) callbacks.onOpponentMove(data);
    });

    socket.on('opponent-disconnected', () => {
      if (callbacks.onOpponentDisconnected) callbacks.onOpponentDisconnected();
    });

    socket.on('room-error', (data) => {
      if (callbacks.onError) callbacks.onError(data.message);
    });

    socket.on('rematch-requested', () => {
      if (callbacks.onRematchRequested) callbacks.onRematchRequested();
    });

    socket.on('rematch-accepted', (data) => {
      if (callbacks.onRematchAccepted) callbacks.onRematchAccepted(data);
    });

    socket.on('game-over-ack', (data) => {
      if (callbacks.onGameOverAck) callbacks.onGameOverAck(data);
    });
  }

  function createRoom(playerName) {
    connect();
    socket.emit('create-room', { playerName });
  }

  function joinRoom(roomCode, playerName) {
    connect();
    socket.emit('join-room', { roomCode: roomCode.toUpperCase(), playerName });
  }

  function sendMove(index) {
    if (socket) socket.emit('make-move', { index });
  }

  function sendGameOver(winner) {
    if (socket) socket.emit('game-over', { winner });
  }

  function requestRematch() {
    if (socket) socket.emit('request-rematch');
  }

  function leaveRoom() {
    if (socket) socket.emit('leave-room');
  }

  function on(event, cb) {
    callbacks[event] = cb;
  }

  function disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    callbacks = {};
  }

  return { connect, createRoom, joinRoom, sendMove, sendGameOver, requestRematch, leaveRoom, on, disconnect };
})();
