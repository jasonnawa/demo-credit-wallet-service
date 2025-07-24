import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  beforeEach(() => {
    userService = {
      registerUser: jest.fn(),
      getAllUsers: jest.fn(),
    } as any;

    controller = new UserController(userService);
  });

  describe('registerUser', () => {
    it('should call userService.registerUser with correct user data', async () => {
      const mockReq: any = {
        user: { id: 42 },
      };

      const body: RegisterUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockResponse = { id: 1, ...body };
      (userService.registerUser as jest.Mock).mockResolvedValue(mockResponse);

      const result = await controller.registerUser(mockReq, body);

      expect(userService.registerUser).toHaveBeenCalledWith({
        id: 42,
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(result).toEqual(mockResponse);
    });
  });

});
