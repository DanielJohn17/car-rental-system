import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionUrl: string | undefined =
  process.env.DB_CONNECTION_STRING ?? process.env.DATABASE_URL;

export const AppDataSource: DataSource = new DataSource({
  type: 'postgres',
  url: connectionUrl,
  entities: [path.resolve(process.cwd(), 'src/**/*.entity.ts')],
  migrations: [
    path.resolve(process.cwd(), 'src/core/database/migrations/*.ts'),
  ],
});
