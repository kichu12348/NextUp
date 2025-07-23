import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });
    }

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToLeaderboard(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('leaderboard:update', callback);
    }
  }

  unsubscribeFromLeaderboard(): void {
    if (this.socket) {
      this.socket.off('leaderboard:update');
    }
  }

  subscribeToUserStats(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('user:stats:update', callback);
    }
  }

  unsubscribeFromUserStats(): void {
    if (this.socket) {
      this.socket.off('user:stats:update');
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
