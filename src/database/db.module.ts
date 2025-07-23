// src/database/db.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Knex } from 'knex';
import knex from 'knex';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [
    {
      provide: 'KNEX_CONNECTION',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<Knex> => {
        return knex({
          client: 'mysql2',
          connection: {
            host: configService.get<string>('DB_HOST'),
            port: configService.get<number>('DB_PORT'),
            user: configService.get<string>('DB_USER'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_NAME'),
          },
          pool: { min: 2, max: 10 },
          migrations: {
            directory: 'src/database/migrations',
          },
          seeds: {
            directory: 'src/database/seeds',
          },
        });
      },
    },
  ],
  exports: ['KNEX_CONNECTION'],
})
export class DbModule {}
