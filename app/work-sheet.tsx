import { Chart, formatInches as f, pitchLabel, missingSpecs } from '@/lib/drill-chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
export function GripDrawing({c}:{c:Chart}){
 const left=c.hand==='right'?'middle':'ring',right=c.hand==='right'?'ring':'middle';
 const names={middle:'중지',ring:'약지',thumb:'엄지'};const cx={middle:c.hand==='right'?150:350,ring:c.hand==='right'?350:150,thumb:250};
 return <svg viewBox="0 0 500 355" className="work-drawing" role="img" aria-label="홀 배치 및 스팬과 브리지 수치 작업 도식, 축척 없음">
 <defs><marker id="dimArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse"><path d="M6 0L0 3L6 6" fill="none" stroke="currentColor"/></marker></defs>
 <path d="M250 25V325M60 162H440" fill="none" stroke="#9caca4" strokeDasharray="6 4"/>
 <circle cx="250" cy="170" r="150" fill="none" stroke="#a6b8ae"/>
 {[left,right,...(c.grip==='two'?[]:['thumb'])].map(key=>{const k=key as 'middle'|'ring'|'thumb', x=cx[k], y=k==='thumb'?270:90;return <g key={k}><ellipse cx={x} cy={y} rx={k==='thumb'&&c.spec.ovalShape==='oval'?32:25} ry="25" transform={k==='thumb'&&c.spec.ovalShape==='oval'?`rotate(${(c.spec.ovalAngle??0)-90} ${x} ${y})`:undefined} fill="#fff" stroke="#375d49" strokeWidth="2"/><path d={`M${x-35} ${y}h70M${x} ${y-35}v70`} stroke="#bac8bf"/><text x={x} y={y-39} textAnchor="middle" fontSize="14" fill="#284c3a">{names[k]}</text><text x={x} y={y+48} textAnchor="middle" fontSize="13">드릴 Ø {f(c[k].diameter)}″</text></g>})}
 <path d="M178 65H222M278 65H322" stroke="#779384"/>
 <text x="250" y="46" textAnchor="middle" fontSize="13">브리지 {f(c.bridge)}″</text>
 {c.grip!=='two'&&<><path d="M140 121L219 256M360 121L281 256" fill="none" stroke="#537860" strokeDasharray="3 3"/>
 <rect x="71" y="179" width="126" height="39" fill="#fff"/><text x="134" y="192" textAnchor="middle" fontSize="12">{names[left]} 스팬</text><text x="134" y="210" textAnchor="middle" fontSize="15">{f(c[left==='middle'?'middleSpan':'ringSpan'])}″</text>
 <rect x="303" y="179" width="126" height="39" fill="#fff"/><text x="366" y="192" textAnchor="middle" fontSize="12">{names[right]} 스팬</text><text x="366" y="210" textAnchor="middle" fontSize="15">{f(c[right==='middle'?'middleSpan':'ringSpan'])}″</text></>}
 <text x="12" y="344" fontSize="11" fill="#728378">볼 표면을 바라본 방향 · {c.hand==='right'?'오른손':'왼손'} · 축척 없음</text>
 </svg>
}
export function WorkSheet({c,dirty}:{c:Chart;dirty:boolean}){
 const missing=missingSpecs(c);const keys:('middle'|'ring'|'thumb')[]=c.grip==='two'?['middle','ring']:['middle','ring','thumb'];
 const txt=(s:string)=>s||'미입력';const n=(v:number|null,unit='″')=>v===null?'미입력':f(v)+unit;
 return <article className="work-sheet"><header className="sheet-heading"><div><p>FIT STUDIO · PRO SHOP WORK SHEET</p><h2>볼링 지공 작업표</h2></div><div>{c.spec.date}<br/>{missing.length?'작성 중 · 미입력 '+missing.length+'개':'입력 완료 · 작업자 실측 대조용'}{dirty&&<><br/>저장 전 변경 포함</>}</div></header>
 <div className="sheet-info"><div><span>볼러</span><strong>{txt(c.name)}</strong></div><div><span>볼</span><strong>{txt(c.ball)}</strong></div><div><span>작업자</span><strong>{txt(c.spec.driller)}</strong></div><div><span>손 / 그립</span><strong>{c.hand==='right'?'오른손':'왼손'} / {c.grip==='finger'?'핑거팁':c.grip==='two'?'엄지 없음':'컨벤셔널'}</strong></div><div><span>무게 / 시리얼</span><strong>{n(c.spec.weight,' lb')} / {txt(c.spec.serial)}</strong></div><div><span>PAP</span><strong>수평(+우/−좌) {n(c.spec.papHorizontal)} / 수직(+위/−아래) {n(c.spec.papVertical)}</strong></div></div>
 <div className="sheet-center"><GripDrawing c={c}/><div className="sheet-conventions"><h3>측정·표기 기준</h3><p><b>단위</b> inch · 분수와 소수 입력값 유지</p><p><b>스팬</b> {c.grip==='two'?'엄지 없음 · 적용 안 함':c.spec.spanBasis==='cut'?'Cut-to-cut · 드릴 절삭 홀의 가까운 가장자리 간 표면 측정값 (베벨 전)':c.spec.spanBasis==='finished'?'Finished · 인서트/엄지 마감 후 접촉 가장자리 간 측정값':'미지정 · 기존 차트의 기준 확인 필요'}</p><p><b>브리지</b> 중지·약지 절삭 홀 사이 가장자리 간격 (베벨 전)</p><p><b>깊이</b> {txt(c.spec.depthReference)}</p><p><b>피치 기준</b> {txt(c.spec.pitchReference)}</p><p>F = 그립 중앙 쪽 포워드 / R = 그립 중앙에서 멀어지는 리버스. 좌우는 볼 표면을 바라본 방향이며 손 선택으로 값이 반전되지 않습니다.</p></div></div>
 <Table className="spec-table"><TableHeader><TableRow><TableHead>항목</TableHead>{keys.map(k=><TableHead key={k}>{({middle:'중지',ring:'약지',thumb:'엄지'})[k]}</TableHead>)}</TableRow></TableHeader><TableBody>
 {([['드릴 외경',k=>n(c[k].diameter)],['홀 깊이',k=>n(c[k].depth)],['전후 피치',k=>pitchLabel(c[k].forward,'forward')],['좌우 피치',k=>pitchLabel(c[k].lateral,'lateral')],['인서트 종류',k=>txt(c[k].insertStyle)],['인서트 사이즈',k=>txt(c[k].insertSize)],['베벨',k=>txt(c[k].bevel)]] as [string,(k:'middle'|'ring'|'thumb')=>string][]).map(([label,value])=><TableRow key={label}><TableCell>{label}</TableCell>{keys.map(k=><TableCell key={k}>{value(k)}</TableCell>)}</TableRow>)}
 </TableBody></Table>
 <div className="sheet-detail"><p><b>엄지 형상</b> {c.grip==='two'?'해당 없음':c.spec.ovalShape==='round'?'원형':c.spec.ovalShape==='unknown'?'미지정':`타원 · 마감 장축 ${n(c.spec.ovalLong)} / 단축 ${n(c.spec.ovalShort)} / 각도 ${c.spec.ovalAngle??'미입력'}° · ${txt(c.spec.ovalReference)}`}</p><p><b>레이아웃</b> {txt(c.spec.layout)}</p><p><b>표면 마감</b> {txt(c.spec.finish)}</p><p className="sheet-memo"><b>작업 메모</b> {txt(c.notes)}</p></div>
 {missing.length>0&&<p className="sheet-missing">미입력: {missing.join(', ')}</p>}
 <footer className="sheet-footer">작업표의 숫자를 게이지·지공 장비에 옮겨 사용하세요. 그림은 1:1 가공 템플릿이 아니며 기계 좌표·타원 가공 이동량을 산출하지 않습니다.<br/>실측 대조 / 작업자 서명: ____________________　날짜: ____________________</footer></article>
}
