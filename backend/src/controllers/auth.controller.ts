import { Request, Response } from 'express';
import { AppDataSource } from '../ormconfig';
import { User } from '../entities/user';
import { Role } from '../entities/role';
import { logClientError } from '../utils/logger';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userRepo = AppDataSource.getRepository(User);
const roleRepo = AppDataSource.getRepository(Role);


export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      logClientError(400, 'Missing email or password', req.originalUrl, req.method, req.user?.userId);
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const user = await userRepo.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user) {
      logClientError(400, 'Invalid credentials', req.originalUrl, req.method, req.user?.userId);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 
    const inputHash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');

    if (inputHash !== user.password) {
      logClientError(400, 'Invalid credentials', req.originalUrl, req.method, req.user?.userId);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user.userId,
        role: user.role.name,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /api/auth/me  (auth required)
export const getMe = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logClientError(401, 'Unauthenticated', req.originalUrl, req.method, req.user?.userId);
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo.findOne({
      where: { userId },
      relations: ['role'],
    });

    if (!user) {
      logClientError(404, 'User not found', req.originalUrl, req.method, req.user?.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      message: 'Current user profile',
      data: {
        userId: user.userId,
        firstname: user.firstname,
        surname: user.surname,
        email: user.email,
        department: user.department,
        annualLeaveBalance: user.annualLeaveBalance,
        role: {
          roleId: user.role?.roleId,
          name: user.role?.name,
        },
      },
    });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};