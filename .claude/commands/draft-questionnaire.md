---
description: Draft answers to a customer security questionnaire from the control register and evidence.
---

Read CLAUDE.md. Run npm run security -- draft-questionnaire --file=<questions.csv>. Use --json when you need to work further with the rows. Never invent a record, a date or a control status that is not in the records.

The CSV needs a Question column. Each question gets the controls that share its words, their status and latest evidence. Write each answer from those, claim only implemented controls, and mark the unmatched questions for a person. Never send.
