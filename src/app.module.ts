import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import * as Joi from 'joi';
import { PlatformModule } from './modules/platform/platform.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { StatusModule } from './core/status/status.module';
import { DatabaseModule } from './core/database/database.module';
import { InitialSeeder } from './core/database/seeds/initial.seeder';
import { AuditModule } from './core/audit/audit.module';

/**
 * Main application module for Akira Flex API.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        DATABASE_URL: Joi.string().uri().required(),
        DATABASE_TEST_URL: Joi.string().uri().optional(),
        TYPEORM_LOGGING: Joi.string().valid('true', 'false').default('false'),
        PORT: Joi.number().port().default(3000),
        FRONTEND_URL: Joi.string().uri().optional(),
        CORS_ORIGINS: Joi.string().optional(),
        TRUST_PROXY: Joi.string().valid('true', 'false').default('false'),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_TENANT_SECRET: Joi.string().min(32).optional(),
        SUPER_ADMIN_PASSWORD: Joi.string().min(8).required(),
        ENABLE_DEBUG_REQUEST_INTERCEPTOR: Joi.string().valid('true', 'false').optional(),
        ENABLE_DEBUG_RESPONSE_INTERCEPTOR: Joi.string().valid('true', 'false').optional(),
        CORS_CREDENTIALS: Joi.string().valid('true', 'false').optional(),
        MAIL_DISABLE_SEND: Joi.string().valid('true', 'false').optional(),
        SMTP_HOST: Joi.string().optional(),
        SMTP_PORT: Joi.number().optional(),
        SMTP_USER: Joi.string().optional(),
        SMTP_PASS: Joi.string().optional(),
        API_URL: Joi.string().uri().optional(),
        THROTTLE_TTL: Joi.number().default(60),
        THROTTLE_LIMIT: Joi.number().default(10),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('THROTTLE_TTL', 60000),
          limit: configService.get('THROTTLE_LIMIT', 10),
        },
      ],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const isTest = configService.get<string>('NODE_ENV') === 'test';
        const databaseUrl = isTest
          ? configService.get<string>('DATABASE_TEST_URL') ||
            configService.get<string>('DATABASE_URL')
          : configService.get<string>('DATABASE_URL');
        const typeormLogging = configService.get<string>('TYPEORM_LOGGING');
        const isLoggerEnabled = typeormLogging === 'true';

        return {
          type: 'postgres',
          url: databaseUrl,
          autoLoadEntities: true,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: !isProduction,
          dropSchema: !isProduction,
          logging: isLoggerEnabled,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          extra: isProduction ? { ssl: { rejectUnauthorized: false } } : {},
        };
      },
    }),
    DatabaseModule,
    AuditModule,
    PlatformModule,
    TenantModule,
    StatusModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly initialSeeder: InitialSeeder,
    private readonly configService: ConfigService
  ) {}

  /**
   * Checks if the application is running in production mode.
   * @returns {boolean} - True if in production mode, false otherwise.
   */
  isProd(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  /**
   * Runs seeding on module initialization.
   */
  async onModuleInit() {
    if (!this.isProd()) {
      await this.initialSeeder.seed();
    }
  }
}
