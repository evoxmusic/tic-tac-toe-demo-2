/**
 * Socket.IO game room handler
 * Manages room creation, joining, moves, and rematches
 */
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing chars
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function setupGameSockets(io) {
  io.on('connection', (socket) => {
    let currentRoom = null;

    socket.on('create-room', ({ playerName }) => {
      // Generate unique room code
      let roomCode;
      do {
        roomCode = generateRoomCode();
      } while (rooms.has(roomCode));

      currentRoom = roomCode;
      rooms.set(roomCode, {
        players: [{ id: socket.id, name: playerName, mark: 'X' }],
        board: Array(9).fill(null),
        currentTurn: 'X',
        gameActive: false,
        rematchVotes: 0,
      });

      socket.join(roomCode);
      socket.emit('room-created', { roomCode });
    });

    socket.on('join-room', ({ roomCode, playerName }) => {
      const room = rooms.get(roomCode);

      if (!room) {
        socket.emit('room-error', { message: 'Room not found. Check the code and try again.' });
        return;
      }

      if (room.players.length >= 2) {
        socket.emit('room-error', { message: 'Room is full.' });
        return;
      }

      currentRoom = roomCode;
      room.players.push({ id: socket.id, name: playerName, mark: 'O' });
      room.gameActive = true;

      socket.join(roomCode);

      // Notify both players
      const playerX = room.players[0];
      const playerO = room.players[1];

      io.to(playerX.id).emit('game-start', {
        mark: 'X',
        playerX: playerX.name,
        playerO: playerO.name,
      });

      io.to(playerO.id).emit('game-start', {
        mark: 'O',
        playerX: playerX.name,
        playerO: playerO.name,
      });
    });

    socket.on('make-move', ({ index }) => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (!room || !room.gameActive) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      // Validate turn
      if (room.currentTurn !== player.mark) return;

      // Validate move
      if (index < 0 || index > 8 || room.board[index] !== null) return;

      // Apply move
      room.board[index] = player.mark;
      room.currentTurn = player.mark === 'X' ? 'O' : 'X';

      // Broadcast to opponent
      socket.to(currentRoom).emit('opponent-move', { index });
    });

    socket.on('game-over', ({ winner }) => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (!room) return;

      room.gameActive = false;
      room.board = Array(9).fill(null);
      room.rematchVotes = 0;
    });

    socket.on('request-rematch', () => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (!room || room.players.length < 2) return;

      room.rematchVotes++;

      if (room.rematchVotes >= 2) {
        // Both want rematch — swap marks
        room.players.forEach(p => {
          p.mark = p.mark === 'X' ? 'O' : 'X';
        });
        room.board = Array(9).fill(null);
        room.currentTurn = 'X';
        room.gameActive = true;
        room.rematchVotes = 0;

        room.players.forEach(p => {
          io.to(p.id).emit('rematch-accepted', { mark: p.mark });
        });
      } else {
        // Notify opponent
        socket.to(currentRoom).emit('rematch-requested');
      }
    });

    socket.on('leave-room', () => {
      handleLeave(socket, io);
    });

    socket.on('disconnect', () => {
      handleLeave(socket, io);
    });

    function handleLeave(sock, io) {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (!room) return;

      // Notify other player
      sock.to(currentRoom).emit('opponent-disconnected');

      // Clean up
      sock.leave(currentRoom);
      rooms.delete(currentRoom);
      currentRoom = null;
    }
  });
}

module.exports = setupGameSockets;
