import http from 'http';
import { Server } from 'socket.io';
import app from './app';

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Basic Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
});