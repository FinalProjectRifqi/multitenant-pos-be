import knex, { Knex } from 'knex';
import type { DatabaseConfig } from '../config/database.config';

export const createDatabase = (config: DatabaseConfig): Knex => knex(config);

export const testDatabaseConnection = async (db: Knex): Promise<void> => {
  await db.raw('SELECT 1');
};

export const destroyDatabase = async (db: Knex): Promise<void> => {
  await db.destroy();
};
