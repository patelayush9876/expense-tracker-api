import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { config } from '@/config';
import { parseDurationToDate } from '@/common/utils/duration';
import { UserService } from '@/modules/user/user.service';
import { UserMapper, UserResponseDto } from '@/modules/user/mappers/user.mapper';
import { AuthRepository } from './repositories/auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<UserResponseDto> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const user = await this.userService.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      password: hashedPassword,
    });

    return UserMapper.toResponse(user);
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: UserResponseDto }> {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      user: UserMapper.toResponse(user),
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const record = await this.authRepository.findRefreshToken(refreshToken);
    if (record) {
      await this.authRepository.deleteRefreshToken(refreshToken);
    }
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const record = await this.authRepository.findRefreshToken(refreshToken);
    if (!record) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (record.expiresAt < new Date()) {
      await this.authRepository.deleteRefreshToken(refreshToken);
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(record.user);

    // Delete old refresh token
    await this.authRepository.deleteRefreshToken(refreshToken);

    return tokens;
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: config.auth.jwtSecret,
      expiresIn: config.auth.accessTokenExpiry as any,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: config.auth.jwtRefreshSecret,
      expiresIn: config.auth.refreshTokenExpiry as any,
    });

    const expiresAt = parseDurationToDate(config.auth.refreshTokenExpiry);
    await this.authRepository.createRefreshToken(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
    };
  }
}
