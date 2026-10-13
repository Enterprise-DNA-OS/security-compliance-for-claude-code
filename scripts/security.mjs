#!/usr/bin/env node
// The one CLI for security compliance. Every slash command in .claude/commands drives it.
//   npm run security -- <command> [entity] [record] --field=value --actor=Name [--json]
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const entities={
 frameworks:['name','owner','code','target_date','certified_until','auditor','status'],
 controls:['name','owner','control_id','description','domain','frameworks','refs','status','applicable','justification','effective_date','last_reviewed_on'],
 evidence:['name','control_id','kind','location','collected_on','valid_days','collected_by'],
 policies:['name','owner','version_label','approved_on','approved_by','review_months','location','staff_must_accept','status'],
 people:['name','email','role','team','start_date','end_date','status','background_check_on','training_on','policies_accepted_on','mfa_enabled','device_encrypted'],
 vendors:['name','owner','service','data_access','criticality','assurance','assurance_until','last_assessed_on','contract_end','status'],
 systems:['name','owner','kind','vendor_id','data_class','internet_facing','personal_info','mfa_enforced','sso','backed_up','last_access_review_on','status'],
 accounts:['person_id','system_id','access_level','granted_on','removed_on','reviewed_on'],
 risks:['name','owner','description','category','likelihood','impact','treatment','treatment_plan','control_refs','residual_likelihood','residual_impact','review_on','status'],
 vulnerabilities:['name','owner','system_id','reference','category','severity','exploit_exists','released_on','found_on','fixed_on','status'],
 incidents:['name','owner','occurred_on','found_on','severity','description','personal_info','jurisdictions','serious_harm','assessed_on','regulator_notified_on','individuals_notified_on','root_cause','closed_on','status'],
 reviews:['name','owner','kind','framework_code','held_on','outcome'],
 actions:['name','owner','source','due_on','done_on','status'],
 settings:['evidence_valid_days','evidence_warning_days','access_review_days','policy_review_months','training_months','vendor_review_months','offboard_days','internal_audit_months','management_review_months','penetration_test_months','restore_test_months','other_patch_days']
};
// Foreign keys by entity: the field and the entity it points at. controls.control_id is the control's own code, not a key.
const REFS={evidence:{control_id:'controls'},accounts:{person_id:'people',system_id:'systems'},systems:{vendor_id:'vendors'},vulnerabilities:{system_id:'systems'}};
const DATES=['target_date','certified_until','effective_date','last_reviewed_on','collected_on','approved_on','start_date','end_date','background_check_on','training_on','policies_accepted_on','assurance_until','last_assessed_on','contract_end',
 'last_access_review_on','granted_on','removed_on','reviewed_on','review_on','released_on','found_on','fixed_on','occurred_on','assessed_on','regulator_notified_on','individuals_notified_on','closed_on','held_on','due_on','done_on'];
const BOOLS=['applicable','staff_must_accept','mfa_enabled','device_encrypted','internet_facing','personal_info','mfa_enforced','sso','backed_up','exploit_exists'];
const INTEGERS=['valid_days','review_months','likelihood','impact','residual_likelihood','residual_impact',...entities.settings];

