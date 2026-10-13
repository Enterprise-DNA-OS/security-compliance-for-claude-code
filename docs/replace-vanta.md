# Move from Vanta

Vanta has no single export-everything button: you download each part separately ([Exporting your data from Vanta](https://help.vanta.com/en/articles/14998654-exporting-your-data-from-vanta), checked 13 October 2026). Three of those downloads are CSV files this tool imports. Every import rehearses first, runs in one transaction, and skips rows already loaded.

## 1. Download the exports

- **Controls, one file per framework.** Frameworks, open a framework, More, Export controls. Tick Include evidence status to get the pass or fail state of each test, then Download CSV. Repeat for each framework.
- **Risk register.** Risk Scenarios, open the Risk Register, then Export all risk scenarios (.csv).
- **People.** People, then Export. Vanta downloads a CSV of your employee list.
- **Policies and evidence.** Download the Policy Packet (one PDF with acceptance history) and, from each framework, Export all framework evidence (a ZIP of policies, documents and test files). These are files, not records: keep them in your own drive.

Vanta notes some limits: the controls CSV leaves out when evidence was uploaded, and the People export leaves out training records held by third-party integrations. Keep the original files.

## 2. Rehearse and load

```bash
npm run migrate
npm run security -- add frameworks --name="ISO/IEC 27001:2022" --code=ISO27001 --actor=You
npm run security -- import vanta-controls --file=iso27001-controls.csv --framework=ISO27001 --actor=You --dry-run
npm run security -- import vanta-controls --file=iso27001-controls.csv --framework=ISO27001 --actor=You
npm run security -- import vanta-risks --file=risks.csv --actor=You
npm run security -- import vanta-people --file=people.csv --actor=You
```

- **Controls** read the field names Vanta documents for its control template: Control ID, Control Name, Control Description, Domain, Owner and Framework Code ([Importing custom controls](https://help.vanta.com/en/articles/11345435-importing-custom-controls)). Framework Code lands in `refs`. A status column (Evidence Status, Status or Test Status) maps passing or OK to implemented, needs attention or failing to partial, and blank to not started. Load each framework's export with its own `--framework` code: a control already loaded from another framework is linked to the new one, not duplicated.
- **Risks** match common headings (Risk ID, Risk Scenario, Description, Category, Owner, Likelihood, Impact, Treatment, Treatment Plan, Residual Likelihood, Residual Impact). Scores of 1 to 5 load as they are; words such as Low, Medium, High and Very high become 2, 3, 4 and 5.
- **People** are matched by email. Anyone with an end date on or before today loads as left.
- Vanta does not publish the column list of the risk and People exports, so the files in `examples/` are synthetic, built from common headings, not captured customer exports. If your headings differ, copy `examples/mapping.json`, point each field at your heading, and add `--mapping=mapping.json`.
- Dates in `YYYY-MM-DD` load as they are. `DD/MM/YYYY` needs `--day-first`, so a date is never guessed.
- A row already here with different details stops the import. Compare, then add `--update-existing`.

## 3. Rebuild what Vanta did for you

- **Systems and access.** Add each system and who has access (`add systems`, `add accounts`). Claude Code can read user lists with your own command line tools (for example `gh api orgs/<org>/members` or the Google Workspace admin export) and load them, read-only.
- **Evidence.** For each control the auditor will sample, record where the evidence lives with /collect, and how long it stays valid.
- **Suppliers.** Add each vendor with its criticality, data access and assurance report expiry.
- **Settings.** Set your evidence life, access review period and patch window.

## 4. Reconcile

Compare each export's row count with added plus unchanged plus updated plus linked. Run `npm run security -- readiness` and compare the implemented counts with the controls export. Run /compliance and /attention and work the list before the next audit.

## What does not come across

Vanta's hourly automated tests and its integrations, the questionnaire and trust centre features, policy acceptance tracking through its employee portal, and its device agent stay with Vanta. Policy acceptance and training dates come across only if they are in the People export. Building live connections to your cloud, identity and device management, a page where staff accept policies, or a customer trust page is custom work Enterprise DNA scopes with you.
