import {createGitHubClient,GitHubError} from './github-client';
import {buildDiscoveryQueries,candidateFromSearchItem,isHiddenDiscoveryRepo,type DiscoveryRunResult,type SearchRepository} from './discovery-policy';
import {database,savedRepos,saveRepo} from './storage';

type SearchResponse={items?:SearchRepository[]};
type DiscoveryControlState={lastAttemptAt?:number;lastSuccessAt?:number;lastAdded?:number;lastScanned?:number;lastError?:string;totalCandidates?:number};

const CONTROL_KEY='discovery';
const MIN_SUCCESS_INTERVAL=20*3600000;
const MIN_RETRY_INTERVAL=30*60000;
const MAX_CANDIDATES=180;
const MAX_ADD_PER_RUN=30;
const PAGE_SIZE=25;

async function writeDiscoveryState(state:DiscoveryControlState){
 await database().prepare('INSERT INTO sync_control(name,payload) VALUES (?,?) ON CONFLICT(name) DO UPDATE SET payload=excluded.payload').bind(CONTROL_KEY,JSON.stringify(state)).run();
}

export async function readDiscoveryState():Promise<DiscoveryControlState|null>{
 const row=await database().prepare('SELECT payload FROM sync_control WHERE name=?').bind(CONTROL_KEY).first<{payload:string}>();
 if(!row)return null;
 try{return JSON.parse(row.payload) as DiscoveryControlState;}catch{return null;}
}

export async function discoverCandidates(token?:string,now=Date.now()):Promise<DiscoveryRunResult>{
 const [control,repos]=await Promise.all([readDiscoveryState(),savedRepos()]);
 const hidden=repos.filter(isHiddenDiscoveryRepo);
 const base={at:now,added:0,scanned:0,candidates:hidden.length};
 const sinceAttempt=control?.lastAttemptAt?now-control.lastAttemptAt:Infinity;
 const lastSuccessAt=control?.lastSuccessAt??0;
 if(lastSuccessAt&&now-lastSuccessAt<MIN_SUCCESS_INTERVAL)return {...base,attempted:false,reason:'Discovery already completed recently.'};
 if((control?.lastAttemptAt??0)>lastSuccessAt&&sinceAttempt<MIN_RETRY_INTERVAL)return {...base,attempted:false,reason:'Discovery retry cooldown is active.'};
 if(hidden.length>=MAX_CANDIDATES)return {...base,attempted:false,reason:'Candidate pool is at capacity.'};

 const nextControl:DiscoveryControlState={...control,lastAttemptAt:now,totalCandidates:hidden.length};
 await writeDiscoveryState(nextControl);
 let retryAt=0,backoff=0,scanned=0,added=0,lastError:string|undefined;
 const request=createGitHubClient({
  token,
  retryAt:()=>retryAt,
  backoff:()=>backoff,
  record:async diagnostic=>{
   if(diagnostic.retryAt){retryAt=Math.max(retryAt,diagnostic.retryAt);backoff++;}
   else if(diagnostic.remaining===0&&diagnostic.reset)retryAt=Math.max(retryAt,diagnostic.reset*1000+2000);
  },
 });
 const known=new Set(repos.map(r=>r.id));

 outer: for(const lane of buildDiscoveryQueries(now)){
  try{
   const response=await request<SearchResponse>(`/search/repositories?q=${encodeURIComponent(lane.query)}&sort=${lane.sort}&order=desc&per_page=${PAGE_SIZE}`);
   const items=Array.isArray(response.data?.items)?response.data!.items!:[];
   scanned+=items.length;
   for(const item of items){
    if(added>=MAX_ADD_PER_RUN||hidden.length+added>=MAX_CANDIDATES)break outer;
    if(known.has(item.id))continue;
    const candidate=candidateFromSearchItem(item,lane.lane,now);
    if(!candidate)continue;
    await saveRepo(candidate);
    known.add(candidate.id);
    added++;
   }
  }catch(error){
   lastError=error instanceof GitHubError?error.kind:'unknown_error';
   break;
  }
 }

 const candidates=hidden.length+added;
 if(lastError){
  await writeDiscoveryState({...nextControl,lastAdded:added,lastScanned:scanned,lastError,totalCandidates:candidates});
  return {at:now,attempted:true,added,scanned,candidates,reason:`Discovery stopped after ${lastError}; saved candidates were preserved.`};
 }
 await writeDiscoveryState({lastAttemptAt:now,lastSuccessAt:now,lastAdded:added,lastScanned:scanned,totalCandidates:candidates});
 return {at:now,attempted:true,added,scanned,candidates};
}
