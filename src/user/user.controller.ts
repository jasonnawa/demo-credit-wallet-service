// user.controller.ts
import { Body, Controller, Post, Get, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('/register')
  async registerUser(@Req() req: Request, @Body() body: RegisterUserDto) {
    const user = {
      id: req['user']?.id,
      name: body.name,
      email: body.email,
    };
    return this.userService.registerUser(user);
  }

  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }
}