export const reads={
 readiness:'select name,code,status,target_date,days_to_target,applicable,excluded,implemented,ready,evidence_gaps,ready_pct from readiness order by target_date nulls last,name',
 controls:'select control_id,name,owner,status,applicable,frameworks,evidence_state,expires_on from control_status order by control_id',
 'control-gaps':"select control_id,name,owner,status,evidence_state,frameworks from control_status where applicable and (status<>'implemented' or evidence_state in ('none','stale')) order by case status when 'not-started' then 0 when 'partial' then 1 else 2 end,control_id",
 soa:"select control_id,refs,name,case when applicable then 'Yes' else 'No' end as applicable,coalesce(justification,(select 'Treats: '||string_agg(r.name,'; ' order by r.name) from risks r where r.status='open' and upper(control_status.control_id)=any(string_to_array(upper(replace(coalesce(r.control_refs,''),' ','')),','))),case when applicable then 'Included: link the risk it treats' end) as justification,status from control_status where upper(coalesce(frameworks,'')) like '%ISO27001%' order by control_id",
 evidence:'select c.control_id,e.name,e.kind,e.collected_on,(e.collected_on+coalesce(e.valid_days,(select evidence_valid_days from settings)))::date as expires_on,e.collected_by,e.location from evidence e join controls c on c.id=e.control_id order by c.control_id,e.collected_on desc',
 'evidence-due':"select control_id,name,owner,evidence_state,last_collected,expires_on from control_status where applicable and evidence_state in ('none','stale','expiring') order by expires_on nulls first,control_id",
 policies:"select name,version_label,status,approved_on,(approved_on+make_interval(months=>coalesce(review_months,(select policy_review_months from settings))))::date as next_review,staff_must_accept,owner from policies where status<>'retired' order by name",
 'policies-due':"select name,version_label,status,approved_on,next_review,owner from (select *,(approved_on+make_interval(months=>coalesce(review_months,(select policy_review_months from settings))))::date as next_review from policies where status<>'retired') p where approved_on is null or next_review<=current_date+30 order by next_review nulls first,name",
 people:"select name,role,team,status,start_date,end_date,training_on,policies_accepted_on,mfa_enabled from people order by status,name",
 'people-gaps':'select name,role,team,gap from people_gaps order by name,gap',
 offboarding:'select person,end_date,system,access_level,removed_on,days_after_leaving,finding from offboarding order by finding desc,days_after_leaving desc',
 accounts:'select system,person,person_status,access_level,granted_on,reviewed_on from account_list where removed_on is null order by system,access_level,person',
 admins:"select system,person,person_status,granted_on,reviewed_on from account_list where removed_on is null and access_level='admin' order by system,person",
 'access-reviews':'select name,owner,data_class,last_access_review_on,next_review,days_overdue,active_accounts,admins from access_review_status order by never_reviewed desc,days_overdue desc,name',
 systems:"select name,kind,owner,data_class,internet_facing,personal_info,mfa_enforced,sso,backed_up from systems where status='active' order by name",
 vendors:'select name,service,criticality,data_access,assurance,assurance_until,last_assessed_on,next_assessment,state from vendor_status order by name',
 'vendor-reviews':"select name,owner,criticality,data_access,assurance_until,next_assessment,state from vendor_status where state<>'ok' order by case criticality when 'high' then 0 when 'medium' then 1 else 2 end,name",
 risks:"select name,owner,category,inherent,treatment,residual,review_on,control_refs from risk_register where status='open' order by residual desc nulls first,inherent desc nulls first,name",
 patching:"select name,system,category,severity,exploit_exists,released_on,rule,due_on,days_over from patch_status where status='open' order by days_over desc,name",
 incidents:'select name,owner,found_on,severity,personal_info,jurisdictions,serious_harm,au_assessment_due,assessed_on,regulator_notified_on,status from incident_clock order by status desc,found_on desc',
 actions:"select name,owner,source,due_on,due_on-current_date as days_left from actions where status='open' order by due_on nulls last,name",
 'review-calendar':'select kind,last_held,next_due,days_overdue from review_calendar order by next_due nulls first',
 compliance:'select rule,record,area,finding from compliance_findings order by rule,record',
 attention:`select 'Leaver still has access' as issue,person||' on '||system as record from offboarding where removed_on is null
  union all select 'Patch past its Essential Eight window',name from patch_status where status='open' and days_over>0
  union all select 'Privacy incident: assessment not done',name from incident_clock where personal_info and status='open' and assessed_on is null
  union all select 'Corrective action overdue',name from actions where status='open' and due_on<current_date
  union all select 'Evidence stale or missing',control_id from control_status where applicable and status='implemented' and evidence_state in ('none','stale')
  union all select 'Access review overdue',name from access_review_status where (never_reviewed or days_overdue>0) and active_accounts>0
  union all select 'Vendor assurance needs attention',name from vendor_status where state<>'ok' and criticality<>'low'
  union all select 'Policy review due',name from policies where status<>'retired' and (approved_on is null or (approved_on+make_interval(months=>coalesce(review_months,(select policy_review_months from settings))))::date<current_date)
  union all select 'Risk review date passed',name from risks where status='open' and review_on<current_date
  union all select 'Audit or review overdue',kind from review_calendar where last_held is null or days_overdue>0
  order by issue,record`,
 settings:'select evidence_valid_days,evidence_warning_days,access_review_days,policy_review_months,training_months,vendor_review_months,offboard_days,internal_audit_months,management_review_months,penetration_test_months,restore_test_months,other_patch_days,version from settings',
 history:'select entity,record_id,action,actor,created_at from audit_log order by created_at desc,id'
};
export const commands=[...Object.keys(reads),'show','add','update','log','collect','review-access','revoke','attest','approve-policy','import','export','weekly-review','draft-access-review','draft-incident-assessment','draft-questionnaire','help'];

