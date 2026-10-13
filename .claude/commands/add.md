---
description: Add a framework, control, policy, person, system, account, vendor, risk, vulnerability, incident, review or action.
---

Read CLAUDE.md. Run npm run security -- add <entity> --field=value --actor=<name>. Use --json when you need to work further with the rows. Never invent a record, a date or a control status that is not in the records.

Run npm run security -- help for the fields. Confirm the record and values with the operator first. Every write needs --actor. Before update, review-access or approve-policy, read show and pass --expected-version. If a name matches more than one record, list them and ask which one.
