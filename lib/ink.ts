import {z} from 'zod';
export const INK_COLORS=['#203d38','#247a64','#326cc7','#ce5160'] as const;
export const MAX_INK_POINTS=60000;
export const inkStrokeSchema=z.object({id:z.string().max(80),page:z.enum(['sheet','ball']),color:z.enum(INK_COLORS),width:z.number().min(1).max(12),points:z.array(z.tuple([z.number().finite().min(0).max(800),z.number().finite().min(0).max(1000)])).min(1).max(4096)});
export const inkSchema=z.array(inkStrokeSchema).max(500).superRefine((a,ctx)=>{if(a.reduce((n,s)=>n+s.points.length,0)>MAX_INK_POINTS)ctx.addIssue({code:'custom',message:'필기량이 많습니다. 새 차트를 만들어 이어서 작성해주세요.'});});
export type InkStroke=z.infer<typeof inkStrokeSchema>;
export type InkPage=InkStroke['page'];
export function strokePath(points:InkStroke['points']){return points.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ')+(points.length===1?` l0.01 0`:'');}
export function hitsStroke(s:InkStroke,p:[number,number],radius=12){return s.points.some((a,i)=>{const b=s.points[Math.max(0,i-1)],dx=a[0]-b[0],dy=a[1]-b[1],den=dx*dx+dy*dy,t=den?Math.max(0,Math.min(1,((p[0]-b[0])*dx+(p[1]-b[1])*dy)/den)):0;return Math.hypot(p[0]-b[0]-t*dx,p[1]-b[1]-t*dy)<=radius+s.width/2;});}
