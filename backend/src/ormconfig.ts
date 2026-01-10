import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './entities/user';
import { Role } from './entities/role';
import { LeaveRequest } from './entities/leave-request';
import { UserManagement } from './entities/user-management';

config();

export const AppDataSource = new DataSource({
  type: 'mariadb',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [User, Role, LeaveRequest, UserManagement],
  extra: {
    connectionLimit: 10,
    connectTimeout: 10000,
  },
});
