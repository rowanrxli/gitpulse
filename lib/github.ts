import {database,savedRepos,saveRepo,readSyncState,writeSyncState,net24} from './storage';
import {runBatch} from './sync-engine';
export async function collect(token?:string,runId?:string){
 const db=database(),now=Date.now(),lease=now+300000;
 const lock=await db.prepare('INSERT INTO job_locks(name,until) VALUES (?,?) ON CONFLICT(name) DO UPDATE SET until=excluded.until WHERE job_locks.until < ?').bind('collect',lease,now).run();
 if(!lock.meta.changes)throw new Error('A synchronization batch is already running.');
 try{return await runBatch({all:savedRepos,read:readSyncState,write:writeSyncState,put:saveRepo,net:net24},{token,runId});}
 finally{await db.prepare('UPDATE job_locks SET until=0 WHERE name=? AND until=?').bind('collect',lease).run();}
}
