import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHistory} from '../lib/history.ts';
const week=1789862400;
test('keeps zero counts and excludes incomplete and future days',()=>{const result=parseHistory([{week,days:[5,0,8,0,0,0,0]}],week*1000+2.5*86400000);assert.deepEqual(result.daily,[5,0]);assert.equal(result.historyDayStart,week*1000+86400000);});
test('sorts newest-first API weeks into chronological history',()=>{const result=parseHistory([{week:week+604800,days:[2,2,2,2,2,2,2]},{week,days:[1,1,1,1,1,1,1]}],(week+1209600)*1000);assert.deepEqual(result.daily,[1,1,1,1,1,1,1,2,2,2,2,2,2,2]);});
test('rejects malformed history rather than inventing zeros',()=>assert.throws(()=>parseHistory([{week,days:[1]}],Date.now())));
