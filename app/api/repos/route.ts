import {publicData} from '@/lib/public-data';
export async function GET(){try{return Response.json(await publicData(),{headers:{'Cache-Control':'public, max-age=30, stale-while-revalidate=60'}});}catch{return Response.json({error:'Repository signals are temporarily unavailable.'},{status:503});}}
