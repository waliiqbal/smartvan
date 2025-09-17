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
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/databaseservice';
import { Server } from 'socket.io';
import * as socketioJwt from 'socketio-jwt';
import { CustomSocket } from './custom-socket.interface'; // Import the custom interface



@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(
    private databaseService: DatabaseService,
    private configService: ConfigService,
  ) {}
  @WebSocketServer()
  server: Server;

  

  afterInit(server: Server) {
    console.log('socket server start');
    this.server.use(
      socketioJwt.authorize({
        secret: this.configService.get<string>('JWT_SECRET'),
        handshake: true,
        auth_header_required: true,
      }),
    );
  }

  handleDisconnect(socket: CustomSocket) {
   
  }

  async handleConnection(socket: CustomSocket) {
    // Use CustomSocket here
    console.log('socket is connected', socket.decoded_token.userId, socket.id);

  }
  
  

       @SubscribeMessage('updateLocation')
        async updateLocation(
          @MessageBody() data: any,
          @ConnectedSocket() socket: CustomSocket,
        ) {
          console.log(data.location, socket.decoded_token.userId, socket.decoded_token.userType );
    
        // this.server.to(socket.id).emit('startSurvey', {
          
        // });
      }

      
  }

       
  

    
  

