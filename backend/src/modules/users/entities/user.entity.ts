import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Role } from '../../../shared/enums/role.enum';
import { UserStatus } from '../../../shared/enums/user-status.enum';

@Entity('users')
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ type: 'enum', enum: Role, default: Role.ACCOUNTANT })
  role: Role;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date | null;
}
