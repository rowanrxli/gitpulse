import {adminAuthorized} from '@/lib/access-policy';
import {serverConfig} from '@/lib/server-config';
import {adminStatus} from '@/lib/jobs';
export async function GET(request:Request){if(!await adminAuthorized(request.headers,serverConfig()))return Response.json({error:'Administrator access required.'},{status:403,headers:{'Cache-Control':'no-store'}});try{return Response.json(await adminStatus(),{headers:{'Cache-Control':'private, no-store'}});}catch{return Response.json({error:'Status is temporarily unavailable.'},{status:503});}}
