import {parseHistory} from './history.ts';
import type {Repo} from './scoring.ts';
export const DAY=86400000;
export function refreshWeeks(r:Repo,now:number){return !r.historyAvailable||!r.historyDayStart?6:Math.min(6,Math.max(1,Math.ceil((now-r.historyDayStart)/(7*DAY))+1));}
export function cachedBuckets(r:Repo){if(r.historyBuckets)return {...r.historyBuckets};const buckets:Record<string,number>={};if(r.historyDayStart!==undefined)r.daily.forEach((v,i)=>{buckets[String(r.historyDayStart!-(r.daily.length-1-i)*DAY)]=v;});return buckets;}
export function mergeHistory(r:Repo,input:unknown,now:number){parseHistory(input,now);const buckets=cachedBuckets(r);for(const row of input as {week:number;days:number[]}[])row.days.forEach((n,i)=>{buckets[String(row.week*1000+i*DAY)]=n;});return materializeHistory(buckets,now);}
export function materializeHistory(buckets:Record<string,number>,now:number){const retained=Object.fromEntries(Object.entries(buckets).filter(([t])=>Number(t)>=now-42*DAY));const complete=Object.entries(retained).map(([t,v])=>[Number(t),v]).filter(([t])=>t+DAY<=now).sort((a,b)=>a[0]-b[0]);const tail:number[][]=[];for(let i=complete.length-1;i>=0&&tail.length<30;i--){if(tail.length&&tail[0][0]-complete[i][0]!==DAY)break;tail.unshift(complete[i]);}return {daily:tail.map(p=>p[1]),historyDayStart:tail.at(-1)?.[0],historyBuckets:retained};}
