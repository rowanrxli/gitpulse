import {env} from 'cloudflare:workers';
import type {AccessConfig} from './access-policy';
export function serverConfig(){return env as unknown as AccessConfig&{GITHUB_TOKEN?:string;SYNC_COOLDOWN_SECONDS?:string;SYNC_SCHEDULE_UTC?:string};}
export function cooldownMs(value?:string){const n=Number(value??900);return Math.max(60,Math.min(86400,Number.isFinite(n)?n:900))*1000;}
export function scheduleStatus(value?:string){return {enabled:false,nextRunAt:null,timeUTC:/^([01]\d|2[0-3]):[0-5]\d$/.test(value??'')?value!:'09:00',mechanism:'External scheduler not registered'};}
