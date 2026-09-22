import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluateEarlySignal,whyRising} from '../lib/early-signal.ts';
import {rank,type Repo} from '../lib/scoring.ts';

const now=Date.parse('2026-09-22T12:00:00Z');

function repo(overrides:Partial<Repo>={}):Repo{
 return {
  id:1,
  fullName:'owner/project',
  description:'test',
  language:'TypeScript',
  topics:[],
  stars:300,
  forks:5,
  age:4,
  daily:[20,40,80],
  fetchedAt:now,
  source:'github',
  historyAvailable:true,
  historyFetchedAt:now,
  historyState:'current',
  net24:null,
  pushedAt:now-3600000,
  ...overrides,
 };
}

test('very young repositories can qualify as EARLY BREAKOUT before a full Pulse baseline exists',()=>{
 const signal=evaluateEarlySignal(repo(),now);
 assert.equal(signal.label,'EARLY BREAKOUT');
 assert.equal(signal.eligible,true);
 assert.equal(signal.historyDays,3);
 assert.equal(signal.latestDay,80);
 assert.equal(signal.recentStars,140);
});

test('acceleration and emerging rules are deterministic and stale history never qualifies',()=>{
 const accelerating=evaluateEarlySignal(repo({age:45,stars:400,daily:[10,10,10,40]}),now);
 assert.equal(accelerating.label,'ACCELERATING');
 assert.equal(accelerating.acceleration,4);

 const emerging=evaluateEarlySignal(repo({age:20,stars:200,daily:[20,20,20]}),now);
 assert.equal(emerging.label,'EMERGING');

 const stale=evaluateEarlySignal(repo({historyState:'stale'}),now);
 assert.equal(stale.label,'WATCHING');
 assert.equal(stale.eligible,false);
 assert.ok(stale.reasons.some(reason=>reason.includes('not current')));
});

test('whyRising explains public momentum with observable facts rather than a second score',()=>{
 const ranked=rank([
  repo({id:1,age:20,stars:500,daily:[5,5,5,5,5,5,5,40]}),
  repo({id:2,age:20,stars:300,daily:[2,2,2,2,2,2,2,3]}),
  repo({id:3,age:20,stars:350,daily:[3,3,3,3,3,3,3,4]}),
  repo({id:4,age:20,stars:380,daily:[4,4,4,4,4,4,4,5]}),
 ]);
 const selected=ranked.find(item=>item.id===1)!;
 const explanation=whyRising(selected);
 assert.match(explanation.summary,/baseline|velocity|growth/i);
 assert.ok(explanation.facts.some(fact=>fact.label==='Latest complete day'&&fact.value==='+40'));
 assert.ok(explanation.facts.some(fact=>fact.label==='Acceleration'&&fact.value==='8.0×'));
 assert.ok(explanation.facts.length<=4);
});
