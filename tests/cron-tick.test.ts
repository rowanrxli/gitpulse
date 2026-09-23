import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cronTickDecision} from '../lib/cron-tick.ts';
import type {JobState} from '../lib/job-policy.ts';

const now=1800000000000;
const job=(overrides:Partial<JobState>={}):JobState=>({
 id:'job-1',
 status:'running',
 trigger:'cron',
 startedAt:now-1000,
 updatedAt:now-500,
 completedAt:null,
 lastSuccessfulAt:null,
 nextStartAt:0,
 durationMs:500,
 ...overrides,
});

test('stateless cron tick starts when no durable job exists',()=>{
 assert.deepEqual(cronTickDecision(null,now),{kind:'start'});
});

test('stateless cron tick resumes an unfinished durable job',()=>{
 assert.deepEqual(cronTickDecision(job(),now),{kind:'resume',jobId:'job-1'});
 assert.deepEqual(cronTickDecision(job({status:'paused'}),now),{kind:'resume',jobId:'job-1'});
 assert.deepEqual(cronTickDecision(job({status:'failed'}),now),{kind:'resume',jobId:'job-1'});
});

test('stateless cron tick waits through cooldown or retry windows',()=>{
 assert.deepEqual(cronTickDecision(job({status:'paused',nextStartAt:now+60000}),now),{
  kind:'skip',
  message:'Sync is not ready to continue yet.',
  retryAt:now+60000,
  done:false,
 });
 assert.deepEqual(cronTickDecision(job({status:'completed',completedAt:now-1000,nextStartAt:now+60000}),now),{
  kind:'skip',
  message:'Sync is not ready to continue yet.',
  retryAt:now+60000,
  done:true,
 });
});

test('stateless cron tick starts a new cycle after completed cooldown expires',()=>{
 assert.deepEqual(cronTickDecision(job({status:'completed',completedAt:now-3600000,nextStartAt:now-1}),now),{kind:'start'});
});
