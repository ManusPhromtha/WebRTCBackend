import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { pool } from './db';


const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

function generateRandomId(length = 12): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

io.on('connection', (socket) => {
  console.log("User connected:", socket.id);

  socket.on('join', async (roomId: string) => {
    socket.join(roomId);
    try {
      const result = await pool.query('SELECT * FROM rooms WHERE room_id = $1', [roomId]);

      let user1 = '';
      let user2 = '';

      if (result.rows.length === 0) {
        // Create room with two random user IDs
        user1 = generateRandomId();
        user2 = generateRandomId();

        await pool.query(
          'INSERT INTO rooms (room_id, user1_id, user2_id) VALUES ($1, $2, $3)',
          [roomId, user1, user2]
        );
        console.log(`Created room ${roomId} with users ${user1}, ${user2}`);
      } else {
        user1 = result.rows[0].user1_id;
        user2 = result.rows[0].user2_id;
        console.log(`User rejoining room ${roomId}`);
      }
    } catch (err) {
      console.error("PostgreSQL error:", err);
    }

    socket.to(roomId).emit('new-user', socket.id);
  });


  socket.on('offer', ({ offer, to }) => {
    io.to(to).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ answer, to }) => {
    io.to(to).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, to }) => {
    io.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });

  socket.on('disconnect', () => {
    console.log("User disconnected:", socket.id);
  });

  socket.on('leave', (roomId) => {
    socket.to(roomId).emit('peer-left');
  });

});

server.listen(3000, () => {
  console.log("Signaling server listening on http://localhost:3000");
});