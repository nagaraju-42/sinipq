import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

// We export 'io' so our queue controllers can import it and broadcast updates later
export let io: SocketIOServer;

export const initSockets = (httpServer: HttpServer) => {
  // Initialize the Socket Server and attach it to our existing HTTP server
  io = new SocketIOServer(httpServer, {
    cors: {
      // Allows our future Next.js frontend to connect without security blocks
      origin: process.env.FRONTEND_URL || '*', 
      methods: ['GET', 'POST'],
    },
  });

  // This runs every single time a new user opens the app
  io.on('connection', (socket) => {
    console.log(`⚡ [Socket connected]: ${socket.id}`);

    // Listen for clients asking to tune into a specific barber's radio frequency
    socket.on('join-barber-room', (barberId: string) => {
      if (barberId) {
        socket.join(barberId);
        console.log(`🔌 [Socket joined room]: ${socket.id} -> ${barberId}`);
      }
    });

    // Cleanup when a user closes the app or loses internet
    socket.on('disconnect', () => {
      console.log(`❌ [Socket disconnected]: ${socket.id}`);
    });
  });

  return io;
};