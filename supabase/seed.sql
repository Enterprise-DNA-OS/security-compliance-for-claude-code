-- Fictional demo records for Kowhai Cloud, a 40-person software company selling to NZ and AU customers. Dates move with today.
-- Deliberate problems: a leaver who still has admin access, access removed late, stale and missing evidence, an exclusion
-- with no justification, an overdue management review, a critical patch past 48 hours, an incident whose 30-day assessment
-- clock is running, a vendor whose assurance report expired, a policy past its review, a system without MFA, a risk with no owner.
begin;
select set_config('app.actor','Demo seed',true);
insert into frameworks(id,name,owner,code,target_date,certified_until,auditor,status) values
('10000000-0000-0000-0000-000000000001','ISO/IEC 27001:2022','Mere','ISO27001',current_date+120,null,'Example Certification Ltd','in-progress'),
('10000000-0000-0000-0000-000000000002','Essential Eight Maturity Level One','Tom','E8',current_date+60,null,null,'in-progress'),
('10000000-0000-0000-0000-000000000003','SOC 2 Type II','Mere','SOC2',current_date+240,null,null,'in-progress') on conflict(id) do nothing;

insert into controls(id,control_id,name,owner,description,domain,frameworks,refs,status,applicable,justification,effective_date,last_reviewed_on) values
('20000000-0000-0000-0000-000000000001','KC-01','Information security policy','Mere','A security policy approved by the directors, published to staff and reviewed every year.','Governance','ISO27001,SOC2','ISO 27001 A.5.1; SOC 2 CC1','implemented',true,null,current_date-400,current_date-60),
('20000000-0000-0000-0000-000000000002','KC-02','Security roles and responsibilities','Mere','Named owners for security, privacy and each system.','Governance','ISO27001,SOC2','ISO 27001 A.5.2','implemented',true,null,current_date-400,current_date-300),
('20000000-0000-0000-0000-000000000003','KC-03','Access rights granted and removed on request','Tom','Access is approved by the system owner, reviewed every 90 days and removed within one day of leaving.','Access','ISO27001,E8,SOC2','ISO 27001 A.5.18; E8 restrict administrative privileges; SOC 2 CC6','implemented',true,null,current_date-400,current_date-90),
('20000000-0000-0000-0000-000000000004','KC-04','Multi-factor authentication','Tom','MFA on every internet-facing system and for every administrator.','Access','ISO27001,E8,SOC2','ISO 27001 A.8.5; E8 multi-factor authentication','implemented',true,null,current_date-300,current_date-40),
('20000000-0000-0000-0000-000000000005','KC-05','Patch applications','Tom','Online services, browsers, office and PDF software patched inside the Essential Eight timeframes.','Operations','ISO27001,E8','ISO 27001 A.8.8; E8 patch applications','partial',true,null,current_date-200,current_date-30),
('20000000-0000-0000-0000-000000000006','KC-06','Patch operating systems','Tom','Laptop and server operating systems patched inside the agreed window.','Operations','E8','E8 patch operating systems','partial',true,null,current_date-200,current_date-30),
('20000000-0000-0000-0000-000000000007','KC-07','Regular backups','Ana','Daily backups of production data, kept 35 days, separate from the production account.','Operations','ISO27001,E8,SOC2','ISO 27001 A.8.13; E8 regular backups','implemented',true,null,current_date-350,current_date-50),
('20000000-0000-0000-0000-000000000008','KC-08','Backup restore tested','Ana','A restore from backup is tested and timed at least once a year.','Operations','ISO27001,E8','ISO 27001 A.8.13; E8 regular backups','implemented',true,null,current_date-350,null),
('20000000-0000-0000-0000-000000000009','KC-09','Application control','Tom','Only approved programs run on staff laptops.','Endpoint','E8','E8 application control','not-started',true,null,null,null),
('20000000-0000-0000-0000-000000000010','KC-10','Office macros restricted','Tom','Macros from the internet are blocked.','Endpoint','E8','E8 configure Microsoft Office macro settings','implemented',true,null,current_date-150,current_date-20),
('20000000-0000-0000-0000-000000000011','KC-11','Browser hardening','Tom','Browsers block ads and Java from the internet; settings cannot be changed by users.','Endpoint','E8','E8 user application hardening','partial',true,null,current_date-150,current_date-20),
('20000000-0000-0000-0000-000000000012','KC-12','Supplier security','Mere','Suppliers that hold our data are assessed before use and every year after.','Suppliers','ISO27001,SOC2','ISO 27001 A.5.19; SOC 2 CC9','implemented',true,null,current_date-300,current_date-100),
('20000000-0000-0000-0000-000000000013','KC-13','Security awareness training','Mere','Every person completes security training at start and every year.','People','ISO27001,SOC2','ISO 27001 A.6.3; SOC 2 CC2','implemented',true,null,current_date-300,current_date-70),
('20000000-0000-0000-0000-000000000014','KC-14','Screening before employment','Hemi','Background, reference and identity checks before a start date.','People','ISO27001,SOC2','ISO 27001 A.6.1','implemented',true,null,current_date-300,current_date-70),
('20000000-0000-0000-0000-000000000015','KC-15','Incident management','Mere','Incidents logged, assessed and closed with a root cause. Privacy incidents are assessed, and customers and regulators notified when the law requires it.','Incidents','ISO27001,SOC2','ISO 27001 A.5.24 to A.5.27; SOC 2 CC7','implemented',true,null,current_date-300,current_date-60),
('20000000-0000-0000-0000-000000000016','KC-16','Logging and monitoring','Ana','Production access and admin actions logged and kept 12 months.','Operations','ISO27001,SOC2','ISO 27001 A.8.15; SOC 2 CC7','partial',true,null,current_date-200,current_date-30),
('20000000-0000-0000-0000-000000000017','KC-17','Physical entry controls','Mere','Office entry controls.','Physical','ISO27001','ISO 27001 A.7.2','not-started',false,'Fully remote team. No office or server room; production runs in AWS.',null,current_date-60),
('20000000-0000-0000-0000-000000000018','KC-18','Secure disposal of equipment','Mere','Laptops wiped before disposal or reuse.','Physical','ISO27001','ISO 27001 A.7.14','not-started',false,null,null,null),
('20000000-0000-0000-0000-000000000019','KC-19','Clean desk and clear screen','Mere','Screens lock after five minutes.','Physical','ISO27001','ISO 27001 A.7.7','not-started',false,'Remote team; screen lock is enforced by device management under KC-11.',null,current_date-60),
('20000000-0000-0000-0000-000000000020','KC-20','Change management','Ana','Production changes go through pull request review and a deploy log.','Operations','ISO27001,SOC2','ISO 27001 A.8.32; SOC 2 CC8','implemented',true,null,current_date-300,current_date-30) on conflict(id) do nothing;

