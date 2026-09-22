import {currentHistory,metrics,rank,type Repo} from './scoring';

export type EarlySignalLabel='EARLY BREAKOUT'|'ACCELERATING'|'EMERGING'|'WATCHING';
export type SignalFact={label:string;value:string};
export type EarlySignal={
 label:EarlySignalLabel;
 eligible:boolean;
 latestDay:number;
 recentDays:number;
 recentStars:number;
 acceleration:number|null;
 relativeGrowth:number;
 historyDays:number;
 reasons:string[];
};

type RankedRepo=ReturnType<typeof rank>[number];

const DAY=86400000;
const compact=(n:number)=>new Intl.NumberFormat('en',{notation:n>=10000?'compact':'standard',maximumFractionDigits:1}).format(n);
const pct=(n:number)=>Math.round(n*100);
const pushedRecently=(r:Repo,now:number)=>Number.isFinite(r.pushedAt)&&now-r.pushedAt<=7*DAY;

export function evaluateEarlySignal(r:Repo,now=Date.now()):EarlySignal{
 const daily=r.daily.filter(Number.isFinite);
 const latestDay=daily.at(-1)??0;
 const recentDays=Math.min(3,daily.length);
 const recentStars=daily.slice(-recentDays).reduce((sum,value)=>sum+value,0);
 const baselineValues=daily.length>=4?daily.slice(Math.max(0,daily.length-8),-1):[];
 const baseline=baselineValues.length?baselineValues.reduce((sum,value)=>sum+value,0)/baselineValues.length:0;
 const acceleration=baseline>0?latestDay/baseline:null;
 const relativeGrowth=recentStars/Math.max(r.stars-recentStars,50);
 const current=currentHistory(r,now);
 const fresh=pushedRecently(r,now);

 let label:EarlySignalLabel='WATCHING';
 if(current&&fresh&&r.age<=14&&recentDays>=3&&latestDay>=50&&recentStars>=100&&relativeGrowth>=0.2)label='EARLY BREAKOUT';
 else if(current&&fresh&&acceleration!==null&&acceleration>=2&&latestDay>=30&&recentStars>=60)label='ACCELERATING';
 else if(current&&fresh&&r.age<=30&&recentDays>=3&&recentStars>=50&&relativeGrowth>=0.15)label='EMERGING';

 const reasons:string[]=[];
 if(r.age<=30)reasons.push(`${r.age} days old`);
 if(latestDay>0)reasons.push(`+${compact(latestDay)} stars on the latest complete day`);
 if(recentDays)reasons.push(`+${compact(recentStars)} stars across the latest ${recentDays} complete day${recentDays===1?'':'s'}`);
 if(acceleration!==null&&acceleration>=1.25)reasons.push(`${acceleration.toFixed(1)}× latest-day acceleration versus the available prior baseline`);
 if(relativeGrowth>=0.1)reasons.push(`${pct(relativeGrowth)}% recent growth relative to the pre-window star base`);
 if(!fresh)reasons.push('Repository push activity is older than seven days');
 if(!current)reasons.push('Star history is not current enough for promotion');

 return {label,eligible:label!=='WATCHING',latestDay,recentDays,recentStars,acceleration,relativeGrowth,historyDays:daily.length,reasons};
}

export function whyRising(r:RankedRepo):{summary:string;facts:SignalFact[]}{
 const facts:SignalFact[]=[];
 if(r.day>0)facts.push({label:'Latest complete day',value:`+${compact(r.day)}`});
 if(r.week>0)facts.push({label:'Last 7 days',value:`+${compact(r.week)}`});
 if(r.acceleration!==null&&r.acceleration>=1.15)facts.push({label:'Acceleration',value:`${r.acceleration.toFixed(1)}×`});
 if(r.age<=30)facts.push({label:'Repository age',value:`${r.age} day${r.age===1?'':'s'}`});
 const velocity=r.parts[0];
 if(velocity!==null&&r.peerCount>=3&&velocity>=70){
  const top=Math.max(1,Math.ceil(100-velocity));
  facts.push({label:'Same-age cohort',value:`Top ${top}%`});
 }
 if(r.growth>=0.08)facts.push({label:'7-day relative growth',value:`${pct(r.growth)}%`});

 let summary='Recent momentum is elevated within the repositories GitPulse currently tracks.';
 if(r.age<=14&&r.acceleration!==null&&r.acceleration>=2)summary='A very young repository is accelerating well above its recent baseline.';
 else if(r.acceleration!==null&&r.acceleration>=2)summary='Latest-day growth is running well above the repository’s recent baseline.';
 else if(velocity!==null&&r.peerCount>=3&&velocity>=80)summary='Daily star velocity is unusually strong among tracked repositories of a similar age.';
 else if(r.growth>=0.2)summary='Recent star growth is large relative to the repository’s existing size.';

 return {summary,facts:facts.slice(0,4)};
}

export function earlySignalThresholds(){
 return {
  history:'Current star history is required. Emerging and breakout labels need at least three complete daily buckets.',
  freshness:'A repository must have been pushed within the last seven days.',
  earlyBreakout:'Age <= 14 days, latest complete day >= 50 stars, latest three complete days >= 100 stars, and recent relative growth >= 20%.',
  accelerating:'Available prior baseline, latest-day acceleration >= 2x, latest complete day >= 30 stars, and latest three complete days >= 60 stars.',
  emerging:'Age <= 30 days, latest three complete days >= 50 stars, and recent relative growth >= 15%.',
 };
}
