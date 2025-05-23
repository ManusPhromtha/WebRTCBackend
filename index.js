const express = require('express');
require("dotenv").config({ path: "./config/config.env" });
require("./config/db").connect();
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const CallSession = require('./models/CallSession');

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});


io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

  socket.on('joinRoom', async ({ roomId, userId }) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);

    // Check if the room already exists in the database
    let callSession = await CallSession.findOne({ roomId });

    if (!callSession) {
      // If not, create a new session
      callSession = new CallSession({ roomId, participants: [userId] });
      await callSession.save();
    } else {
      // If it exists, add the user to the participants list
      callSession.participants.push(userId);
      await callSession.save();
    }

    socket.to(roomId).emit('participantsUpdate', callSession.participants);
  });

  socket.on('signal', ({ roomId, data }) => {
    socket.to(roomId).emit('signal', data);
  });

  socket.on('leave', async ({ roomId, userId }) => {
    socket.leave(roomId);
    await CallSession.findOneAndUpdate(
      { roomId },
      { $pull: { participants: userId } }
    );
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected : ', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);