import { Body, Controller, Delete, Get, Param, Put, Query } from '@nestjs/common';
import { UsersService } from '@src/services/users.service';
import { UpdateUserDto } from '@src/dto/update-user.dto';

@Controller('api/usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAll(@Query('incluirEliminados') incluirEliminados?: string) {
    return this.usersService.getAll(incluirEliminados === 'true');
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }

  @Put(':id/restaurar')
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }
}
