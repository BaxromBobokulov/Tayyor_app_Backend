import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ChatService } from './chat.service';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('request/:requestId')
  @ApiOperation({ summary: "So'rovga tegishli chatlar ro'yxati [DRIVER]" })
  @ApiParam({ name: 'requestId', type: Number })
  getChatsByRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @CurrentUser() user: any,
  ) {
    return this.chatService.getChatsByRequest(requestId, user.id);
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Chat tarixini olish (pagination)' })
  @ApiParam({ name: 'chatId', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMessages(
    @Param('chatId', ParseIntPipe) chatId: number,
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(
      chatId,
      user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 30,
    );
  }

  @Get('my')
  @ApiOperation({ summary: "Foydalanuvchining barcha chatlari ro'yxati" })
  getMyChats(@CurrentUser() user: any) {
    return this.chatService.getMyChats(user.id);
  }
}
