-- Security compliance: frameworks, controls and their evidence, policies, people and their access,
-- systems, vendors, risks, vulnerabilities, incidents, reviews and corrective actions.
-- Dates are calendar dates. Every write carries an actor and lands in audit_log.

create table frameworks (id uuid primary key default gen_random_uuid(), name text not null unique check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 code text not null unique check (code ~ '^[A-Za-z0-9-]+$'), target_date date, certified_until date, auditor text, status text not null default 'in-progress' check (status in ('in-progress','certified','paused','retired')));

create table controls (id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 control_id text not null unique check (length(trim(control_id))>0), description text, domain text, frameworks text, refs text,
 status text not null default 'not-started' check (status in ('not-started','partial','implemented')), applicable boolean not null default true, justification text,
 effective_date date, last_reviewed_on date, source_id text unique, source_data jsonb);

create table evidence (id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name))>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 control_id uuid not null references controls(id), kind text not null default 'document' check (kind in ('document','screenshot','config','report','ticket','log','attestation')),
 location text, collected_on date not null, valid_days integer check (valid_days>0), collected_by text);

create table policies (id uuid primary key default gen_random_uuid(), name text not null unique check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 version_label text, approved_on date, approved_by text, review_months integer check (review_months>0), location text, staff_must_accept boolean not null default true,
 status text not null default 'draft' check (status in ('draft','approved','retired')), check (status<>'approved' or approved_on is not null));

create table people (id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 email text unique, role text, team text, start_date date, end_date date, status text not null default 'active' check (status in ('active','left')),
 background_check_on date, training_on date, policies_accepted_on date, mfa_enabled boolean, device_encrypted boolean, source_id text unique, source_data jsonb,
 check (status<>'left' or end_date is not null));

create table vendors (id uuid primary key default gen_random_uuid(), name text not null unique check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 service text, data_access text not null default 'internal' check (data_access in ('none','internal','confidential','restricted')), criticality text not null default 'medium' check (criticality in ('low','medium','high')),
 assurance text, assurance_until date, last_assessed_on date, contract_end date, status text not null default 'active' check (status in ('active','offboarded')));

create table systems (id uuid primary key default gen_random_uuid(), name text not null unique check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 kind text not null default 'saas' check (kind in ('saas','cloud','server','device','repository','network','other')), vendor_id uuid references vendors(id),
 data_class text not null default 'internal' check (data_class in ('public','internal','confidential','restricted')), internet_facing boolean not null default true, personal_info boolean not null default false,
 mfa_enforced boolean, sso boolean, backed_up boolean, last_access_review_on date, status text not null default 'active' check (status in ('active','retired')));

create table accounts (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 person_id uuid not null references people(id), system_id uuid not null references systems(id), access_level text not null default 'user' check (access_level in ('user','admin')),
 granted_on date, removed_on date, reviewed_on date, unique (person_id,system_id,access_level));

create table risks (id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 description text, category text, likelihood integer check (likelihood between 1 and 5), impact integer check (impact between 1 and 5),
 treatment text check (treatment in ('mitigate','accept','transfer','avoid')), treatment_plan text, control_refs text, residual_likelihood integer check (residual_likelihood between 1 and 5), residual_impact integer check (residual_impact between 1 and 5),
 review_on date, status text not null default 'open' check (status in ('open','closed')), source_id text unique, source_data jsonb);

create table vulnerabilities (id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 system_id uuid references systems(id), reference text, category text not null default 'online-service' check (category in ('online-service','office-browser-pdf','operating-system','other')),
 severity text not null default 'medium' check (severity in ('critical','high','medium','low')), exploit_exists boolean not null default false,
 released_on date not null, found_on date, fixed_on date, status text not null default 'open' check (status in ('open','fixed','risk-accepted')), check (status<>'fixed' or fixed_on is not null));

create table incidents (id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 occurred_on date, found_on date not null, severity text not null default 'medium' check (severity in ('low','medium','high')), description text,
 personal_info boolean not null default false, jurisdictions text, serious_harm text not null default 'unknown' check (serious_harm in ('yes','no','unknown')),
 assessed_on date, regulator_notified_on date, individuals_notified_on date, root_cause text, closed_on date, status text not null default 'open' check (status in ('open','closed')));

create table reviews (id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 kind text not null check (kind in ('internal-audit','management-review','external-audit','penetration-test','restore-test','tabletop')), framework_code text, held_on date not null, outcome text);

