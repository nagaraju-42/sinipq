import http from 'http';
// import { Server } from 'socket.io';
import app from './app';

import { initSockets } from './sockets/socket';//day-6

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);//day-6

// // Basic Socket.io initialization
// const io = new Server(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     methods: ['GET', 'POST'],
//   },
// });

// io.on('connection', (socket) => {
//   console.log(`[Socket] Client connected: ${socket.id}`);
  
//   socket.on('disconnect', () => {
//     console.log(`[Socket] Client disconnected: ${socket.id}`);
//   });
// });

// We deleted the old boilerplate and replaced it with this single, clean line:
initSockets(server);//day-6

server.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
});