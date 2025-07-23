import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class FauxAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    const token = authHeader.replace('Bearer ', '').trim();

    // Simulated user lookup using token 
    const user = {
      id: parseInt(token),
      email: 'demoemai@gmell.com',
      name: 'Demo User', 
    };

    req['user'] = user;

    next();
  }
}
