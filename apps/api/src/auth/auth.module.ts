import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { JwtGuard } from './guards/jwt.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { UserRepository } from './repositories/user.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secret-key',
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenStrategy,
    JwtGuard,
    RefreshTokenGuard,
    UserRepository,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    JwtModule,
    PassportModule,
    JwtGuard,
    RefreshTokenGuard,
    TypeOrmModule,
  ],
})
export class AuthModule {}
