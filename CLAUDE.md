# Security Compliance for Claude Code: operating instructions

This file is the brain. Claude Code reads it at the start of every session. It says who this is for, how work gets done, and the one right way to do each recurring job.

## Who this is for

- **Business:** [YOUR BUSINESS]
- **Operator:** [YOUR NAME], [your role]
- **What matters most:** [the one or two outcomes you care about]

Fill this in once. A worker with context knows. A worker without it guesses.

## How to work

1. **Take a brief, not a script.** The operator describes the outcome. You run the right command and present the answer.
2. **Read before you write.** Before drafting anything about a record, read its full history first.
3. **Plain language.** Short sentences. No filler. Numbers in tables.
4. **Silent success, loud problems.** No play-by-play. Say what broke and what you did about it.
5. **Stop at the line.** Anything that sends, deletes, or faces a customer waits for a yes in this session.

## Routing table: one right way for each recurring job

| When the operator asks for... | Use this |
|---|---|
| Show how ready each framework is: applicable controls, implemented, with current evidence, and days to the audit | /readiness |
| Find what needs attention: leavers with access, late patches, privacy incidents, overdue actions, stale evidence, reviews and suppliers | /attention |
| Check the records against the Essential Eight patch windows, the privacy breach clocks, ISO 27001 and your own rules, with sources | /compliance |
| Draft the Monday security compliance review | /weekly-review |
| List applicable controls not implemented, or implemented with stale or missing evidence | /control-gaps |
| Read the Statement of Applicability: every ISO 27001 control, included or excluded, and why | /soa |
| Find controls whose evidence is missing, stale or expiring within the warning window | /evidence-due |
| Record a piece of evidence against a control | /collect |
| Find leavers who still have access, and access removed later than the offboarding window | /offboarding |
| Find systems whose access review is overdue or has never happened | /access-reviews |
| Draft the access review request to a system owner, listing every active account | /draft-access-review |
| Record a completed access review: everyone kept is marked reviewed, anyone named loses access today | /review-access |
| List every administrator account, by system | /admins |
| Find active people missing training, policy acceptance, a background check, MFA or device encryption | /people-gaps |
| Record that a person completed security training or accepted the policies | /attest |
| Find policies never approved or due for review within 30 days | /policies-due |
| Record a policy approval: who approved it, the version, today's date | /approve-policy |
| Find suppliers never assessed, overdue for assessment, or holding confidential data without a current assurance report | /vendor-reviews |
| Read the open risk register, highest residual risk first | /risks |
| List open vulnerabilities against the Essential Eight patch timeframes | /patching |
| Read incidents with the personal information clocks: the AU 30-day assessment and notification status | /incidents |
| Draft the assessment notes for a suspected data breach: facts on record, the clocks, the questions to answer | /draft-incident-assessment |
| List open corrective actions, overdue first | /actions |
| Show when the internal audit, management review, penetration test and restore test were last held and when each is due | /review-calendar |
| Draft answers to a customer security questionnaire from the control register and evidence | /draft-questionnaire |
| Read the policies with version, approval date and next review | /policies |
| Read everyone with role, status, training, policy acceptance and MFA | /people |
| Record that a person's access has been removed, on one system or all of them | /revoke |
| Read who has access to each system and at what level | /accounts |
| Read the systems with data class, internet exposure, MFA, SSO and backups | /systems |
| Read the suppliers with criticality, data access, assurance report and next assessment | /vendors |
| Read one record with its history, notes, evidence or accounts | /show |
| Add a framework, control, policy, person, system, account, vendor, risk, vulnerability, incident, review or action | /add |
| Update a record with a version check | /update |
| Add a note to any record | /log |
| Bring controls, the risk register and people across from Vanta's CSV exports | /import |
| Export every record, note and change | /export |
| Read every recorded change and who made it | /history |
| Read the windows the checks use: evidence life, review periods, offboarding days, patch window | /settings |
| Read the CLI commands and editable fields | /help |
| Add a field, rename a status or change a rule through a tested migration | /customise |
| Add a branded read-only report from a plain-language description | /new-view |

If an ask fits nothing here, run the CLI directly (`npm run security -- help`) and then propose a new command for it.

## Hard rules

- Never send email or messages from here. Draft to `drafts/`, a person sends.
- Never delete records without an explicit yes in this session. Prefer marking closed or archived.
- Never invent a record. If a name is ambiguous, list the candidates and ask.
- The database is the source of truth. If the answer is not in it, say so.

## Where things live

- `scripts/` the CLI. `scripts/lib/db.mjs` picks `DATABASE_URL` (Postgres, Supabase) or the embedded database in `.data/`.
- `supabase/migrations/` the schema, plain SQL. `npm run migrate` applies it.
- `.claude/commands/` the slash commands. Add one every time the same ask comes twice.
- `docs/` the thesis and the guide for moving off Vanta.

Built by Enterprise DNA. Installed and run for you as part of Omni: https://enterprisedna.co/omni/instead-of/vanta

## Security compliance rules

- Read `docs/compliance.md` before explaining a finding. A finding is a reminder to look, not a ruling. Never tell the operator they are compliant or certified: the auditor decides that.
- Never mark a control implemented, or record evidence, without the operator saying where the evidence lives. Never invent a date, a status or an approval.
- Access removals and reviews record what a system owner confirmed. Never sign in to a system to remove access from here unless the operator asks for that exact change in this session.
- Read-only checks are fine when asked: run the operator's own command line tools (for example `gh`, `aws`, `gcloud`) to read settings, save the output under `evidence/`, and record it with /collect. Never change a setting in those systems from here.
- Privacy incidents: draft only. Never notify a regulator, a customer or an affected person from here.
- Customer-facing output (the security summary, questionnaire answers) claims only implemented controls with current evidence. A person reads it before it leaves.
- Use `--actor` for writes and `--expected-version` for updates. Never run tests against real records.

