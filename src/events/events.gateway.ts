/* eslint-disable prettier/prettier */

import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { decode, verify } from "jsonwebtoken";
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/databaseservice';
import { Server } from 'socket.io';
import * as socketioJwt from 'socketio-jwt';
import { CustomSocket } from './custom-socket.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    console.log('🔥 EventsGateway constructor called');
  }

  @WebSocketServer()
  server: Server;

  
afterInit(server: Server) {
  console.log("socket server started");

  server.use((socket: any, next) => {
    let token = socket.handshake.auth?.token;
    console.log("Raw token:", token);

    if (!token) {
      return next(new Error("No token provided"));
    }

    // remove "Bearer " if present
    if (token.startsWith("Bearer ")) {
      token = token.slice(7);
    }

    try {
      const decoded: any = decode(token, { complete: true });
      console.log("Decoded JWT:", decoded);

      socket.user = decoded?.payload || decoded;
      next();
    } catch (err) {
      console.error("JWT decode failed:", err);
      return next(new Error("Authentication error"));
    }
  });
}


  async handleConnection(socket: CustomSocket) {
    console.log('Socket connected:', socket.id);
  }

  async handleDisconnect(socket: CustomSocket) {
    console.log('Socket disconnected:', socket.id);
  }

  /**
   * Driver starts a trip → joins a room with tripId
   */
  @SubscribeMessage('startTrip')
  async startTrip(
    @MessageBody() data: { tripId: string },
    @ConnectedSocket() socket: CustomSocket,
  ) {
    if (socket.decoded_token.userType !== 'driver') {
      return;
    }
    const { tripId } = data;
    socket.join(tripId); // create/join trip room
    console.log(`Driver ${socket.decoded_token.userId} joined trip room: ${tripId}`);

    this.server.to(socket.id).emit('tripStarted', { tripId });
  }

  /**
   * Driver updates location → emit to room
   */
  @SubscribeMessage('updateLocation')
  async updateLocation(
    @MessageBody() data: { tripId: string; location: any },
    @ConnectedSocket() socket: CustomSocket,
  ) {
    const { tripId, location } = data;
    console.log('Location update:', location, 'for trip:', tripId);

    // send update to everyone in that room (driver + parents)
    this.server.to(tripId).emit('locationUpdated', {
      userId: socket.decoded_token.userId,
      location,
    });
  }

  /**
   * Parent joins an active trip room → start receiving updates
   */
  @SubscribeMessage('joinTrip')
  async joinTrip(
    @MessageBody() data: { tripId: string },
    @ConnectedSocket() socket: CustomSocket,
  ) {
    if (socket.decoded_token.userType !== 'parent') {
      return;
    }
    const { tripId } = data;
    socket.join(tripId);
    console.log(`Parent ${socket.decoded_token.userId} joined trip room: ${tripId}`);

    this.server.to(socket.id).emit('joinedTrip', { tripId });
  }
}