insert into evidence(id,control_id,name,kind,location,collected_on,valid_days,collected_by) values
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Board minute approving the security policy','document','Drive/Security/Board minute.pdf',current_date-200,365,'Mere'),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Security roles register','document','Drive/Security/Roles.xlsx',current_date-400,365,'Mere'),
('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003','Quarterly access review, AWS','report','Drive/Security/Access review AWS.pdf',current_date-345,365,'Tom'),
('30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000004','Google Workspace 2-step enforcement setting','screenshot','Drive/Security/MFA enforced.png',current_date-40,180,'Tom'),
('30000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000007','Backup job configuration','config','Drive/Security/Backups.json',current_date-50,180,'Ana'),
('30000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000010','Macro policy from device management','config','Drive/Security/Macros.png',current_date-20,180,'Tom'),
('30000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000012','Supplier assessment register','report','Drive/Security/Suppliers.xlsx',current_date-100,365,'Mere'),
('30000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000013','Training completion export','report','Drive/Security/Training.csv',current_date-70,365,'Mere'),
('30000000-0000-0000-0000-000000000009','20000000-0000-0000-0000-000000000014','Screening checklist, last three hires','document','Drive/People/Screening.pdf',current_date-70,365,'Hemi'),
('30000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000015','Incident register export','report','Drive/Security/Incidents.csv',current_date-60,365,'Mere'),
('30000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000020','Branch protection settings','screenshot','Drive/Security/Branch protection.png',current_date-30,180,'Ana') on conflict(id) do nothing;

