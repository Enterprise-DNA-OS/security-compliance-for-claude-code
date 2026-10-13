---
description: Record that a person completed security training or accepted the policies.
---

Read CLAUDE.md. Run npm run security -- attest <person> --training --policies [--on=YYYY-MM-DD] --actor=<name>. Use --json when you need to work further with the rows. Never invent a record, a date or a control status that is not in the records.

Use the date they did it, not today, when the operator has it. Confirm the record and values with the operator first. Every write needs --actor. Before update, review-access or approve-policy, read show and pass --expected-version. If a name matches more than one record, list them and ask which one.
