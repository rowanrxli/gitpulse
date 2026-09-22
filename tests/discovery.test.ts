import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildDiscoveryQueries,candidateFromSearchItem,isHiddenDiscoveryRepo,isPublicDiscoveryRepo} from '../lib/discovery-policy.ts';

const now=Date.parse('2026-09-22T12:00:00Z');

test('discovery queries target young and recently active small repositories',()=>{
 const queries=buildDiscoveryQueries(now);
 assert.equal(queries.length,2);
 assert.equal(queries[0].lane,'newborn');
 assert.match(queries[0].query,/created:>=2026-09-01/);
 assert.match(queries[0].query,/stars:20\.\.5000/);
 assert.match(queries[0].query,/fork:false/);
 assert.equal(queries[1].lane,'active-small');
 assert.match(queries[1].query,/pushed:>=2026-09-19/);
 assert.equal(queries[1].sort,'updated');
});

test('search results become private candidates with discovery metadata',()=>{
 const repo=candidateFromSearchItem({
  id:42,
  full_name:'small/project',
  description:'Early project',
  language:'TypeScript',
  topics:['developer-tools'],
  stargazers_count:120,
  forks_count:4,
  created_at:'2026-09-18T00:00:00Z',
  pushed_at:'2026-09-22T10:00:00Z',
  fork:false,
  archived:false,
 },'newborn',now);
 assert.ok(repo);
 assert.equal(repo.discoveryState,'candidate');
 assert.equal(repo.discoverySource,'github-search');
 assert.equal(repo.discoveryLane,'newborn');
 assert.equal(repo.starsAtDiscovery,120);
 assert.equal(repo.ageAtDiscovery,4);
 assert.equal(repo.historyAvailable,false);
 assert.equal(isHiddenDiscoveryRepo(repo),true);
 assert.equal(isPublicDiscoveryRepo(repo),false);
});

test('existing surfaced repositories remain public while invalid search rows are ignored',()=>{
 assert.equal(isPublicDiscoveryRepo({}),true);
 assert.equal(isPublicDiscoveryRepo({discoveryState:'surfaced'}),true);
 assert.equal(candidateFromSearchItem({
  id:1,
  full_name:'owner/fork',
  description:null,
  language:null,
  stargazers_count:100,
  forks_count:0,
  created_at:'2026-09-20T00:00:00Z',
  pushed_at:'2026-09-21T00:00:00Z',
  fork:true,
 },'newborn',now),null);
});