insert into policies(id,name,owner,version_label,approved_on,approved_by,review_months,location,staff_must_accept,status) values
('40000000-0000-0000-0000-000000000001','Information Security Policy','Mere','3.0',current_date-200,'Board',12,'Drive/Policies/Information Security Policy.docx',true,'approved'),
('40000000-0000-0000-0000-000000000002','Acceptable Use Policy','Mere','2.1',current_date-420,'Mere Walker',12,'Drive/Policies/Acceptable Use.docx',true,'approved'),
('40000000-0000-0000-0000-000000000003','Access Control Policy','Tom','1.4',current_date-100,'Mere Walker',12,'Drive/Policies/Access Control.docx',true,'approved'),
('40000000-0000-0000-0000-000000000004','Incident Response Plan','Mere','2.0',current_date-300,'Mere Walker',12,'Drive/Policies/Incident Response.docx',true,'approved'),
('40000000-0000-0000-0000-000000000005','Backup and Restore Policy','Ana','0.3',null,null,12,'Drive/Policies/Backup draft.docx',true,'draft'),
('40000000-0000-0000-0000-000000000006','Supplier Security Policy','Mere','1.0',current_date-30,'Mere Walker',24,'Drive/Policies/Supplier Security.docx',false,'approved') on conflict(id) do nothing;

insert into people(id,name,email,role,team,start_date,end_date,status,background_check_on,training_on,policies_accepted_on,mfa_enabled,device_encrypted) values
('50000000-0000-0000-0000-000000000001','Mere Walker','mere@kowhai.example','Chief Operating Officer','Leadership',current_date-1500,null,'active',current_date-1510,current_date-70,current_date-95,true,true),
('50000000-0000-0000-0000-000000000002','Tom Fraser','tom@kowhai.example','Platform Lead','Engineering',current_date-1200,null,'active',current_date-1210,current_date-70,current_date-95,true,true),
('50000000-0000-0000-0000-000000000003','Ana Lima','ana@kowhai.example','Senior Engineer','Engineering',current_date-800,null,'active',current_date-810,current_date-70,current_date-95,true,true),
('50000000-0000-0000-0000-000000000004','Hemi Parata','hemi@kowhai.example','People and Culture','Operations',current_date-600,null,'active',current_date-610,current_date-70,current_date-95,true,true),
('50000000-0000-0000-0000-000000000005','Sione Tupou','sione@kowhai.example','Support Lead','Customer',current_date-700,null,'active',current_date-710,current_date-500,current_date-150,true,true),
('50000000-0000-0000-0000-000000000006','Lucy Wang','lucy@kowhai.example','Account Manager','Sales',current_date-45,null,'active',null,current_date-40,current_date-40,false,true),
('50000000-0000-0000-0000-000000000007','Ben Carter','ben@kowhai.example','DevOps Engineer','Engineering',current_date-900,current_date-20,'left',current_date-910,current_date-200,current_date-150,true,true),
('50000000-0000-0000-0000-000000000008','Priya Nair','priya@kowhai.example','Support Engineer','Customer',current_date-500,current_date-60,'left',current_date-510,current_date-150,current_date-150,true,true) on conflict(id) do nothing;

insert into vendors(id,name,owner,service,data_access,criticality,assurance,assurance_until,last_assessed_on,contract_end,status) values
('60000000-0000-0000-0000-000000000001','Amazon Web Services','Tom','Production hosting','restricted','high','SOC 2 Type II report',current_date+200,current_date-100,null,'active'),
('60000000-0000-0000-0000-000000000002','Google Workspace','Mere','Email, documents, identity','confidential','high','ISO 27001 certificate',current_date+150,current_date-300,null,'active'),
('60000000-0000-0000-0000-000000000003','GitHub','Tom','Source code and deploys','confidential','high','SOC 2 Type II report',current_date-20,current_date-200,null,'active'),
('60000000-0000-0000-0000-000000000004','Xero','Hemi','Accounting','confidential','medium',null,null,null,null,'active'),
('60000000-0000-0000-0000-000000000005','Slack','Mere','Team chat','internal','medium','SOC 2 Type II report',current_date+90,current_date-400,null,'active') on conflict(id) do nothing;

