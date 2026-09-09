import test from 'node:test';
import assert from 'node:assert/strict';
import {inkSchema,hitsStroke,strokePath} from '../lib/ink.ts';
import {chartSchema,emptyChart,normalizeChart} from '../lib/drill-chart.ts';
const stroke={id:'stroke1',page:'sheet',color:'#203d38',width:3,points:[[10,10],[100,100]]};
test('old records load without ink and both handwriting pages round-trip',()=>{const old={...emptyChart(),name:'테스트',id:'11111111-1111-4111-8111-111111111111'};delete old.ink;assert.deepEqual(chartSchema.parse(old).ink,[]);assert.deepEqual(normalizeChart(old).ink,[]);const ink=[stroke,{...stroke,id:'stroke2',page:'ball'}];assert.deepEqual(chartSchema.parse(JSON.parse(JSON.stringify({...old,ink}))).ink,ink);});
test('ink rejects out-of-bounds, invalid colors, excessive strokes and point counts',()=>{for(const bad of [{...stroke,points:[[801,0]]},{...stroke,points:[[0,Infinity]]},{...stroke,color:'url(https://example.com)'},{...stroke,points:[]},{...stroke,width:0}])assert.equal(inkSchema.safeParse([bad]).success,false);assert.equal(inkSchema.safeParse(Array(501).fill(stroke)).success,false);assert.equal(inkSchema.safeParse(Array(15).fill({...stroke,points:Array(4096).fill([1,1])})).success,false);});
test('eraser detects segment interiors and single dots without deleting distant strokes',()=>{assert.equal(hitsStroke(stroke,[55,55]),true);assert.equal(hitsStroke(stroke,[55,100]),false);assert.equal(hitsStroke({...stroke,points:[[10,10]]},[10,10]),true);assert.match(strokePath([[10,10]]),/l0.01 0/);assert.equal(strokePath(stroke.points),'M10 10 L100 100');});
