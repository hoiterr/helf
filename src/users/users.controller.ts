import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.prisma.user.create({
      data: { email: dto.email, name: dto.name, timezone: dto.timezone ?? 'UTC' },
    });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        connections: {
          select: { id: true, provider: true, status: true, lastSyncedAt: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
