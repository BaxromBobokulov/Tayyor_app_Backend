import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  // userId → socketId map
  private connectedUsers = new Map<number, string>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  // ─── CONNECTION ────────────────────────────────────────────────
  async handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      this.logger.warn(`Client ${client.id} tokensiz ulanmoqchi`);
      client.emit('error', { message: 'Token taqdim etilmadi' });
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET || process.env.SECRET || 'access_secret',
      });
      // userId ni socket data ga saqlaymiz
      (client as any).userId = payload.id;
      this.connectedUsers.set(payload.id, client.id);
      this.logger.log(`User ${payload.id} ulandi (socket: ${client.id})`);
    } catch (err) {
      this.logger.error(`Auth xatosi: ${err.message}`);
      client.emit('error', { message: "Token yaroqsiz yoki muddati o'tgan" });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`User ${userId} uzildi`);
    }
  }

  // ─── JOIN CHAT ────────────────────────────────────────────────
  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: number },
  ) {
    const userId = (client as any).userId;
    if (!userId) throw new WsException('Avval autentifikatsiyadan o\'ting');

    const hasAccess = await this.chatService.checkAccess(data.chatId, userId);
    if (!hasAccess) {
      client.emit('error', { message: 'Bu chatga kirishingizga ruxsat yo\'q' });
      return;
    }

    client.join(`chat:${data.chatId}`);
    this.logger.log(`User ${userId} → chat:${data.chatId} ga qo'shildi`);
    client.emit('joinedChat', { chatId: data.chatId });
  }

  // ─── SEND MESSAGE ─────────────────────────────────────────────
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: number; text?: string; imageUrl?: string },
  ) {
    const userId = (client as any).userId;
    if (!userId) throw new WsException('Avval autentifikatsiyadan o\'ting');

    try {
      const message = await this.chatService.saveMessage(
        data.chatId,
        userId,
        data.text,
        data.imageUrl,
      );

      // Chatdagi barcha foydalanuvchilarga yuborish
      this.server.to(`chat:${data.chatId}`).emit('newMessage', message);
    } catch (err) {
      client.emit('error', { message: err.message || 'Xabar yuborishda xato' });
    }
  }

  // ─── MARK AS READ ─────────────────────────────────────────────
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: number },
  ) {
    const userId = (client as any).userId;
    if (!userId) throw new WsException('Avval autentifikatsiyadan o\'ting');

    try {
      await this.chatService.markAsRead(data.chatId, userId);
      // Xabarni yuboruvchiga ham bildirish
      this.server.to(`chat:${data.chatId}`).emit('messageRead', { chatId: data.chatId });
    } catch (err) {
      client.emit('error', { message: err.message });
    }
  }

  // ─── TYPING ──────────────────────────────────────────────────
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: number; isTyping: boolean },
  ) {
    const userId = (client as any).userId;
    if (!userId) return;

    // O'zidan boshqalarga yuborish
    client.to(`chat:${data.chatId}`).emit('userTyping', {
      chatId: data.chatId,
      userId,
      isTyping: data.isTyping,
    });
  }
}
