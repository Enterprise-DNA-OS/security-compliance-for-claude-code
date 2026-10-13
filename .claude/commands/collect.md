---
description: Record a piece of evidence against a control.
---

Read CLAUDE.md. Run npm run security -- collect <control> --name="..." --kind=document|screenshot|config|report|ticket|log|attestation --location="..." [--valid-days=N] [--collected-on=YYYY-MM-DD] --actor=<name>. Use --json when you need to work further with the rows. Never invent a record, a date or a control status that is not in the records.

Evidence is a pointer to where the file lives, not the file itself. Ask for the location. Excluded controls take no evidence. Confirm the record and values with the operator first. Every write needs --actor. Before update, review-access or approve-policy, read show and pass --expected-version. If a name matches more than one record, list them and ask which one.
