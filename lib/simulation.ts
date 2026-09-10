import {z} from 'zod';
export const simulationSchema=z.object({version:z.literal(1),productId:z.string().max(160),weight:z.number().int().min(6).max(20),coreTilt:z.number().min(-180).max(180),coreTurn:z.number().min(-180).max(180),middleDepth:z.number().min(10).max(90),ringDepth:z.number().min(10).max(90),middleForward:z.number().min(-20).max(20),ringForward:z.number().min(-20).max(20),middleSide:z.number().min(-20).max(20),ringSide:z.number().min(-20).max(20),pitchMode:z.enum(['neutral','degrees']),modelVersion:z.enum(['c3-v1','capacitor-v1','hustle-v1','surge-v1']).nullable()});
export type Simulation=z.infer<typeof simulationSchema>;
export const defaultSimulation=():Simulation=>({version:1,productId:'storm/iq-tour-edition',weight:15,coreTilt:35,coreTurn:0,middleDepth:55,ringDepth:55,middleForward:0,ringForward:0,middleSide:0,ringSide:0,pitchMode:'neutral',modelVersion:'c3-v1'});
export function numericMm(value:unknown){return typeof value==='number'&&Number.isFinite(value)?value*25.4:null;}
// Bridge is shortest surface edge-to-edge distance; hole radii are chords on sphere.
export function fingerAngles(d1:number,d2:number,bridge:number,radius=108.5){const a1=Math.asin(d1/(2*radius)),a2=Math.asin(d2/(2*radius)),gap=bridge/radius;return [-gap/2-a1,gap/2+a2];}
