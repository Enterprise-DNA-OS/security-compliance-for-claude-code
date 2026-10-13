---
description: Record a policy approval: who approved it, the version, today's date.
---

Read CLAUDE.md. Run npm run security -- approve-policy <policy> --approved-by="<name>" [--version-label=2.0] --expected-version=N --actor=<name>. Use --json when you need to work further with the rows. Never invent a record, a date or a control status that is not in the records.

Only after the approver has approved it. A new approval means staff must accept the policies again; /people-gaps will show who. Confirm the record and values with the operator first. Every write needs --actor. Before update, review-access or approve-policy, read show and pass --expected-version. If a name matches more than one record, list them and ask which one.