insert into systems(id,name,owner,kind,vendor_id,data_class,internet_facing,personal_info,mfa_enforced,sso,backed_up,last_access_review_on) values
('70000000-0000-0000-0000-000000000001','AWS production','Tom','cloud','60000000-0000-0000-0000-000000000001','restricted',true,true,true,true,true,current_date-40),
('70000000-0000-0000-0000-000000000002','Google Workspace','Mere','saas','60000000-0000-0000-0000-000000000002','confidential',true,true,true,null,true,current_date-120),
('70000000-0000-0000-0000-000000000003','GitHub','Tom','repository','60000000-0000-0000-0000-000000000003','confidential',true,false,true,true,true,current_date-95),
('70000000-0000-0000-0000-000000000004','Xero','Hemi','saas','60000000-0000-0000-0000-000000000004','confidential',true,true,true,false,true,current_date-30),
('70000000-0000-0000-0000-000000000005','Grafana dashboards','Ana','server',null,'internal',true,false,false,false,false,null) on conflict(id) do nothing;

insert into accounts(id,person_id,system_id,access_level,granted_on,removed_on,reviewed_on) values
('80000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000001','admin',current_date-1200,null,current_date-40),
('80000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000001','user',current_date-800,null,current_date-40),
('80000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000007','70000000-0000-0000-0000-000000000003','admin',current_date-900,null,current_date-95),
('80000000-0000-0000-0000-000000000004','50000000-0000-0000-0000-000000000007','70000000-0000-0000-0000-000000000002','user',current_date-900,null,current_date-120),
('80000000-0000-0000-0000-000000000005','50000000-0000-0000-0000-000000000008','70000000-0000-0000-0000-000000000002','user',current_date-500,current_date-55,current_date-120),
('80000000-0000-0000-0000-000000000006','50000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000002','admin',current_date-1500,null,current_date-120),
('80000000-0000-0000-0000-000000000007','50000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000003','admin',current_date-1200,null,current_date-95),
('80000000-0000-0000-0000-000000000008','50000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000003','user',current_date-800,null,current_date-95),
('80000000-0000-0000-0000-000000000009','50000000-0000-0000-0000-000000000004','70000000-0000-0000-0000-000000000004','admin',current_date-600,null,current_date-30),
('80000000-0000-0000-0000-000000000010','50000000-0000-0000-0000-000000000005','70000000-0000-0000-0000-000000000002','user',current_date-700,null,current_date-120),
('80000000-0000-0000-0000-000000000011','50000000-0000-0000-0000-000000000006','70000000-0000-0000-0000-000000000002','user',current_date-45,null,null),
('80000000-0000-0000-0000-000000000012','50000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000005','admin',current_date-400,null,null) on conflict(id) do nothing;

insert into risks(id,name,owner,description,category,likelihood,impact,treatment,treatment_plan,control_refs,residual_likelihood,residual_impact,review_on,status) values
('90000000-0000-0000-0000-000000000001','Ransomware encrypts production data','Tom','An attacker encrypts production and backups.','Operations',4,5,'mitigate','Backups held separately, restore test, patching inside Essential Eight windows.','KC-05,KC-07,KC-08',2,4,current_date+30,'open'),
('90000000-0000-0000-0000-000000000002','A leaver keeps access','Tom','Former staff still hold accounts after leaving.','Access',3,4,'mitigate','Offboarding checklist, access removed within a day, 90-day reviews.','KC-03',2,3,current_date-10,'open'),
('90000000-0000-0000-0000-000000000003','A key supplier is breached','Mere','A supplier holding customer data is breached.','Suppliers',2,5,'transfer','Assurance reports reviewed yearly, cyber insurance.','KC-12',2,3,current_date+90,'open'),
('90000000-0000-0000-0000-000000000004','Laptop lost with customer data','Hemi','A laptop is lost or stolen.','Endpoint',3,3,'mitigate','Full disk encryption and remote wipe.','KC-11',1,2,current_date+60,'open'),
('90000000-0000-0000-0000-000000000005','Staff credential phished','Mere','A staff password is phished and reused.','People',4,4,'mitigate','MFA everywhere, training, phishing reporting.','KC-04,KC-13',2,3,current_date+45,'open'),
('90000000-0000-0000-0000-000000000006','Only one engineer can run a deploy',null,'Deploy knowledge sits with one person.','Operations',3,3,null,null,null,null,null,null,'open') on conflict(id) do nothing;

