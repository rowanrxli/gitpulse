import { env } from 'cloudflare:workers';
import type { Repo } from './scoring';
import type {SyncState} from './sync-types';
export function database(){const db=(env as unknown as {DB?:D1Database}).DB;if(!db)throw Error('Database is unavailable');return db}
export async function savedRepos():Promise<Repo[]>{const result=await database().prepare('SELECT payload FROM repositories ORDER BY fetched_at DESC LIMIT 300').all<{payload:string}>();return result.results.map(r=>JSON.parse(r.payload));}
export async function saveRepo(r:Repo){const db=database();await db.batch([db.prepare('INSERT INTO repositories (id,full_name,payload,fetched_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET full_name=excluded.full_name,payload=excluded.payload,fetched_at=excluded.fetched_at').bind(r.id,r.fullName,JSON.stringify(r),r.fetchedAt),db.prepare('INSERT OR IGNORE INTO repo_snapshots (repo_id,recorded_at,stars,forks) VALUES (?,?,?,?)').bind(r.id,r.fetchedAt,r.stars,r.forks)]);}
export async function readSyncState():Promise<SyncState|null>{const row=await database().prepare('SELECT payload FROM sync_control WHERE name=?').bind('github').first<{payload:string}>();return row?JSON.parse(row.payload):null;}
export async function writeSyncState(state:SyncState){await database().prepare('INSERT INTO sync_control(name,payload) VALUES (?,?) ON CONFLICT(name) DO UPDATE SET payload=excluded.payload').bind('github',JSON.stringify(state)).run();}
export async function net24(repoId:number,stars:number,now:number){const row=await database().prepare('SELECT stars FROM repo_snapshots WHERE repo_id=? AND recorded_at BETWEEN ? AND ? ORDER BY ABS(recorded_at-?) LIMIT 1').bind(repoId,now-25*3600000,now-23*3600000,now-24*3600000).first<{stars:number}>();return row?stars-row.stars:null;}
