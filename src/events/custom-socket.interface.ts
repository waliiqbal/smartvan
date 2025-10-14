import { Socket } from 'socket.io';

export interface CustomSocket extends Socket {
  decoded_token: {
    sub?: string;
    userId?: string;
    userType?: string;
    // Add any other properties your JWT might contain
  };
}
