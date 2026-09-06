import {DEFAULT_VISIBLE,ORGAN_SYSTEMS,SYSTEMS,type Atlas,type Concept,type SceneState,type SystemId} from './anatomy.ts';

export type ViewerLink={visible?:SystemId[];explode?:number;select?:string};

const SYSTEM_IDS=new Set<string>(SYSTEMS.map(s=>s.id));
const PRESETS:Record<string,SystemId[]|[]>={
 all:SYSTEMS.map(s=>s.id),
 skeleton:['skeletal'],
 skeletal:['skeletal'],
 organs:ORGAN_SYSTEMS,
 none:[],
 hidden:[],
};

function uniqueSystems(ids:SystemId[]){
 const seen=new Set<SystemId>();
 return ids.filter(id=>{if(seen.has(id))return false;seen.add(id);return true;});
}

function sameSystems(a:readonly string[],b:readonly string[]){
 return a.length===b.length&&a.every(id=>b.includes(id));
}

function parseSystemsToken(raw:string){
 const token=raw.trim().toLowerCase();
 if(!token)return;
 if(token in PRESETS)return [...PRESETS[token]];
 if(SYSTEM_IDS.has(token))return [token as SystemId];
}

function parseSystemsList(raw:string){
 const tokens=raw.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
 if(!tokens.length)return;
 if(tokens.length===1)return parseSystemsToken(tokens[0]);
 const ids=tokens.filter((id):id is SystemId=>SYSTEM_IDS.has(id));
 if(ids.length)return uniqueSystems(ids);
}

export function parseExplode(raw:string|null){
 if(raw==null)return;
 const token=raw.trim().toLowerCase();
 if(!token)return;
 if(['1','true','yes','exploded','inventory','full'].includes(token))return 1;
 if(['0','false','no','assembled','assemble'].includes(token))return 0;
 const n=Number(token);
 if(!Number.isFinite(n))return;
 if(n>=0&&n<=1)return n;
 if(n>1&&n<=100)return n/100;
}

export function parseViewerSearch(search:string):ViewerLink{
 const params=new URLSearchParams(search.startsWith('?')?search.slice(1):search);
 const link:ViewerLink={};
 const systems=params.has('systems')?parseSystemsList(params.get('systems')??''):undefined;
 const system=params.has('system')?parseSystemsList(params.get('system')??''):undefined;
 if(systems)link.visible=systems;
 else if(system)link.visible=system;
 const explode=parseExplode(params.get('explode'));
 if(explode!==undefined)link.explode=explode;
 const select=(params.get('select')??params.get('concept')??'').trim();
 if(select)link.select=select;
 return link;
}

export function resolveSelection(atlas:Atlas,token:string):{concept:Concept;selected:string[]}|null{
 const q=token.trim();
 if(!q)return null;
 const lower=q.toLowerCase();
 const conceptById=atlas.concepts.find(c=>c.id.toLowerCase()===lower);
 if(conceptById)return {concept:conceptById,selected:conceptById.elements};
 const partById=atlas.parts.find(p=>p.id.toLowerCase()===lower);
 if(partById)return {concept:{id:partById.conceptId,name:partById.name,elements:[partById.id]},selected:[partById.id]};
 const conceptByName=atlas.concepts.find(c=>c.name.toLowerCase()===lower);
 if(conceptByName)return {concept:conceptByName,selected:conceptByName.elements};
 const partByName=atlas.parts.find(p=>p.name.toLowerCase()===lower);
 if(partByName)return {concept:{id:partByName.conceptId,name:partByName.name,elements:[partByName.id]},selected:[partByName.id]};
 const matches=atlas.concepts.filter(c=>c.name.toLowerCase().includes(lower)||c.id.toLowerCase().includes(lower));
 if(matches.length===1)return {concept:matches[0],selected:matches[0].elements};
 return null;
}

export function selectionToken(atlas:Atlas,selected:string[],chosen:Concept|null){
 if(!chosen||!selected.length)return;
 const chosenSet=new Set(chosen.elements);
 if(selected.length===chosen.elements.length&&selected.every(id=>chosenSet.has(id))){
  if(atlas.concepts.some(c=>c.id===chosen.id))return chosen.id;
 }
 if(selected.length===1)return selected[0];
 return chosen.id;
}

function systemsParam(visible:SystemId[]){
 if(sameSystems(visible,DEFAULT_VISIBLE))return;
 if(!visible.length)return {system:'none'};
 if(sameSystems(visible,ORGAN_SYSTEMS))return {system:'organs'};
 if(visible.length===1&&visible[0]==='skeletal')return {system:'skeletal'};
 if(sameSystems(visible,SYSTEMS.map(s=>s.id)))return {system:'all'};
 return {systems:uniqueSystems(visible).join(',')};
}

function explodeParam(explode:number){
 if(explode>=.95)return '1';
 if(explode<=.05)return;
 return String(Math.round(explode*100)/100);
}

export function serializeViewerSearch(input:{visible:SystemId[];explode:number;select?:string}){
 const params=new URLSearchParams();
 const systems=systemsParam(input.visible);
 if(systems?.system)params.set('system',systems.system);
 if(systems?.systems)params.set('systems',systems.systems);
 const explode=explodeParam(input.explode);
 if(explode)params.set('explode',explode);
 if(input.select)params.set('select',input.select);
 const query=params.toString();
 return query?`?${query}`:'';
}

export function applyViewerLink(atlas:Atlas,link:ViewerLink):{state:Partial<SceneState>;chosen:Concept|null}{
 const next:Partial<SceneState>={};
 if(link.visible)next.visible=link.visible;
 if(link.explode!==undefined){
  next.explode=link.explode;
  if(link.explode>.8)next.view='front';
 }
 let chosen:Concept|null=null;
 if(link.select){
  const resolved=resolveSelection(atlas,link.select);
  if(resolved){
   chosen=resolved.concept;
   next.selected=resolved.selected;
   next.isolate=false;
   next.rotate=false;
  }
 }
 return {state:next,chosen};
}

export function viewerHref(pathname:string,hash:string,serialized:string){
 return `${pathname}${serialized}${hash}`;
}
