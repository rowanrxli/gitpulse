import type {Repo} from './scoring';
import {currentHistory} from './scoring';
import {isPublicDiscoveryRepo} from './discovery-policy';
import {savedRepos,readSyncState} from './storage';
import {readJob} from './jobs';
export function publicRepo(r:Repo):Repo{return {id:r.id,fullName:r.fullName,description:r.description,language:r.language,topics:r.topics,stars:r.stars,forks:r.forks,age:r.age,daily:r.daily,fetchedAt:r.fetchedAt,source:r.source,historyAvailable:r.historyAvailable,historyFetchedAt:r.historyFetchedAt,historyDayStart:r.historyDayStart,historyState:r.historyState,net24:r.net24,pushedAt:r.pushedAt};}
export type PublicData={repos:Repo[];lastUpdated:number|null;updating:boolean;incomplete:boolean};
export async function publicData():Promise<PublicData>{const [allRepos,job,state]=await Promise.all([savedRepos(),readJob(),readSyncState()]);const repos=allRepos.filter(isPublicDiscoveryRepo);const fallback=state?.phase==='completed'?state.updatedAt:Math.max(0,...repos.map(r=>r.historyFetchedAt??r.fetchedAt))||null;return {repos:repos.map(publicRepo),lastUpdated:job?.lastSuccessfulAt??fallback,updating:job?.status==='running'&&Date.now()-job.updatedAt<300000,incomplete:repos.some(r=>!currentHistory(r)||r.daily.length<8)};}
