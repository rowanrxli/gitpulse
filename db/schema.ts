import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const repositories = sqliteTable('repositories', { id: integer('id').primaryKey(), fullName: text('full_name').notNull(), payload: text('payload').notNull(), fetchedAt: integer('fetched_at').notNull() });
export const snapshots = sqliteTable('repo_snapshots', { repoId: integer('repo_id').notNull().references(()=>repositories.id), recordedAt: integer('recorded_at').notNull(), stars: integer('stars').notNull(), forks: integer('forks').notNull() }, t=>[primaryKey({columns:[t.repoId,t.recordedAt]})]);
export const jobLocks = sqliteTable('job_locks', { name: text('name').primaryKey(), until: integer('until').notNull() });
export const syncControl = sqliteTable('sync_control', { name:text('name').primaryKey(), payload:text('payload').notNull() });
