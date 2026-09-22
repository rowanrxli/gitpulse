import type {DiscoveryLane,Repo} from './scoring';

export type SearchRepository={
 id:number;
 full_name:string;
 description:string|null;
 language:string|null;
 topics?:string[];
 stargazers_count:number;
 forks_count:number;
 created_at:string;
 pushed_at:string;
 fork?:boolean;
 archived?:boolean;
};

export type DiscoveryQuery={lane:DiscoveryLane;query:string;sort:'stars'|'updated'};
export type DiscoveryRunResult={at:number;attempted:boolean;added:number;scanned:number;candidates:number;reason?:string};

const DAY=86400000;
const day=(value:number)=>new Date(value).toISOString().slice(0,10);

export function buildDiscoveryQueries(now=Date.now()):DiscoveryQuery[]{
 return [
  {lane:'newborn',query:`created:>=${day(now-21*DAY)} stars:20..5000 fork:false archived:false`,sort:'stars'},
  {lane:'active-small',query:`created:>=${day(now-180*DAY)} pushed:>=${day(now-3*DAY)} stars:20..5000 fork:false archived:false`,sort:'updated'},
 ];
}

export function candidateFromSearchItem(item:SearchRepository,lane:DiscoveryLane,now=Date.now()):Repo|null{
 const createdAt=Date.parse(item.created_at),pushedAt=Date.parse(item.pushed_at);
 if(!Number.isFinite(item.id)||item.id<=0||typeof item.full_name!=='string'||!item.full_name.includes('/'))return null;
 if(item.fork||item.archived||!Number.isFinite(item.stargazers_count)||item.stargazers_count<20||item.stargazers_count>5000)return null;
 if(!Number.isFinite(createdAt)||!Number.isFinite(pushedAt))return null;
 const age=Math.max(0,Math.floor((now-createdAt)/DAY));
 return {
  id:item.id,
  fullName:item.full_name,
  description:item.description??'No description provided.',
  language:item.language??'Other',
  topics:Array.isArray(item.topics)?item.topics.filter((topic):topic is string=>typeof topic==='string').slice(0,20):[],
  stars:item.stargazers_count,
  forks:Number.isFinite(item.forks_count)?item.forks_count:0,
  age,
  daily:[],
  fetchedAt:now,
  source:'github',
  historyAvailable:false,
  historyState:'pending',
  net24:null,
  pushedAt,
  createdAt,
  metadataCheckedAt:now,
  discoveryState:'candidate',
  discoverySource:'github-search',
  discoveryLane:lane,
  discoveredAt:now,
  starsAtDiscovery:item.stargazers_count,
  ageAtDiscovery:age,
 };
}

export function isPublicDiscoveryRepo(r:Pick<Repo,'discoveryState'>){
 return !r.discoveryState||r.discoveryState==='surfaced';
}

export function isHiddenDiscoveryRepo(r:Pick<Repo,'discoveryState'>){
 return r.discoveryState==='candidate'||r.discoveryState==='tracking';
}
