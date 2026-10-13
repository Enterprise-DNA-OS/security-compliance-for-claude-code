---
description: Bring controls, the risk register and people across from Vanta's CSV exports.
---

Read CLAUDE.md. Run npm run security -- import vanta-controls --file=<export.csv> --framework=ISO27001 --actor=<name> --dry-run. Use --json when you need to work further with the rows. Never invent a record, a date or a control status that is not in the records.

Always rehearse with --dry-run first and compare counts. Vanta exports controls one framework at a time: import each export with its own --framework code; the same control from a second framework is linked, not duplicated. Risks: import vanta-risks. People: import vanta-people (matched by email). Renamed headings: copy examples/mapping.json and pass --mapping. Dates written DD/MM/YYYY need --day-first. Never add --update-existing until the changed rows have been compared. See docs/replace-vanta.md.
