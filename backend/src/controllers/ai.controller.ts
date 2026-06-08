import { Body, Controller, Get, Post } from '@nestjs/common';
import { AiService } from '@src/services/ai.service';
import { ChatDto } from '@src/dto/chat.dto';

@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  status() {
    return this.aiService.getStatus();
  }

  @Post('chat')
  chat(@Body() body: ChatDto) {
    return this.aiService.chat(body);
  }
}