const fail=message=>{throw Error(message);};
const today=()=>new Date().toISOString().slice(0,10);
export function parse(args){
 const positional=[],opts={};
 for(const a of args){if(!a.startsWith('--')){positional.push(a);continue;}const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i).replaceAll('-','_');if(k in opts)fail(`Duplicate option ${k}`);opts[k]=i<0?true:a.slice(i+1);}
 return {positional,opts};
}
const FLAGS=['json','dry_run','update_existing','day_first','training','policies'];
function allowed(o,keys){for(const k of Object.keys(o))if(![...keys,'json'].includes(k))fail(`Unknown option --${k.replaceAll('_','-')}`);for(const k of FLAGS)if(k in o&&o[k]!==true)fail(`--${k.replaceAll('_','-')} takes no value`);}
function required(v,name){if(typeof v!=='string'||!v.trim())fail(`${name} is required`);return v.trim();}
export function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)fail(`Expected a real date YYYY-MM-DD: ${v}`);return v;}
function yesNo(v,name){const s=String(v).trim().toLowerCase();if(!['yes','no'].includes(s))fail(`${name} is yes or no`);return s==='yes';}
function known(t){if(!entities[t])fail(`Unknown entity ${t}`);return t;}

const LABEL={accounts:"p.name||' @ '||s.name||' ('||a.access_level||')'"};
async function match(db,t,q){
 known(t);
 if(t==='settings')return (await db.query('select * from settings where id=1'))[0];
 required(q,'record');
 const all=t==='accounts'?await db.query(`select a.*,${LABEL.accounts} as name from accounts a join people p on p.id=a.person_id join systems s on s.id=a.system_id order by name,a.id`)
  :t==='evidence'?await db.query("select e.*,c.control_id||' '||e.name as name,c.control_id as code from evidence e join controls c on c.id=e.control_id order by name,e.id")
  :await db.query(`select * from ${t} order by name,id`);
 const s=q.toLowerCase();
 const keys=r=>[r.name,t==='controls'?r.control_id:null,t==='people'?r.email:null,t==='frameworks'?r.code:null].filter(Boolean).map(x=>String(x).toLowerCase());
 let hits=all.filter(r=>r.id===q||keys(r).includes(s));
 if(!hits.length)hits=all.filter(r=>r.id.startsWith(q)||keys(r).some(k=>k.includes(s)));
 if(hits.length!==1)fail(`${hits.length?'Ambiguous':'No match'} ${t}: ${q}\n${(hits.length?hits:all).slice(0,20).map(r=>r.id+' '+r.name).join('\n')}`);
 return hits[0];
}
async function transaction(db,actor,fn,dry=false){required(actor,'actor');await db.exec('BEGIN');try{await db.query("select set_config('app.actor',$1,true)",[actor]);const result=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function values(db,t,o){
 const v={};
 for(const k of entities[t]){
  if(!(k in o))continue;let x=o[k];if(x===true)fail(`${k} needs a value`);x=x.trim()||null;
  if(x===null){v[k]=x;continue;}
  if(DATES.includes(k))date(x);
  if(BOOLS.includes(k))x=yesNo(x,k);
  if(INTEGERS.includes(k)){if(!/^\d+$/.test(x))fail(`${k} must be a whole number`);x=Number(x);}
  if(k==='frameworks')x=x.split(',').map(f=>f.trim().toUpperCase()).filter(Boolean).join(',');
  const ref=REFS[t]?.[k];if(ref)x=(await match(db,ref,x)).id;
  v[k]=x;
 }
 return v;
}
async function insert(db,t,v){const keys=Object.keys(v);return (await db.query(`insert into ${t} (${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(v)))[0];}
async function update(db,t,id,v,expected){const keys=Object.keys(v);if(!keys.length)fail('No editable fields supplied');const rows=await db.query(`update ${t} set ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')} where id=$${keys.length+1} and version=$${keys.length+2} returning *`,[...Object.values(v),id,expected]);if(!rows.length)fail('Record changed; read show again');return rows[0];}
function expectVersion(o,r){if(!/^\d+$/.test(String(o.expected_version))||Number(o.expected_version)!==r.version)fail('Expected version required or record changed; read show');}

// ---------------------------------------------------------------- the weekly work

async function collect(db,q,o){
 allowed(o,['name','kind','location','collected_on','valid_days','actor']);
 const v=await values(db,'evidence',{...o,control_id:q});v.name=required(o.name,'name');v.collected_on=v.collected_on||today();v.collected_by=o.actor;
 return transaction(db,o.actor,async()=>{const c=await match(db,'controls',q);if(!c.applicable)fail(`${c.control_id} is excluded from scope; include it before collecting evidence`);return insert(db,'evidence',v);});
}
// One access review of one system: everyone kept is marked reviewed, everyone named in --remove loses access today.
async function reviewAccess(db,q,o){
 allowed(o,['remove','actor','expected_version']);
 return transaction(db,o.actor,async()=>{
  const sys=await match(db,'systems',q);expectVersion(o,sys);
  const active=await db.query('select a.*,p.name as person,p.email from accounts a join people p on p.id=a.person_id where a.system_id=$1 and a.removed_on is null order by p.name',[sys.id]);
  if(!active.length)fail(`${sys.name} has no active accounts to review`);
  const names=typeof o.remove==='string'?o.remove.split(';').map(x=>x.trim()).filter(Boolean):[];
  const removed=[];
  for(const n of names){
   const hits=active.filter(a=>a.person.toLowerCase()===n.toLowerCase()||(a.email||'').toLowerCase()===n.toLowerCase());
   if(!hits.length)fail(`${n} has no active account on ${sys.name}`);
   for(const a of hits){await update(db,'accounts',a.id,{removed_on:today(),reviewed_on:today()},a.version);removed.push(`${a.person} (${a.access_level})`);}
  }
  let kept=0;for(const a of active)if(!removed.includes(`${a.person} (${a.access_level})`)){await update(db,'accounts',a.id,{reviewed_on:today()},a.version);kept++;}
  await update(db,'systems',sys.id,{last_access_review_on:today()},sys.version);
  return {system:sys.name,reviewed_on:today(),kept,removed};
 });
}
async function revoke(db,q,o){
 allowed(o,['system','actor']);
 return transaction(db,o.actor,async()=>{
  const p=await match(db,'people',q);const sys=o.system?await match(db,'systems',required(o.system,'system')):null;
  const rows=await db.query('select a.*,s.name as system from accounts a join systems s on s.id=a.system_id where a.person_id=$1 and a.removed_on is null'+(sys?' and a.system_id=$2':'')+' order by s.name',sys?[p.id,sys.id]:[p.id]);
  if(!rows.length)fail(`${p.name} has no active accounts${sys?' on '+sys.name:''}`);
  for(const a of rows)await update(db,'accounts',a.id,{removed_on:today()},a.version);
  return {person:p.name,removed_on:today(),systems:rows.map(a=>`${a.system} (${a.access_level})`)};
 });
}
async function attest(db,q,o){
 allowed(o,['training','policies','on','actor']);
 if(!o.training&&!o.policies)fail('attest needs --training, --policies or both');
 const on=o.on?date(o.on):today();
 return transaction(db,o.actor,async()=>{
  const p=await match(db,'people',q);if(p.status!=='active')fail(`${p.name} has left`);
  const v={};if(o.training)v.training_on=on;if(o.policies)v.policies_accepted_on=on;
  return update(db,'people',p.id,v,p.version);
 });
}
async function approvePolicy(db,q,o){
 allowed(o,['approved_by','version_label','actor','expected_version']);
 const by=required(o.approved_by,'approved_by');
 return transaction(db,o.actor,async()=>{
  const p=await match(db,'policies',q);expectVersion(o,p);if(p.status==='retired')fail(`${p.name} is retired`);
  const v={status:'approved',approved_on:today(),approved_by:by};if(typeof o.version_label==='string')v.version_label=required(o.version_label,'version_label');
  return update(db,'policies',p.id,v,p.version);
 });
}

// ---------------------------------------------------------------- imports from Vanta's CSV exports

const sorted=x=>Array.isArray(x)?x.map(sorted):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sorted(x[k])])):x;
const canonical=x=>JSON.stringify(sorted(x));
function importDate(v,dayFirst,name){
 v=String(v||'').trim();if(!v)return null;
 if(/^\d{4}-\d{2}-\d{2}/.test(v))return date(v.slice(0,10));
 const m=v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
 if(m){if(!dayFirst)fail(`${name} "${v}" is ambiguous: add --day-first for DD/MM/YYYY exports`);return date(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`);}
 fail(`${name} is not a date: ${v}`);
}
const SCALE={'very low':1,rare:1,low:2,unlikely:2,medium:3,moderate:3,possible:3,high:4,likely:4,'very high':5,critical:5,'almost certain':5};
function score(v,name){v=String(v||'').trim().toLowerCase();if(!v)return null;if(/^[1-5]$/.test(v))return Number(v);if(v in SCALE)return SCALE[v];fail(`${name} must be 1 to 5 or a word such as Low or High: ${v}`);}
function controlStatus(v){v=String(v||'').trim().toLowerCase();if(!v)return 'not-started';if(/pass|ok|complete|implemented|done|met/.test(v))return 'implemented';if(/partial|progress|attention|failing|fail/.test(v))return 'partial';return 'not-started';}
function treatment(v){v=String(v||'').trim().toLowerCase();if(!v)return null;if(/mitigat|reduce|treat/.test(v))return 'mitigate';if(/accept|tolerat/.test(v))return 'accept';if(/transfer|share|insur/.test(v))return 'transfer';if(/avoid/.test(v))return 'avoid';fail('Unknown treatment: '+v);}

// Header names: controls follow Vanta's documented control fields (help.vanta.com, "Importing custom controls"); risk and people
// exports are mapped by common header names. Any other heading: copy examples/mapping.json and pass --mapping.
const IMPORTS={
 'vanta-controls':{table:'controls',aliases:{control_id:['Control ID','ID'],name:['Control Name','Name','Title'],description:['Control Description','Description'],domain:['Domain','Category'],owner:['Owner','Control Owner'],
  refs:['Framework Code','Framework Codes','Framework Requirements','Requirements'],status:['Evidence Status','Status','Test Status']},key:'control_id'},
 'vanta-risks':{table:'risks',aliases:{source_key:['Risk ID','ID','Identifier'],name:['Risk Scenario','Risk','Title','Name'],description:['Description'],category:['Category'],owner:['Owner','Risk Owner'],
  likelihood:['Likelihood','Inherent Likelihood'],impact:['Impact','Inherent Impact'],treatment:['Treatment','Risk Treatment','Decision'],treatment_plan:['Treatment Plan','Plan'],residual_likelihood:['Residual Likelihood'],residual_impact:['Residual Impact']},key:'source_key'},
 'vanta-people':{table:'people',aliases:{name:['Name','Full Name','Employee'],email:['Email','Email Address','Work Email'],role:['Title','Job Title','Role'],team:['Department','Team','Group'],start_date:['Start Date','Start date','Hire Date'],
  end_date:['End Date','Termination Date','Offboarding Date'],background_check_on:['Background Check Completed','Background Check Date'],training_on:['Security Training Completed','Training Completed','Security Training Date'],policies_accepted_on:['Policies Accepted','Policy Acceptance Date','Policies Accepted Date']},key:'email'}
};
async function importVanta(db,kind,o){
 allowed(o,['file','mapping','framework','actor','dry_run','update_existing','day_first']);
 const spec=IMPORTS[kind];
 const rows=parseCsv(fs.readFileSync(required(o.file,'file'),'utf8'));if(!rows.length)fail('CSV has no data rows');
 const mapping=o.mapping?JSON.parse(fs.readFileSync(o.mapping,'utf8'))[kind]||{}:{};
 for(const [k,v] of Object.entries(mapping)){if(!spec.aliases[k]||typeof v!=='string')fail('Invalid mapping field '+k);if(!(v in rows[0]))fail('Mapped header is missing: '+v);}
 const framework=o.framework?required(o.framework,'framework').toUpperCase():null;
 if(kind==='vanta-controls'&&!framework)fail('Name the framework this export came from: --framework=ISO27001 (Vanta exports controls one framework at a time)');
 if(framework){const f=(await db.query('select 1 from frameworks where upper(code)=$1',[framework]))[0];if(!f)fail(`No framework with code ${framework}: add it first`);}
 const seen=new Set();
 const batch=rows.map((row,i)=>{
  const v={};for(const k of Object.keys(spec.aliases))v[k]=String(mapping[k]?row[mapping[k]]:pick(row,...spec.aliases[k])).trim()||null;
  const at=`Row ${i+2}`;
  if(kind==='vanta-controls'){required(v.control_id,`${at}: Control ID (use --mapping for custom headers)`);required(v.description||v.name,`${at}: Control Description`);v.name=v.name||v.control_id;v.status=controlStatus(v.status);}
  if(kind==='vanta-risks'){required(v.name,`${at}: risk name (use --mapping for custom headers)`);for(const k of ['likelihood','impact','residual_likelihood','residual_impact'])v[k]=score(v[k],`${at} ${k}`);v.treatment=treatment(v.treatment);v.source_key=v.source_key||v.name;}
  if(kind==='vanta-people'){required(v.name,`${at}: Name (use --mapping for custom headers)`);v.email=required(v.email,`${at}: Email`).toLowerCase();for(const k of ['start_date','end_date','background_check_on','training_on','policies_accepted_on'])v[k]=importDate(v[k],o.day_first,`${at} ${k}`);
   v.status=v.end_date&&v.end_date<=today()?'left':'active';}
  const key=String(v[spec.key]).toLowerCase();if(seen.has(key))fail(`Duplicate ${spec.key} in file: ${v[spec.key]}`);seen.add(key);v.row=row;return v;
 });
 return transaction(db,o.actor,async()=>{
  const counts={added:0,unchanged:0,updated:0,linked:0,dry_run:!!o.dry_run};
  for(const v of batch){
   const {row,source_key,...fields}=v;
   if(kind==='vanta-controls'){
    const old=(await db.query('select * from controls where lower(control_id)=lower($1)',[v.control_id]))[0];
    const codes=old?.frameworks?old.frameworks.split(','):[];
    if(!old){await insert(db,'controls',{...fields,frameworks:framework,source_id:`vanta:${v.control_id}`,source_data:{[framework]:row}});counts.added++;continue;}
    const prior=old.source_data||{};const same=Object.values(prior).some(r=>canonical(r)===canonical(row));
    if(codes.includes(framework)&&canonical(prior[framework]||null)===canonical(row)){counts.unchanged++;continue;}
    if(!codes.includes(framework)&&same){await update(db,'controls',old.id,{frameworks:[...codes,framework].join(','),source_data:{...prior,[framework]:row}},old.version);counts.linked++;continue;}
    if(!o.update_existing)fail(`Control ${v.control_id} is already here with different details; compare it and use --update-existing`);
    await update(db,'controls',old.id,{...fields,frameworks:[...new Set([...codes,framework])].join(','),source_data:{...prior,[framework]:row}},old.version);counts.updated++;continue;
   }
   const sid=kind==='vanta-risks'?`vanta:${source_key.toLowerCase()}`:`vanta:${v.email}`;
   const old=(await db.query(`select * from ${spec.table} where source_id=$1${kind==='vanta-people'?' or lower(email)=$2':''}`,kind==='vanta-people'?[sid,v.email]:[sid]))[0];
   const rec={...fields,source_id:sid,source_data:row};
   if(!old){await insert(db,spec.table,rec);counts.added++;continue;}
   if(old.source_data&&canonical(old.source_data)===canonical(row)){counts.unchanged++;continue;}
   if(!o.update_existing)fail(`${v.name} is already here with different details; compare it and use --update-existing`);
   await update(db,spec.table,old.id,rec,old.version);counts.updated++;
  }
  return counts;
 },o.dry_run);
}

// ---------------------------------------------------------------- drafts

function writeDraft(name,intro,sections){
 const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});
 const file=path.join(dir,name+'-'+randomUUID().slice(0,8)+'.md');
 fs.writeFileSync(file,`# DRAFT: ${name}\n\n${intro}\n\n`+sections.map(s=>'## '+s.title+'\n\n'+(s.text??format(s.rows))).join('\n\n')+'\n',{flag:'wx',mode:0o600});
 return {file};
}
const STOP=new Set('about after again also and any are been before being both but can could does doing each from have having how into its more most must our over own same should such than that the their them then there these they this those through under until very was were what when where which while who will with would your you yours do does is it of on or to in a an be by for if as at all not no yes'.split(' '));
const words=s=>new Set(String(s||'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').split(/\s+/).filter(w=>w.length>2&&!STOP.has(w)).map(w=>w.replace(/(ing|ed|es|s)$/,'')));
// A customer security questionnaire, answered from the records: each question gets the controls whose words it shares, with their status and evidence.
async function draftQuestionnaire(db,o){
 allowed(o,['file']);
 const rows=parseCsv(fs.readFileSync(required(o.file,'file'),'utf8'));if(!rows.length)fail('CSV has no data rows');
 const controls=await db.query("select c.control_id,c.name,c.description,c.domain,c.refs,c.status,c.evidence_state,(select e.name from evidence e join controls x on x.id=e.control_id where x.control_id=c.control_id order by e.collected_on desc limit 1) as latest_evidence from control_status c where c.applicable");
 const index=controls.map(c=>({c,w:words([c.name,c.description,c.domain,c.refs].join(' '))}));
 const out=[];let matched=0;
 rows.forEach((r,i)=>{
  const q=String(pick(r,'Question','Questions','Control Question','Requirement')).trim();if(!q)fail(`Row ${i+2}: no Question column`);
  const qw=words(q);// Two shared words or more: one common word ("data", "test") is not a match.
  const ranked=index.map(x=>({c:x.c,s:[...qw].filter(w=>x.w.has(w)).length})).filter(x=>x.s>=2).sort((a,b)=>b.s-a.s||a.c.control_id.localeCompare(b.c.control_id)).slice(0,2);
  if(ranked.length)matched++;
  out.push({no:i+1,question:q,controls:ranked.map(x=>x.c.control_id).join(', ')||'(no match: answer by hand)',status:ranked.map(x=>x.c.status).join(', '),evidence:ranked.map(x=>x.c.latest_evidence||x.c.evidence_state).join('; ')});
 });
 const d=writeDraft('draft-questionnaire',`Draft answers to ${path.basename(o.file)}. Not sent. Each question lists the controls that look relevant, their status and the latest evidence. A person writes the answer, checks it against the evidence, and only claims what is implemented.`,[{title:'Questions',rows:out}]);
 return {...d,questions:rows.length,matched,unmatched:rows.length-matched};
}

export async function execute(db,args){
 const {positional:p,opts:o}=parse(args);const [cmd='help',t,q]=p;
 if(reads[cmd]){allowed(o,[]);if(p.length!==1)fail('Unexpected arguments');return db.query(reads[cmd]);}
 if(cmd==='help'){allowed(o,[]);return {commands,entities,usage:'security <command> [entity] [record] --field=value --actor=Name; updates need --expected-version=N from show; dates YYYY-MM-DD; yes/no for true or false fields'};}
 if(cmd==='show'){
  allowed(o,[]);const r=await match(db,known(t),q);const out={...r,history:await db.query('select action,actor,created_at from audit_log where entity=$1 and record_id=$2 order by created_at',[t,String(r.id)])};
  if(t==='controls')out.evidence=await db.query('select name,kind,collected_on,valid_days,collected_by,location from evidence where control_id=$1 order by collected_on desc',[r.id]);
  if(t==='people')out.accounts=await db.query('select system,access_level,granted_on,removed_on,reviewed_on from account_list where person=$1 order by system',[r.name]);
  if(t==='systems')out.accounts=await db.query('select person,person_status,access_level,granted_on,removed_on,reviewed_on from account_list where system=$1 order by removed_on nulls first,person',[r.name]);
  if(t==='frameworks')out.readiness=(await db.query('select applicable,excluded,implemented,ready,evidence_gaps,ready_pct from readiness where id=$1',[r.id]))[0];
  if(t!=='settings')out.notes=await db.query('select body,actor,created_at from notes where entity=$1 and record_id=$2 order by created_at',[t,r.id]);
  return out;
 }
 if(cmd==='add'||cmd==='update'){
  known(t);allowed(o,[...entities[t],'actor','expected_version']);
  if(cmd==='add'&&t==='settings')fail('Settings has one row: use update settings');
  const v=await values(db,t,o);
  if(cmd==='add'&&!['accounts'].includes(t))required(v.name,'name');
  if(cmd==='add'&&t==='evidence'&&!v.collected_on)v.collected_on=today();
  return transaction(db,o.actor,async()=>{
   const old=cmd==='update'?await match(db,t,t==='settings'?'1':q):null;
   if(old)expectVersion(o,old);
   return old?update(db,t,old.id,v,old.version):insert(db,t,v);
  });
 }
 if(cmd==='log'){allowed(o,['body','actor']);return transaction(db,o.actor,async()=>{const r=await match(db,known(t),q);if(t==='settings')fail('Notes go on a record');return insert(db,'notes',{entity:t,record_id:r.id,body:required(o.body,'body'),actor:o.actor});});}
 if(cmd==='collect'){if(p.length!==2)fail('collect <control> --name=... --kind=document --location=...');return collect(db,t,o);}
 if(cmd==='review-access'){if(p.length!==2)fail('review-access <system> [--remove="Name;Name"] --expected-version=N');return reviewAccess(db,t,o);}
 if(cmd==='revoke'){if(p.length!==2)fail('revoke <person> [--system=<system>]');return revoke(db,t,o);}
 if(cmd==='attest'){if(p.length!==2)fail('attest <person> --training --policies');return attest(db,t,o);}
 if(cmd==='approve-policy'){if(p.length!==2)fail('approve-policy <policy> --approved-by=Name --expected-version=N');return approvePolicy(db,t,o);}
 if(cmd==='import'){if(IMPORTS[t])return importVanta(db,t,o);fail('Use import vanta-controls, vanta-risks or vanta-people with --file=<export.csv>');}
 if(cmd==='export'){allowed(o,['file']);const out={};for(const k of [...Object.keys(entities),'notes','audit_log'])out[k]=await db.query(`select * from ${k} order by id`);if(o.file)fs.writeFileSync(o.file,JSON.stringify(out,null,2)+'\n',{flag:'wx',mode:0o600});return o.file?{file:o.file}:out;}
 if(cmd==='weekly-review'){
  allowed(o,[]);const sections=[];
  for(const c of ['readiness','attention','patching','offboarding','actions'])sections.push({title:c,rows:await execute(db,[c])});
  return writeDraft('weekly-review','Internal review only. Nothing has been sent or changed. Check each item against the system before acting.',sections);
 }
 if(cmd==='draft-access-review'){
  allowed(o,[]);const sys=await match(db,'systems',t);
  const rows=await db.query('select person,person_status,access_level,granted_on,reviewed_on from account_list where system=$1 and removed_on is null order by access_level desc,person',[sys.name]);
  return writeDraft('draft-access-review',`Draft access review for ${sys.name}, to ${sys.owner||'the system owner'}. Not sent. Please confirm each person below still needs this access at this level, and name anyone to remove. Leavers are marked left.`,[{title:'Active accounts',rows}]);
 }
 if(cmd==='draft-incident-assessment'){
  allowed(o,[]);const i=await match(db,'incidents',t);const clock=(await db.query('select au_assessment_due,days_since_found from incident_clock where id=$1',[i.id]))[0];
  const facts=[{found_on:i.found_on,severity:i.severity,personal_info:i.personal_info,jurisdictions:i.jurisdictions||'',serious_harm:i.serious_harm,days_since_found:clock.days_since_found,au_assessment_due:clock.au_assessment_due||'n/a'}];
  const steps=['- What personal information was involved, and how many people?','- Has the information been contained or recovered? Who confirmed it, and when?','- Is serious harm likely? Record the reasons either way.',
   '- AU: complete the assessment within 30 days of becoming aware (Privacy Act 1988 s26WH). If serious harm is likely, notify the OAIC and the people affected as soon as practicable.','- NZ: if serious harm is likely, notify the Privacy Commissioner as soon as practicable (Privacy Act 2020 s114) and the people affected.',
   '- Read docs/compliance.md. This draft is a checklist, not legal advice.'].join('\n');
  return writeDraft('draft-incident-assessment',`Draft assessment notes for "${i.name}". Not sent and not filed. ${i.description||''}`,[{title:'Facts on record',rows:facts},{title:'Questions to answer',text:steps}]);
 }
 if(cmd==='draft-questionnaire')return draftQuestionnaire(db,o);
 fail('Unknown command '+cmd);
}
export function format(value){if(!Array.isArray(value))return JSON.stringify(value,null,2);if(!value.length)return '(none)';return table(value,Object.keys(value[0]).map(k=>({key:k,label:k,width:48,format:x=>x instanceof Date?x.toISOString().slice(0,16).replace('T',' '):typeof x==='object'&&x!==null?JSON.stringify(x):x})));}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const result=await execute(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):format(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
