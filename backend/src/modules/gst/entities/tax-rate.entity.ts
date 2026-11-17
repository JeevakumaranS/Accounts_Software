import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { TaxType } from '../../../shared/enums/tax-type.enum';

@Entity('tax_rates')
export class TaxRate extends BaseEntity {
  @Column()
  tax_name: string;

  @Column('numeric', { precision: 5, scale: 2 })
  rate: number;

  @Column({ type: 'enum', enum: TaxType })
  tax_type: TaxType;

  @Column({ nullable: true })
  hsn_sac: string;

  @Column({ type: 'date' })
  effective_from: Date;

  @Column({ type: 'date', nullable: true })
  effective_to: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}
