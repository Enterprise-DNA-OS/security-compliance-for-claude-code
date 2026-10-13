<h1 align="center">Security Compliance for Claude Code</h1>

<p align="center">
  <strong>The open-source security compliance system that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your Vanta data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=vanta">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/vanta?utm_source=github&utm_medium=readme&utm_campaign=vanta">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-vanta">Instead of Vanta</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Security Compliance for Claude Code does the job you pay Vanta for, as a Postgres database and a set of agent commands. There is no web front end. You open the folder in [Claude Code](https://claude.com/claude-code) (or Codex, OpenCode, Cursor: see `AGENTS.md`) and ask for what you want in plain language. It runs the right query, and you can add a new question whenever an auditor or a customer asks one.

Vanta publishes no prices. Its pricing page lists Essentials, Plus, Professional and Enterprise plans, each sold by personalised quote, with questionnaire automation, security reviews, access management and several risk features marked as add-ons ([Vanta pricing](https://www.vanta.com/pricing), checked 13 October 2026). The auditor's fee is separate.

Want the same thing with a web front end, or built on a different stack? That is a customisation, and it is exactly what Enterprise DNA does: [book a call](https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=vanta).

Built for the person who owns security compliance at a 10 to 200 person company: the operations lead, the CTO or the outsourced IT partner who has been asked for ISO 27001, SOC 2 or the Essential Eight by a customer, a government panel or an insurer. It holds the frameworks, the control register and where each piece of evidence lives, policies and who has accepted them, people and their access to each system, suppliers, the risk register, vulnerabilities against the Essential Eight patch windows, incidents with the privacy breach clocks, and the audit calendar. It does not connect to your cloud and test it every hour, and it does not store the evidence files themselves: Claude Code can run the read-only checks you already have (the GitHub, AWS or Google command line tools) and record what it finds, and Enterprise DNA builds live connections into your version if you want them.

## Why no front end

- The front end was only ever there because the database was hard to talk to. That is no longer true.
- Your data sits in plain Postgres tables you own. Any tool can read them. No export, no lock-in.
- No seats, no tiers, no add-ons. Read [docs/why-no-front-end.md](docs/why-no-front-end.md) for the honest trade-offs too.

## Quick start

Sixty seconds, no database install (an embedded Postgres runs inside Node):

```bash
git clone https://github.com/Enterprise-DNA-OS/security-compliance-for-claude-code.git
cd security-compliance-for-claude-code
npm install
npm run demo
```

Then open the folder in Claude Code and type a slash command. Start with /readiness, then /attention. For real records, choose an empty `DATA_DIR` and run `npm run migrate` without the fictional seed.

### Use it with your own Postgres or Supabase

Copy `.env.example` to `.env`, set `DATABASE_URL`, then `npm run migrate`. Same commands, shared data, no per-seat fee.

## The commands

| Command | What it does |
|---|---|
| /readiness | Show how ready each framework is: applicable controls, implemented, with current evidence, and days to the audit |
| /attention | Find what needs attention: leavers with access, late patches, privacy incidents, overdue actions, stale evidence, reviews and suppliers |
| /compliance | Check the records against the Essential Eight patch windows, the privacy breach clocks, ISO 27001 and your own rules, with sources |
| /weekly-review | Draft the Monday security compliance review |
| /control-gaps | List applicable controls not implemented, or implemented with stale or missing evidence |
| /soa | Read the Statement of Applicability: every ISO 27001 control, included or excluded, and why |
| /evidence-due | Find controls whose evidence is missing, stale or expiring within the warning window |
| /collect | Record a piece of evidence against a control |
| /offboarding | Find leavers who still have access, and access removed later than the offboarding window |
| /access-reviews | Find systems whose access review is overdue or has never happened |
| /draft-access-review | Draft the access review request to a system owner, listing every active account |
| /review-access | Record a completed access review: everyone kept is marked reviewed, anyone named loses access today |
| /admins | List every administrator account, by system |
| /people-gaps | Find active people missing training, policy acceptance, a background check, MFA or device encryption |
| /attest | Record that a person completed security training or accepted the policies |
| /policies-due | Find policies never approved or due for review within 30 days |
| /approve-policy | Record a policy approval: who approved it, the version, today's date |
| /vendor-reviews | Find suppliers never assessed, overdue for assessment, or holding confidential data without a current assurance report |
| /risks | Read the open risk register, highest residual risk first |
| /patching | List open vulnerabilities against the Essential Eight patch timeframes |
| /incidents | Read incidents with the personal information clocks: the AU 30-day assessment and notification status |
| /draft-incident-assessment | Draft the assessment notes for a suspected data breach: facts on record, the clocks, the questions to answer |
| /actions | List open corrective actions, overdue first |
| /review-calendar | Show when the internal audit, management review, penetration test and restore test were last held and when each is due |
| /draft-questionnaire | Draft answers to a customer security questionnaire from the control register and evidence |
| /policies | Read the policies with version, approval date and next review |
| /people | Read everyone with role, status, training, policy acceptance and MFA |
| /revoke | Record that a person's access has been removed, on one system or all of them |
| /accounts | Read who has access to each system and at what level |
| /systems | Read the systems with data class, internet exposure, MFA, SSO and backups |
| /vendors | Read the suppliers with criticality, data access, assurance report and next assessment |
| /show | Read one record with its history, notes, evidence or accounts |
| /add | Add a framework, control, policy, person, system, account, vendor, risk, vulnerability, incident, review or action |
| /update | Update a record with a version check |
| /log | Add a note to any record |
| /import | Bring controls, the risk register and people across from Vanta's CSV exports |
| /export | Export every record, note and change |
| /history | Read every recorded change and who made it |
| /settings | Read the windows the checks use: evidence life, review periods, offboarding days, patch window |
| /help | Read the CLI commands and editable fields |
| /customise | Add a field, rename a status or change a rule through a tested migration |
| /new-view | Add a branded read-only report from a plain-language description |

## Instead of Vanta

Three one-command imports from the CSV files Vanta lets you download. Controls come one framework at a time: `npm run security -- import vanta-controls --file=iso27001-controls.csv --framework=ISO27001 --actor=You --dry-run`, then again without `--dry-run`, then the next framework's export (shared controls are linked, not duplicated). The risk register: `import vanta-risks --file=risks.csv`. The People list: `import vanta-people --file=people.csv`, matched by email. Rehearse first, compare counts, then load. Policies and evidence files come out of Vanta as PDFs and a ZIP: keep them in your own drive and record where each one lives. [Switching guide](docs/replace-vanta.md).

## Architecture

```
security-compliance-for-claude-code/
  CLAUDE.md                 how the operator wants this run (routing table + house rules)
  AGENTS.md                 the same, for Codex / OpenCode / Cursor / Gemini CLI
  .claude/commands/         the slash commands
  scripts/                  the CLI the commands drive
  scripts/lib/db.mjs        one adapter: DATABASE_URL (pg) or embedded PGlite
  supabase/migrations/      plain SQL schema
  supabase/seed.sql         demo data
  docs/                     the thesis and the migration guide
```

## Built for coding agents

The database, CLI and command recipes work with Claude Code, Codex, OpenCode or Cursor. Ask your coding agent for a new command and have it implement and test the change against the same records.

## Contributing

Issues and pull requests are welcome. Keep the shape: plain SQL, a small CLI, a slash command per recurring job, no front end.

## Want it installed and run for you?

Enterprise DNA installs Security Compliance for Claude Code for your business, migrates your Vanta data, connects it to the rest of your tools, and runs it for you as part of **Omni**, our managed Command Center. One setup fee, then a monthly retainer.

- Book a call: [enterprisedna.co/omni/book](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=vanta)
- Read more: [enterprisedna.co/omni/instead-of/vanta](https://enterprisedna.co/omni/instead-of/vanta?utm_source=github&utm_medium=readme&utm_campaign=vanta)

## License

MIT. Copyright (c) 2026 Enterprise DNA.

## How the checks work

Readiness counts applicable controls that are implemented and have current evidence. Evidence expires after its own `valid_days`, or the default in settings (365 days), and shows as expiring inside the warning window (30 days). Excluded controls need a written reason; included ones take their reason from the risks that list them. Vulnerabilities are timed from the date the fix was released: 48 hours for a critical or exploited flaw in an internet-facing service, two weeks for other online service flaws and for browsers, office, PDF and security software, and the settings value (30 days) for everything else. Privacy incidents start the clocks in [docs/compliance.md](docs/compliance.md).

Every write needs `--actor`, updates need `--expected-version`, and every change lands in the audit log, which is itself evidence an auditor can read. Names match case insensitively, control ids, emails and id prefixes work, and ambiguous matches list the candidates and exit 1. Access reviews and removals record what a system owner confirmed; they never sign in to the system. [Rules and sources](docs/compliance.md).

## Reports and paperwork

`npm run view` renders the week (readiness, late patches, leavers with access, record checks) and the audit run-up (control gaps, risk register, review calendar, suppliers). `npm run docs` renders the ISO 27001 Statement of Applicability, the risk treatment plan, the management review pack and a security summary for customers that lists only implemented controls with current evidence. Edit `brand.json` for your business name, logo and colours. Drafts never send.

## Ten questions to ask of your security compliance

Each one is answered by the free version today.

1. How many controls stand between us and the ISO 27001 audit date? `readiness`
2. Who left the business and still has access, and to what? `offboarding`
3. Which patches are past their Essential Eight window, and by how many days? `patching`
4. Which evidence will expire before the auditor arrives? `evidence-due`
5. Which suppliers hold our confidential data without a current SOC 2 report or ISO certificate? `vendor-reviews`
6. When does the 30-day assessment clock run out on this privacy incident? `incidents`
7. Who has admin rights on more than one system? `admins`
8. Which exclusions in our Statement of Applicability have no reason written down? `compliance`
9. Which staff have not accepted the policy we approved last month? `people-gaps`
10. What can we honestly answer yes to on this customer's security questionnaire? `draft-questionnaire`

## Your first hour: ten things to ask for

1. Put our name and logo in brand.json.
2. Rehearse our Vanta controls export for ISO 27001.
3. Load our risk register and People list from Vanta.
4. Add our systems and who has admin on each.
5. Show me who left and still has access.
6. Record where our evidence lives for the controls the auditor samples most.
7. Set our evidence life and access review period in settings.
8. Draft the access review request for Google Workspace.
9. Draft our Monday security review.
10. Add a data residency field to suppliers with /customise.

## Verification

`npm test` creates a temporary database, exercises every CLI command, and checks the patch windows, the breach clocks, the Statement of Applicability rules, offboarding, access reviews, attestations, policy approvals, version conflicts, transactional imports, unchanged re-imports, controls linked across frameworks, audit attribution and escaped reports. Windows and Linux CI run Node 20 and 22, and a separate Postgres 17 job runs the same tests. `TEST_DATABASE_URL` must point to an empty disposable database.
