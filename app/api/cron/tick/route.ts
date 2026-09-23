import {validBearer} from '@/lib/access-policy';
import {serverConfig} from '@/lib/server-config';
import {executeJob,readJob} from '@/lib/jobs';
import {cronTickDecision} from '@/lib/cron-tick';

function json(body:Record<string,unknown>,status=200){
 return Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
}

export async function POST(request:Request){
 if(!await validBearer(request.headers,serverConfig().SYNC_CRON_SECRET))return json({error:'Not authorized.'},401);

 const current=await readJob();
 const decision=cronTickDecision(current,Date.now());
 if(decision.kind==='skip')return json({done:decision.done,skipped:true,message:decision.message,retryAt:decision.retryAt,jobId:current?.id});

 const result=await executeJob('cron',decision.kind==='resume'?decision.jobId:undefined);
 if(result.status===409||result.status===429){
  return json({...result.body,skipped:true});
 }
 return Response.json(result.body,{status:result.status,headers:{'Cache-Control':'no-store'}});
}
