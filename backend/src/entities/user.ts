import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from './role';

@Entity() // back to default table name "user"
export class User {
  @PrimaryGeneratedColumn()
  userId!: number;

  @Column()
  firstname!: string;

  @Column()
  surname!: string;

  @Column()
  department!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  salt!: string;

  @Column({ default: 25 })
  annualLeaveBalance!: number;

  @ManyToOne(() => Role, (role) => role.users, { nullable: false })
  @JoinColumn({ name: 'roleId' })
  role!: Role;
}
