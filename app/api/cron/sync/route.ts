import {validBearer} from '@/lib/access-policy';
import {serverConfig} from '@/lib/server-config';
import {executeJob} from '@/lib/jobs';
export async function POST(request:Request){
 if(!await validBearer(request.headers,serverConfig().SYNC_CRON_SECRET))return Response.json({error:'Not authorized.'},{status:401});
 const input=await request.json().catch(()=>({})) as {jobId?:unknown};const result=await executeJob('cron',typeof input?.jobId==='string'?input.jobId:undefined);
 return Response.json(result.body,{status:result.status,headers:{'Cache-Control':'no-store',...(result.body.retryAt?{'Retry-After':String(Math.max(1,Math.ceil((result.body.retryAt-Date.now())/1000)))}:{})}});
}
