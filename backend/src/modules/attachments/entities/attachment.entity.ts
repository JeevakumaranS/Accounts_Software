import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('attachments')
export class Attachment extends BaseEntity {
  @Column()
  entity_type: string;

  @Column({ type: 'uuid' })
  entity_id: string;

  @Column()
  file_name: string;

  @Column()
  file_path: string;

  @Column({ type: 'int' })
  file_size: number;

  @Column()
  mime_type: string;

  @Column({ type: 'uuid' })
  uploaded_by_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploaded_by: User;
}
