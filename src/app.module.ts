import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PlatformModule } from './modules/platform/platform.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { StatusModule } from './core/status/status.module';
import { DatabaseModule } from './core/database/database.module';
import { InitialSeeder } from './core/database/seeds/initial.seeder';

/**
 * Main application module for Akira Flex API.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => {
        const isProduction = process.env.NODE_ENV === 'production';
        const databaseUrl = process.env.DATABASE_URL;
        return {
          type: 'postgres',
          url: databaseUrl,
          autoLoadEntities: true,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: !isProduction,
          logging: !isProduction,
          dropSchema: !isProduction,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          extra: isProduction
            ? {
                ssl: {
                  rejectUnauthorized: false,
                },
              }
            : {},
        };
      },
    }),
    DatabaseModule,
    PlatformModule,
    TenantModule,
    StatusModule,
  ],
})
export class AppModule implements OnModuleInit {
  /**
   * Creates an instance of AppModule.
   * @param {InitialSeeder} initialSeeder - Initial seeder service.
   */
  constructor(private readonly initialSeeder: InitialSeeder) {}

  /**
   * Runs seeding on module initialization.
   */
  async onModuleInit() {
    if (process.env.NODE_ENV === 'development') {
      await this.initialSeeder.seed();
    }
  }
}