insert into vulnerabilities(id,name,owner,system_id,reference,category,severity,exploit_exists,released_on,found_on,fixed_on,status) values
('a0000000-0000-0000-0000-000000000001','Dashboard login bypass','Ana','70000000-0000-0000-0000-000000000005','Vendor advisory DEMO-2026-01','online-service','critical',true,current_date-5,current_date-4,null,'open'),
('a0000000-0000-0000-0000-000000000002','Web server module flaw','Tom','70000000-0000-0000-0000-000000000001','Vendor advisory DEMO-2026-02','online-service','high',false,current_date-20,current_date-18,null,'open'),
('a0000000-0000-0000-0000-000000000003','Browser security update','Tom',null,'Browser release DEMO-2026-03','office-browser-pdf','high',false,current_date-10,current_date-9,null,'open'),
('a0000000-0000-0000-0000-000000000004','Server kernel update','Tom','70000000-0000-0000-0000-000000000001','Distribution notice DEMO-2026-04','operating-system','medium',false,current_date-40,current_date-35,null,'open'),
('a0000000-0000-0000-0000-000000000005','TLS library fix','Tom','70000000-0000-0000-0000-000000000001','Vendor advisory DEMO-2026-05','online-service','high',false,current_date-30,current_date-29,current_date-14,'fixed') on conflict(id) do nothing;

insert into incidents(id,name,owner,occurred_on,found_on,severity,description,personal_info,jurisdictions,serious_harm,assessed_on,regulator_notified_on,individuals_notified_on,root_cause,closed_on,status) values
('b0000000-0000-0000-0000-000000000001','Customer export sent to the wrong client','Mere',current_date-26,current_date-25,'high','A support export with 214 contact records was emailed to another customer. Deletion confirmed by the recipient is pending.',true,'NZ,AU','unknown',null,null,null,null,null,'open'),
('b0000000-0000-0000-0000-000000000002','Phishing link clicked','Tom',current_date-61,current_date-60,'low','One staff member entered a password on a phishing page. MFA blocked the sign-in; password reset.',false,null,'no',current_date-60,null,null,'Look-alike domain in a supplier invoice email.',current_date-58,'closed') on conflict(id) do nothing;

insert into reviews(id,name,owner,kind,framework_code,held_on,outcome) values
('c0000000-0000-0000-0000-000000000001','Internal audit of access and supplier controls','Mere','internal-audit','ISO27001',current_date-300,'Two minor findings, both actioned.'),
('c0000000-0000-0000-0000-000000000002','Management review','Mere','management-review','ISO27001',current_date-420,'Risk appetite confirmed; budget for device management approved.'),
('c0000000-0000-0000-0000-000000000003','External penetration test of the customer app','Tom','penetration-test',null,current_date-200,'One medium finding, fixed.') on conflict(id) do nothing;

insert into actions(id,name,owner,source,due_on,done_on,status) values
('d0000000-0000-0000-0000-000000000001','Rotate GitHub deploy keys','Tom','Internal audit',current_date-10,null,'open'),
('d0000000-0000-0000-0000-000000000002','Enable MFA on Grafana','Ana','Risk review',current_date-3,null,'open'),
('d0000000-0000-0000-0000-000000000003','Write and test the backup restore runbook','Ana','Internal audit',current_date+14,null,'open'),
('d0000000-0000-0000-0000-000000000004','Fix the medium penetration test finding','Tom','Penetration test',current_date-180,current_date-185,'done') on conflict(id) do nothing;
commit;
