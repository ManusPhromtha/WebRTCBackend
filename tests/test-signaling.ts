import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

// Log connection
socket.on("connect", () => {
  console.log("Connected as:", socket.id);

  // Simulate joining a room
  const roomId = "test-room-123";
  socket.emit("join", roomId);
});

// Log events from server
socket.on("new-user", (userId: string) => {
  console.log("New user joined room:", userId);

  // Simulate sending offer
  const fakeOffer = { type: "offer", sdp: "fake_sdp_offer" };
  socket.emit("offer", { offer: fakeOffer, to: userId });
});

socket.on("offer", (data) => {
  console.log("Received offer:", data);

  // Simulate sending answer
  const fakeAnswer = { type: "answer", sdp: "fake_sdp_answer" };
  socket.emit("answer", { answer: fakeAnswer, to: data.from });
});

socket.on("answer", (data) => {
  console.log("Received answer:", data);
});

socket.on("ice-candidate", (data) => {
  console.log("Received ICE candidate:", data);
});
