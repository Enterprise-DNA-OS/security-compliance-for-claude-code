// npm test: a temporary database, the migration, the seed, every CLI command, the three importers, the reports.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {migrate} from './migrate.mjs';
import {execute,reads,commands} from './security.mjs';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'security-compliance-test-'));
process.env.DATABASE_URL=process.env.TEST_DATABASE_URL||'';process.env.DATA_DIR=path.join(temp,'db');process.env.OUTPUT_DIR=temp;
let db,checks=0;const covered=new Set();
const ok=(x,label)=>{assert.ok(x,label);checks++;};
const eq=(a,b,label)=>{assert.equal(a,b,label);checks++;};
const run=(...args)=>{covered.add(args[0]);return execute(db,args);};
const rejects=async(args,re)=>{covered.add(args[0]);await assert.rejects(()=>execute(db,args),re);checks++;};
const child=(file,args=[],expected=0)=>{const p=spawnSync(process.execPath,[file,...args],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});assert.equal(p.status,expected,p.stderr||p.stdout);checks++;return p;};
const ex=f=>path.join(REPO_ROOT,'examples',f);
const today=new Date().toISOString().slice(0,10);
try{
 db=await getDb();if(db.mode==='postgres')ok((await db.query("select table_name from information_schema.tables where table_schema='public'")).length===0,'Test database must be empty');
 await migrate(db);ok((await migrate(db)).ran.length===0,'Migration repeats safely');
 const seed=fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8');await db.exec(seed);const logs=(await run('history')).length;await db.exec(seed);
 eq((await run('controls')).length,20,'Seed is idempotent');eq((await run('history')).length,logs,'Seed repetition adds no audit events');
 for(const c of Object.keys(reads))ok(Array.isArray(await run(c)),c);

 // The checks find what the seed hides.
 const comp=await run('compliance');const has=(rule,record)=>comp.some(c=>c.rule===rule&&(!record||c.record===record));
 for(const rule of ['E8-PATCH','AU-NDB-ASSESS','ISO-SOA-JUSTIFY','ISO-MANAGEMENT-REVIEW','ISO-RISK-TREATMENT','LOCAL-OFFBOARDING','LOCAL-MFA','LOCAL-EVIDENCE','LOCAL-POLICY-REVIEW','LOCAL-ACCESS-REVIEW','LOCAL-VENDOR','LOCAL-PEOPLE'])ok(has(rule),rule);
 ok(has('ISO-SOA-JUSTIFY','KC-18')&&!has('ISO-SOA-JUSTIFY','KC-17'),'Only unjustified exclusions');ok(!has('ISO-INTERNAL-AUDIT'),'Internal audit inside its year');
 ok(!has('NZ-PRIVACY-NOTIFY')&&!has('AU-NDB-NOTIFY'),'No notification finding while harm is unknown');
 const patch=await run('patching');const p=n=>patch.find(x=>x.name===n);
 ok(p('Dashboard login bypass').rule==='ISM-1876 48 hours'&&p('Dashboard login bypass').days_over===3,'Critical online service: 48 hours');
 ok(p('Web server module flaw').rule==='ISM-1690 two weeks'&&p('Web server module flaw').days_over===6,'Online service: two weeks');
 ok(p('Browser security update').rule==='ISM-1691 two weeks'&&p('Browser security update').days_over<0,'Browser: two weeks, not yet due');
 eq(p('Server kernel update').days_over,10,'Local window from settings');ok(!p('TLS library fix'),'Fixed vulnerabilities leave the list');
 const off=await run('offboarding');ok(off.filter(o=>o.finding==='still active').length===2&&off.some(o=>o.person==='Priya Nair'&&o.finding==='removed late'&&o.days_after_leaving===5),'Leavers');
 const ready=await run('readiness');const iso=ready.find(r=>r.code==='ISO27001');ok(iso.applicable===13&&iso.excluded===3&&iso.ready===9,'ISO readiness counts');
 ok((await run('evidence-due')).some(e=>e.control_id==='KC-03'&&e.evidence_state==='expiring'),'Evidence expiring soon');
 const soa=await run('soa');ok(soa.find(s=>s.control_id==='KC-03').justification==='Treats: A leaver keeps access','Inclusion justified by its linked risk');
 ok((await run('people-gaps')).some(g=>g.name==='Lucy Wang'&&g.gap==='MFA not enabled'),'People gaps');
 ok((await run('vendor-reviews')).some(v=>v.name==='GitHub'&&v.state==='assurance report missing or expired'),'Expired assurance report');
 eq((await run('risks'))[0].name,'Only one engineer can run a deploy','Untreated risk first');
 ok((await run('access-reviews'))[0].name==='Grafana dashboards','Never reviewed first');
 ok((await run('incidents')).find(i=>i.personal_info).au_assessment_due,'Assessment clock');

 // Matching and validation.
 const sys=await run('add','systems','--name=HubSpot','--kind=saas','--data-class=confidential','--internet-facing=yes','--mfa-enforced=yes','--actor=Tom');
 eq((await run('show','systems','hubspot')).id,sys.id,'Case insensitive match');eq((await run('show','systems',sys.id.slice(0,8))).id,sys.id,'Partial id');
 eq((await run('show','controls','kc-03')).name,'Access rights granted and removed on request','Control id match');eq((await run('show','people','ana@kowhai.example')).name,'Ana Lima','Email match');
 await rejects(['show','systems','o'],/Ambiguous/);await rejects(['show','systems','Nobody'],/No match/);
 await rejects(['add','systems','--name=No actor'],/actor/);await rejects(['add','reviews','--name=Bad','--kind=internal-audit','--held-on=2026-02-30','--actor=Tom'],/real date/);
 await rejects(['add','risks','--name=Bad','--likelihood=lots','--actor=Tom'],/whole number/);await rejects(['add','systems','--name=X','--colour=red','--actor=Tom'],/Unknown option/);
 await rejects(['add','systems','--name=Y','--sso=maybe','--actor=Tom'],/yes or no/);await rejects(['add','settings','--actor=Tom'],/one row/);
 await rejects(['add','risks','--name=Z','--likelihood=9','--actor=Tom'],/check/);
 const acct=await run('add','accounts','--person-id=Lucy Wang','--system-id=HubSpot','--access-level=user',`--granted-on=${today}`,'--actor=Tom');ok(acct.person_id&&acct.system_id,'Account by names');
 eq((await run('show','accounts','Lucy Wang @ HubSpot')).id,acct.id,'Account match');

 // Evidence, access reviews, offboarding, attestations, policies.
 await rejects(['collect','KC-18','--name=Wipe log','--actor=Mere'],/excluded/);
 await run('collect','KC-08','--name=Restore test log, production database','--kind=report','--location=Drive/Security/Restore.pdf','--valid-days=365','--actor=Ana');
 ok(!(await run('compliance')).some(c=>c.rule==='LOCAL-EVIDENCE'&&c.record==='KC-08'),'Evidence clears the finding');
 let gh=await run('show','systems','GitHub');await rejects(['review-access','GitHub','--actor=Tom','--expected-version=99'],/version/);
 await rejects(['review-access','GitHub','--remove=Nobody','--actor=Tom',`--expected-version=${gh.version}`],/no active account/);
 const rev=await run('review-access','GitHub','--remove=Ben Carter','--actor=Tom',`--expected-version=${gh.version}`);ok(rev.kept===2&&rev.removed.length===1,'Access review keeps two, removes one');
 ok((await run('access-reviews')).find(a=>a.name==='GitHub').days_overdue<0,'Review date moves');
 await run('revoke','ben@kowhai.example','--actor=Tom');ok(!(await run('offboarding')).some(o=>o.finding==='still active'),'Leaver fully offboarded');
 await rejects(['revoke','Ben Carter','--actor=Tom'],/no active accounts/);
 await rejects(['attest','Sione Tupou','--actor=Mere'],/needs/);await rejects(['attest','Ben Carter','--training','--actor=Mere'],/left/);
 await run('attest','Sione Tupou','--training','--policies','--actor=Mere');ok(!(await run('people-gaps')).some(g=>g.name==='Sione Tupou'),'Attestation clears gaps');
 let pol=await run('show','policies','Acceptable Use');await rejects(['approve-policy','Acceptable Use','--actor=Mere',`--expected-version=${pol.version}`],/approved_by/);
 pol=await run('approve-policy','Acceptable Use','--approved-by=Mere Walker','--version-label=2.2','--actor=Mere',`--expected-version=${pol.version}`);eq(pol.approved_on instanceof Date?pol.approved_on.toISOString().slice(0,10):String(pol.approved_on).slice(0,10),today,'Policy approved today');
 ok((await run('people-gaps')).some(g=>g.gap.startsWith('Policies')),'A new policy approval asks staff to accept again');
 const st=(await run('settings'))[0];await run('update','settings','--other-patch-days=60','--actor=Tom',`--expected-version=${st.version}`);ok((await run('patching')).find(x=>x.name==='Server kernel update').days_over<=0,'Settings drive the windows');
 const inc=await run('show','incidents','Customer export');await run('update','incidents','Customer export','--serious-harm=yes',`--assessed-on=${today}`,'--actor=Mere',`--expected-version=${inc.version}`);
 const c2=await run('compliance');ok(c2.some(c=>c.rule==='AU-NDB-NOTIFY')&&c2.some(c=>c.rule==='NZ-PRIVACY-NOTIFY')&&!c2.some(c=>c.rule==='AU-NDB-ASSESS'),'Notification clocks follow the assessment');
 await run('log','risks','Ransomware','--body=Insurer asked for the restore test result','--actor=Mere');eq((await run('show','risks','Ransomware')).notes.length,1,'Note on a record');

 // Vanta imports.
 const vc=['import','vanta-controls',`--file=${ex('vanta-controls-iso27001.csv')}`,'--framework=ISO27001','--actor=Mere'];
 await rejects(['import','vanta-controls',`--file=${ex('vanta-controls-iso27001.csv')}`,'--actor=Mere'],/framework/);await rejects([...vc.slice(0,3),'--framework=NOPE','--actor=Mere'],/No framework/);
 await rejects([...vc],/KC-01 is already here/);
 const vfile=path.join(temp,'controls.csv');fs.writeFileSync(vfile,fs.readFileSync(ex('vanta-controls-iso27001.csv'),'utf8').split('\n').filter(l=>!l.startsWith('KC-01')).join('\n'));
 const before=(await run('controls')).length;await run('import','vanta-controls',`--file=${vfile}`,'--framework=ISO27001','--actor=Mere','--dry-run');eq((await run('controls')).length,before,'Dry run leaves no records');
 const r1=await run('import','vanta-controls',`--file=${vfile}`,'--framework=ISO27001','--actor=Mere');eq(r1.added,3,'Three controls added');
 eq((await run('show','controls','KC-21')).status,'partial','Needs attention maps to partial');eq((await run('show','controls','KC-23')).status,'not-started','Blank status is not started');
 eq((await run('import','vanta-controls',`--file=${vfile}`,'--framework=ISO27001','--actor=Mere')).unchanged,3,'Controls import is idempotent');
 const linked=await run('import','vanta-controls',`--file=${vfile}`,'--framework=SOC2','--actor=Mere');eq(linked.linked,3,'Same control from a second framework is linked, not duplicated');
 eq((await run('show','controls','KC-22')).frameworks,'ISO27001,SOC2','Both frameworks recorded');
 eq((await run('import','vanta-controls',`--file=${ex('vanta-controls-iso27001.csv')}`,'--framework=ISO27001','--update-existing','--actor=Mere')).updated,1,'Explicit update of a seeded control');
 fs.writeFileSync(vfile,'Ref,Requirement text\nKC-30,Visitors sign in\nKC-30,Again\n');await rejects(['import','vanta-controls',`--file=${vfile}`,'--framework=ISO27001',`--mapping=${ex('mapping.json')}`,'--actor=Mere'],/Duplicate/);
 eq((await run('show','controls','KC-23')).frameworks,'ISO27001,SOC2','Failed batch changes nothing');
 fs.writeFileSync(vfile,'Ref,Requirement text\nKC-30,Visitors sign in\n');eq((await run('import','vanta-controls',`--file=${vfile}`,'--framework=ISO27001',`--mapping=${ex('mapping.json')}`,'--actor=Mere')).added,1,'Custom headers through a mapping');
 const vr=['import','vanta-risks',`--file=${ex('vanta-risks.csv')}`,'--actor=Mere'];const rr=await run(...vr);eq(rr.added,2,'Risks added');eq((await run(...vr)).unchanged,2,'Risks import is idempotent');
 const cloud=await run('show','risks','Cloud account takeover');ok(cloud.likelihood===3&&cloud.impact===5&&cloud.treatment==='mitigate'&&cloud.residual_likelihood===2,'Words become scores');
 fs.writeFileSync(vfile,'Risk ID,Risk Scenario,Likelihood\nR-9,Odd,Sometimes\n');await rejects(['import','vanta-risks',`--file=${vfile}`,'--actor=Mere'],/1 to 5/);
 const vp=['import','vanta-people',`--file=${ex('vanta-people.csv')}`,'--actor=Hemi'];await rejects(vp,/already here/);
 fs.writeFileSync(vfile,'Name,Email,Start Date\nKiri Hall,kiri@kowhai.example,03/11/2026\n');await rejects(['import','vanta-people',`--file=${vfile}`,'--actor=Hemi'],/day-first/);
 eq((await run('import','vanta-people',`--file=${vfile}`,'--day-first','--actor=Hemi')).added,1,'Day-first dates');eq(String((await run('show','people','Kiri Hall')).start_date instanceof Date?(await run('show','people','Kiri Hall')).start_date.toISOString().slice(0,10):(await run('show','people','Kiri Hall')).start_date).slice(0,10),'2026-11-03','Day first parsed');
 const pr=await run(...vp,'--update-existing');ok(pr.added===1&&pr.updated===1,'People matched by email');eq((await run('show','people','Ben Carter')).status,'left','Leaver status from the end date');
 await rejects(['import','other'],/vanta-controls/);

 // Export, drafts, help, privacy, audit.
 const exported=await run('export');ok(exported.notes.length===1&&exported.audit_log.length>logs&&exported.accounts.length===13,'Full export');
 const dest=path.join(temp,'export.json');await run('export',`--file=${dest}`);await rejects(['export',`--file=${dest}`],/EEXIST/);
 for(const [c,ref] of [['weekly-review'],['draft-access-review','Google Workspace'],['draft-incident-assessment','Customer export']])ok(fs.existsSync((await run(c,...(ref?[ref]:[]))).file),c);
 const q=await run('draft-questionnaire',`--file=${ex('security-questionnaire.csv')}`);ok(q.questions===8&&q.matched>=6&&q.unmatched>=1,'Questionnaire matched to controls');
 const qtext=fs.readFileSync(q.file,'utf8');ok(qtext.includes('KC-04')&&qtext.includes('no match: answer by hand'),'Questionnaire draft names controls and gaps');
 ok(fs.readFileSync((await run('draft-incident-assessment','Customer export')).file,'utf8').includes('s26WH'),'Assessment draft cites the rule');
 eq((await run('help')).commands.length,commands.length,'Help inventory');
 const missed=commands.filter(c=>!covered.has(c));ok(!missed.length,'Every CLI command covered: '+missed.join(','));
 const names=['frameworks','controls','evidence','policies','people','vendors','systems','accounts','risks','vulnerabilities','incidents','reviews','actions','settings','notes','audit_log'];
 const tables=await db.query(`select relname,relrowsecurity from pg_class where relkind='r' and relname = any($1)`,[names]);ok(tables.length===names.length&&tables.every(x=>x.relrowsecurity),'Tables private by default');
 await assert.rejects(()=>db.query("insert into systems(name) values ('Unaudited')"),/actor/);checks++;
 const fresh=await run('show','systems','HubSpot');await run('update','systems','HubSpot','--name=HubSpot <script>alert(1)</script>',`--expected-version=${fresh.version}`,'--actor=Tom');
 await db.close();db=null;
 JSON.parse(child('scripts/security.mjs',['attention','--json']).stdout);child('scripts/security.mjs',['show','systems','o'],1);child('scripts/security.mjs',['oops'],1);
 child('scripts/view.mjs');child('scripts/docs.mjs');
 eq(fs.readdirSync(path.join(temp,'views')).length,2,'Two reports');
 for(const d of ['statement-of-applicability','risk-treatment-plan','management-review-pack','trust-summary'])eq(fs.readdirSync(path.join(temp,'docs-out',d)).length,1,d);
 const html=fs.readFileSync(path.join(temp,'views','week.html'),'utf8');ok(html.includes('Leavers')&&!html.includes('<script>alert(1)</script>'),'Reports render and escape');
 const soaHtml=fs.readFileSync(path.join(temp,'docs-out','statement-of-applicability',fs.readdirSync(path.join(temp,'docs-out','statement-of-applicability'))[0]),'utf8');ok(soaHtml.includes('KC-30')&&soaHtml.includes('Fully remote team'),'Statement of Applicability lists controls and exclusions');
 console.log(`PASS: ${checks} assertions; ${commands.length} CLI commands exercised; ${process.env.TEST_DATABASE_URL?'Postgres':'PGlite'}; isolated database.`);
}finally{if(db)await db.close();fs.rmSync(temp,{recursive:true,force:true});}
