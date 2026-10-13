---
description: Record a completed access review: everyone kept is marked reviewed, anyone named loses access today.
---

Read CLAUDE.md. Run npm run security -- review-access <system> [--remove="Name;Name"] --expected-version=N --actor=<name>. Use --json when you need to work further with the rows. Never invent a record, a date or a control status that is not in the records.

Only record what the system owner confirmed. Confirm the record and values with the operator first. Every write needs --actor. Before update, review-access or approve-policy, read show and pass --expected-version. If a name matches more than one record, list them and ask which one.
