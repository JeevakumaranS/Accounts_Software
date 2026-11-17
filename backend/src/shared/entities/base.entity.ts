import { PrimaryColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { generateUUID7 } from '../utils/uuid.util';

export abstract class BaseEntity {
  @PrimaryColumn('uuid')
  id: string = generateUUID7();

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generateUUID7();
    }
  }
}