create table actions (id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 source text, due_on date, done_on date, status text not null default 'open' check (status in ('open','done')), check (status<>'done' or done_on is not null));

-- The rules the team enforces. One row. Change it with /customise or update settings.
create table settings (id integer primary key default 1 check (id=1),
 evidence_valid_days integer not null default 365, evidence_warning_days integer not null default 30, access_review_days integer not null default 90, policy_review_months integer not null default 12,
 training_months integer not null default 12, vendor_review_months integer not null default 12, offboard_days integer not null default 1, internal_audit_months integer not null default 12,
 management_review_months integer not null default 12, penetration_test_months integer not null default 12, restore_test_months integer not null default 12, other_patch_days integer not null default 30,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1);
insert into settings(id) values (1);

create table notes (id uuid primary key default gen_random_uuid(), entity text not null, record_id uuid not null, body text not null, actor text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table audit_log (id uuid primary key default gen_random_uuid(), entity text not null, record_id text not null, action text not null, actor text not null, before_data jsonb, after_data jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create function record_change() returns trigger language plpgsql as $$
declare who text;
begin
 who := nullif(current_setting('app.actor', true),'');
 if who is null then raise exception 'An actor is required'; end if;
 insert into audit_log(entity,record_id,action,actor,before_data,after_data) values (TG_TABLE_NAME,NEW.id::text,TG_OP,who,case when TG_OP='UPDATE' then to_jsonb(OLD) else null end,to_jsonb(NEW));
 return NEW;
end $$;
create function touch_record() returns trigger language plpgsql as $$ begin NEW.updated_at=now(); NEW.version=OLD.version+1; return NEW; end $$;

do $$ declare t text; begin
 foreach t in array array['frameworks','controls','evidence','policies','people','vendors','systems','accounts','risks','vulnerabilities','incidents','reviews','actions','settings'] loop
  execute format('create trigger track_%1$s after insert or update on %1$s for each row execute function record_change()', t);
  execute format('create trigger touch_%1$s before update on %1$s for each row execute function touch_record()', t);
 end loop;
 foreach t in array array['frameworks','controls','evidence','policies','people','vendors','systems','accounts','risks','vulnerabilities','incidents','reviews','actions','settings','notes','audit_log'] loop
  execute format('alter table %1$s enable row level security', t);
  execute format('revoke all on %1$s from public', t);
 end loop;
end $$;

-- Each control with the state of its evidence. Evidence counts while collected_on + valid_days is in the future.
create view control_status as
with s as (select * from settings where id=1),
e as (select control_id, count(*)::int as items, max(collected_on) as last_collected, max(collected_on+coalesce(valid_days,(select evidence_valid_days from s))) as expires_on from evidence group by control_id)
select c.id, c.control_id, c.name, c.description, c.domain, c.owner, c.frameworks, c.refs, c.status, c.applicable, c.justification, c.last_reviewed_on,
 coalesce(e.items,0) as evidence_items, e.last_collected, e.expires_on,
 case when not c.applicable then 'not applicable' when e.items is null then 'none' when e.expires_on<current_date then 'stale'
  when e.expires_on<=current_date+(select evidence_warning_days from s) then 'expiring' else 'current' end as evidence_state,
 c.version
from controls c left join e on e.control_id=c.id;

-- Readiness per framework: applicable controls that are implemented with current evidence.
create view readiness as
select f.id, f.name, f.code, f.status, f.auditor, f.target_date, f.target_date-current_date as days_to_target, f.certified_until,
 count(c.id) filter (where c.applicable)::int as applicable, count(c.id) filter (where not c.applicable)::int as excluded,
 count(c.id) filter (where c.applicable and c.status='implemented')::int as implemented,
 count(c.id) filter (where c.applicable and c.status='implemented' and c.evidence_state in ('current','expiring'))::int as ready,
 count(c.id) filter (where c.applicable and c.evidence_state in ('none','stale'))::int as evidence_gaps,
 case when count(c.id) filter (where c.applicable)=0 then null else round(100.0*count(c.id) filter (where c.applicable and c.status='implemented' and c.evidence_state in ('current','expiring'))/count(c.id) filter (where c.applicable))::int end as ready_pct
from frameworks f left join control_status c on upper(f.code)=any(string_to_array(upper(replace(coalesce(c.frameworks,''),' ','')),','))
group by f.id;

create view people_gaps as
with s as (select * from settings where id=1)
select p.id, p.name, p.role, p.team, p.start_date, g.gap
from people p cross join s cross join lateral (values
 ('Security training missing or older than the training period', p.training_on is null or p.training_on<current_date-make_interval(months=>s.training_months)),
 ('Policies not accepted since the last policy approval', p.policies_accepted_on is null or p.policies_accepted_on<(select max(approved_on) from policies where status='approved' and staff_must_accept)),
 ('No background check recorded', p.background_check_on is null),
 ('MFA not enabled', p.mfa_enabled is not true),
 ('Device encryption not confirmed', p.device_encrypted is not true)
) as g(gap, open)
where p.status='active' and g.open;

create view account_list as
select a.id, p.name as person, p.status as person_status, p.end_date, s.name as system, s.owner as system_owner, a.access_level, a.granted_on, a.removed_on, a.reviewed_on, a.version
from accounts a join people p on p.id=a.person_id join systems s on s.id=a.system_id;

-- Leavers who still have access, and access removed later than the offboarding window.
create view offboarding as
select person, end_date, system, access_level, removed_on,
 case when removed_on is null then current_date-end_date else removed_on-end_date end as days_after_leaving,
 case when removed_on is null then 'still active' else 'removed late' end as finding
from account_list where end_date is not null and end_date<=current_date
 and (removed_on is null or removed_on-end_date>(select offboard_days from settings));

create view access_review_status as
select s.id, s.name, s.owner, s.data_class, s.last_access_review_on, s.last_access_review_on+(select access_review_days from settings) as next_review,
 current_date-(s.last_access_review_on+(select access_review_days from settings)) as days_overdue, s.last_access_review_on is null as never_reviewed,
 (select count(*)::int from accounts a where a.system_id=s.id and a.removed_on is null) as active_accounts,
 (select count(*)::int from accounts a where a.system_id=s.id and a.removed_on is null and a.access_level='admin') as admins
from systems s where s.status='active';

create view vendor_status as
with s as (select * from settings where id=1)
select v.id, v.name, v.owner, v.service, v.criticality, v.data_access, v.assurance, v.assurance_until, v.last_assessed_on,
 (v.last_assessed_on+make_interval(months=>s.vendor_review_months))::date as next_assessment, v.contract_end,
 case when v.last_assessed_on is null then 'never assessed' when (v.last_assessed_on+make_interval(months=>s.vendor_review_months))::date<current_date then 'assessment overdue'
  when v.data_access in ('confidential','restricted') and (v.assurance_until is null or v.assurance_until<current_date) then 'assurance report missing or expired' else 'ok' end as state
from vendors v cross join s where v.status='active';

create view risk_register as
select r.id, r.name, r.owner, r.category, r.likelihood, r.impact, r.likelihood*r.impact as inherent, r.treatment, r.control_refs,
 r.residual_likelihood, r.residual_impact, r.residual_likelihood*r.residual_impact as residual, r.review_on, r.status, r.treatment_plan
from risks r;

-- Patch timeframes from the Essential Eight maturity model (ISM-1876, ISM-1690, ISM-1691). Other software uses settings.other_patch_days.
create view patch_status as
select v.id, v.name, v.reference, s.name as system, v.category, v.severity, v.exploit_exists, v.released_on, v.found_on, v.status, v.fixed_on,
 x.rule, v.released_on+x.days as due_on, coalesce(v.fixed_on,current_date)-(v.released_on+x.days) as days_over
from vulnerabilities v left join systems s on s.id=v.system_id cross join lateral (select
 case when v.category='online-service' and (v.severity='critical' or v.exploit_exists) then 'ISM-1876 48 hours'
  when v.category='online-service' then 'ISM-1690 two weeks' when v.category='office-browser-pdf' then 'ISM-1691 two weeks' else 'Local patch window' end as rule,
 case when v.category='online-service' and (v.severity='critical' or v.exploit_exists) then 2 when v.category in ('online-service','office-browser-pdf') then 14
  else (select other_patch_days from settings) end as days) x;

-- Personal information incidents and the notification clocks they start.
create view incident_clock as
select i.id, i.name, i.owner, i.found_on, i.severity, i.personal_info, i.jurisdictions, i.serious_harm, i.assessed_on, i.regulator_notified_on, i.individuals_notified_on, i.status,
 case when upper(coalesce(i.jurisdictions,'')) like '%AU%' then i.found_on+30 end as au_assessment_due,
 current_date-i.found_on as days_since_found
from incidents i;

create view review_calendar as
with s as (select * from settings where id=1), k(kind, months) as (select * from (values ('internal-audit',(select internal_audit_months from s)),('management-review',(select management_review_months from s)),
 ('penetration-test',(select penetration_test_months from s)),('restore-test',(select restore_test_months from s))) v)
select k.kind, max(r.held_on) as last_held, (max(r.held_on)+make_interval(months=>k.months))::date as next_due,
 current_date-(max(r.held_on)+make_interval(months=>k.months))::date as days_overdue
from k left join reviews r on r.kind=k.kind group by k.kind, k.months;

create view compliance_findings as
select 'E8-PATCH' as rule, name as record, system as area, rule||': due '||due_on||', '||days_over||' days over' as finding from patch_status where status='open' and days_over>0
union all select 'AU-NDB-ASSESS', name, coalesce(jurisdictions,''), 'Assessment of a suspected eligible data breach due '||au_assessment_due||case when au_assessment_due<current_date then ' (passed)' else '' end
 from incident_clock where personal_info and au_assessment_due is not null and assessed_on is null and status='open' and au_assessment_due<=current_date+7
union all select 'AU-NDB-NOTIFY', name, coalesce(jurisdictions,''), 'Likely serious harm recorded and the OAIC not notified' from incident_clock where personal_info and serious_harm='yes' and upper(coalesce(jurisdictions,'')) like '%AU%' and regulator_notified_on is null
union all select 'NZ-PRIVACY-NOTIFY', name, coalesce(jurisdictions,''), 'Serious harm likely and the Privacy Commissioner not notified, '||days_since_found||' days since found' from incident_clock where personal_info and serious_harm='yes' and upper(coalesce(jurisdictions,'')) like '%NZ%' and regulator_notified_on is null
union all select 'ISO-SOA-JUSTIFY', control_id, coalesce(frameworks,''), 'Excluded from the Statement of Applicability with no justification' from controls where not applicable and nullif(trim(coalesce(justification,'')),'') is null
union all select 'ISO-INTERNAL-AUDIT', kind, 'reviews', coalesce('Last held '||last_held||', due '||next_due,'Never held') from review_calendar where kind='internal-audit' and (last_held is null or days_overdue>0)
union all select 'ISO-MANAGEMENT-REVIEW', kind, 'reviews', coalesce('Last held '||last_held||', due '||next_due,'Never held') from review_calendar where kind='management-review' and (last_held is null or days_overdue>0)
union all select 'ISO-RISK-TREATMENT', name, 'risks', 'Open risk with no owner or no treatment chosen' from risks where status='open' and (owner is null or treatment is null)
union all select 'LOCAL-OFFBOARDING', person, system, finding||', '||days_after_leaving||' days after leaving' from offboarding
union all select 'LOCAL-MFA', name, 'systems', 'Internet-facing system without MFA enforced' from systems where status='active' and internet_facing and mfa_enforced is not true
union all select 'LOCAL-EVIDENCE', control_id, coalesce(frameworks,''), 'Marked implemented with '||case evidence_state when 'none' then 'no' else evidence_state end||' evidence' from control_status where applicable and status='implemented' and evidence_state in ('none','stale')
union all select 'LOCAL-POLICY-REVIEW', name, 'policies', coalesce('Approved '||approved_on||', review was due '||(approved_on+make_interval(months=>coalesce(review_months,(select policy_review_months from settings))))::date,'Never approved')
 from policies where status<>'retired' and (approved_on is null or (approved_on+make_interval(months=>coalesce(review_months,(select policy_review_months from settings))))::date<current_date)
union all select 'LOCAL-ACCESS-REVIEW', name, 'systems', coalesce('Last reviewed '||last_access_review_on||', '||days_overdue||' days overdue','Never reviewed') from access_review_status where (never_reviewed or days_overdue>0) and active_accounts>0
union all select 'LOCAL-VENDOR', name, 'vendors', state from vendor_status where state<>'ok' and criticality in ('medium','high')
union all select 'LOCAL-PEOPLE', name, 'people', gap from people_gaps where gap like 'Security training%' or gap like 'Policies%';
