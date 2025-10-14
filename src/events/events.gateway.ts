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
import { Types } from 'mongoose';

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
    let token = socket.handshake.headers["authorization"] || socket.handshake.query?.token;
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

      socket.decoded_token = decoded?.payload || decoded;
      next();
    } catch (err) {
      console.error("JWT decode failed:", err);
      return next(new Error("Authentication error"));
    }
  });
}


  async handleConnection(socket: CustomSocket) {
    console.log('Socket connected:', socket.id);

    const payload = {
      ok: true,
      socketId: socket.id,
      userId: (socket as any)?.data?.user?.userId ?? null, // if you attached auth in middleware
      namespace: socket.nsp?.name ?? '/',
      rooms: [...socket.rooms], // includes socket.id by default
      at: new Date().toISOString(),
    };

    // ✅ Send acknowledgement event to just-connected client
    socket.emit('connectionAck', payload);
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
    console.log("awais", socket?.decoded_token);
    if (socket?.decoded_token?.userType !== 'driver') {
      return;
    }
    const { tripId } = data;
    socket.join(tripId); // create/join trip room
    console.log(`Driver ${socket.decoded_token?.sub || socket.decoded_token.userId} joined trip room: ${tripId}`);

    this.server.to(socket.id).emit('tripStarted', { tripId });
  }

  /**
   * Driver updates location → emit to room
   */
  @SubscribeMessage('updateLocation')
async updateLocation(
  @MessageBody() data: { tripId: string; location: { lat: number; long: number } },
  @ConnectedSocket() socket: any,
) {
  const room = String(data.tripId).trim();

  // 1) Who is in the room before emit?
  const before = await this.server.in(room).allSockets(); // Set<string> of socket ids
  console.log(`[location] will emit to room=${room}, listeners=${before.size}, listenersIds=${[...before].join(',')}`);

  // (Optional) Auto-join the sender if not in room (useful for your own testing)
  if (!socket.rooms.has(room)) {
    console.log(`[location] sender not in room ${room}, joining temporarily`);
    await socket.join(room);
  }

  // 2) Write to DB
  const tripObjectId = new Types.ObjectId(room);
  await this.databaseService.repositories.TripModel.findByIdAndUpdate(
    tripObjectId,
    { $push: { locations: { lat: data.location.lat, long: data.location.long, time: new Date() } } },
    { new: false },
  );

  // 3) Emit to the room
  const userId =
    socket?.data?.user?.userId ||
    socket?.decoded_token?.userId ||
    socket?.decoded_token?.sub ||
    'unknown';

  this.server.to(room).emit('locationUpdated', {
    userId,
    location: data.location,
    at: new Date().toISOString(),
  });

  // 4) Sanity log after emit (count should be same; helps you see zero listeners quickly)
  const after = await this.server.in(room).allSockets();
  console.log(`[location] emitted to room=${room}, listeners(now)=${after.size}`);
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
    console.log(`Parent ${socket?.decoded_token?.userId || socket?.decoded_token?.sub} joined trip room: ${tripId}`);

    this.server.to(socket.id).emit('joinedTrip', { tripId });
  }
}
