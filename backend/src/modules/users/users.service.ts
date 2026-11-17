import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UserStatus } from '../../shared/enums/user-status.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(createUserDto.password, saltRounds);

    const user = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password_hash,
      role: createUserDto.role,
      status: createUserDto.status || UserStatus.ACTIVE,
    });
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'name', 'email', 'role', 'status', 'last_login_at', 'created_at', 'updated_at'],
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.findByEmail(updateUserDto.email);
      if (existing) {
        throw new ConflictException('Email already in use');
      }
      user.email = updateUserDto.email;
    }

    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.role) user.role = updateUserDto.role;
    if (updateUserDto.status) user.status = updateUserDto.status;
    if (updateUserDto.password) {
      user.password_hash = await bcrypt.hash(updateUserDto.password, 12);
    }

    return this.userRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { last_login_at: new Date() });
  }

  async deactivate(id: string): Promise<User> {
    return this.update(id, { status: UserStatus.INACTIVE });
  }
}
