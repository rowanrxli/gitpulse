import {adminWriteAuthorized} from '@/lib/access-policy';
import {serverConfig} from '@/lib/server-config';
import {executeJob} from '@/lib/jobs';
export async function POST(request:Request){
 if(!await adminWriteAuthorized(request,serverConfig()))return Response.json({error:'Administrator access required.'},{status:403});
 const input=await request.json().catch(()=>({})) as {jobId?:unknown};const result=await executeJob('admin',typeof input?.jobId==='string'?input.jobId:undefined);
 return Response.json(result.body,{status:result.status,headers:{'Cache-Control':'no-store',...(result.body.retryAt?{'Retry-After':String(Math.max(1,Math.ceil((result.body.retryAt-Date.now())/1000)))}:{})}});
}
