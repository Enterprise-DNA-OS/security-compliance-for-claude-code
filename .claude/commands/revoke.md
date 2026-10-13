---
description: Record that a person's access has been removed, on one system or all of them.
---

Read CLAUDE.md. Run npm run security -- revoke <person> [--system=<system>] --actor=<name>. Use --json when you need to work further with the rows. Never invent a record, a date or a control status that is not in the records.

Confirm the access is actually removed in the system first. This records the removal; it does not sign in anywhere. Confirm the record and values with the operator first. Every write needs --actor. Before update, review-access or approve-policy, read show and pass --expected-version. If a name matches more than one record, list them and ask which one.
