import { Controller, Post, Body, Req, Res, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { config } from '@/config';
import { parseDurationToMs } from '@/common/utils/duration';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from '@/modules/user/mappers/user.mapper';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: UserResponseDto }> {
    const result = await this.authService.login(loginDto);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: config.app.environment === 'production',
      sameSite: 'lax',
      maxAge: parseDurationToMs(config.auth.accessTokenExpiry),
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: config.app.environment === 'production',
      sameSite: 'lax',
      maxAge: parseDurationToMs(config.auth.refreshTokenExpiry),
    });

    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: boolean }> {
    const refreshToken = req.cookies['refresh_token'];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: config.app.environment === 'production',
      sameSite: 'lax',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: config.app.environment === 'production',
      sameSite: 'lax',
    });

    return { success: true };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: boolean }> {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const result = await this.authService.refreshTokens(refreshToken);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: config.app.environment === 'production',
      sameSite: 'lax',
      maxAge: parseDurationToMs(config.auth.accessTokenExpiry),
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: config.app.environment === 'production',
      sameSite: 'lax',
      maxAge: parseDurationToMs(config.auth.refreshTokenExpiry),
    });

    return { success: true };
  }
}
