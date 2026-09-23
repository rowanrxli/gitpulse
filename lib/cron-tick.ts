import type {JobState} from './job-policy';

export type CronTickDecision=
 | {kind:'start'}
 | {kind:'resume';jobId:string}
 | {kind:'skip';message:string;retryAt:number|null;done:boolean};

export function cronTickDecision(job:JobState|null,now:number):CronTickDecision{
 if(!job)return {kind:'start'};
 if(job.nextStartAt>now)return {kind:'skip',message:'Sync is not ready to continue yet.',retryAt:job.nextStartAt,done:job.status==='completed'};
 if(job.status==='completed')return {kind:'start'};
 return {kind:'resume',jobId:job.id};
}
