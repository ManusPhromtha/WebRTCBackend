import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { db } from './db';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on('connection', (socket) => {
  console.log("User connected:", socket.id);

  socket.on('create-call', async ({ chatId, callerId, receiverId, callType }) => {
    try {
      const result = await db.query(
        `INSERT INTO call_logs (chat_id, caller_id, receiver_id, call_type, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [chatId, callerId, receiverId || '', callType || 'video', 'ongoing']
      );

      const callLogId = result.rows[0].id;
      socket.data.callLogId = callLogId;
      socket.join(chatId);
      console.log(`Created call log ${callLogId} for room ${chatId}`);
      socket.emit('call-created', { callLogId });

      const socketsInRoom = await io.in(chatId).fetchSockets();
      const receiverSocket = socketsInRoom.find(s => s.id !== socket.id);
      if (receiverSocket) {
        receiverSocket.emit("incoming-call", {
          callLogId,
          chatId,
          callerId,
          callType,
        });
      }
    } catch (err) {
      console.error("PostgreSQL error (create-call):", err);
    }
  });

  socket.on('join', async ({ chatId, callLogId }) => {
    socket.data.callLogId = callLogId;
    socket.join(chatId);

    try {
      await db.query(
        `UPDATE call_logs 
        SET receiver_id = $1, 
            answered_at = NOW(), 
            status = 'answered'
        WHERE id = $2 AND receiver_id = ''`,
        [socket.id, callLogId]
      );
      console.log(`User ${socket.id} joined room ${chatId}`);
    } catch (err) {
      console.error("PostgreSQL error (join):", err);
    }

    socket.to(chatId).emit('new-user', socket.id);
  });

  
  socket.on('decline-call', async ({ callLogId }) => {
    try {
      await db.query(
        `UPDATE call_logs SET status = 'declined', end_time = NOW() WHERE id = $1`,
        [callLogId]
      );
      console.log(`Call ${callLogId} was declined`);
    } catch (err) {
      console.error("PostgreSQL error (decline-call):", err);
    }
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

  socket.on('leave', async ({ chatId, callLogId }) => {
    socket.to(chatId).emit('peer-left');
    try {
      await db.query(
        `UPDATE call_logs 
        SET end_time = NOW(), 
          status = CASE WHEN answered_at IS NULL THEN 'missed' ELSE status END
        WHERE id = $1`,
        [callLogId]
      );
    } catch (err) {
      console.error("PostgreSQL error (leave):", err);
    }
  });


  socket.on('camera-status', ({ chatId, cameraOn }) => {
    socket.to(chatId).emit("camera-status", { cameraOn });
  });


  socket.on('disconnect', () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Signaling server listening on http://localhost:3000");
});
