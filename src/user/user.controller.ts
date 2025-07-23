// user.controller.ts
import { Body, Controller, Post, Get, Req } from '@nestjs/common';
import { UserService } from './user.service';
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register')
  async registerUser(@Req() req: Request) {
    const user = req['user']
    return this.userService.registerUser(user);
  }

  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }
}
