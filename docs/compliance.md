# Record checks and their sources

Checked 13 October 2026. `npm run security -- compliance` runs every check below. This is a record tool. It does not certify anything, decide whether a breach is notifiable, or give legal advice. Your auditor decides whether a control is effective; you and your adviser decide what the law requires of you. A finding is a reminder to look.

| Check | What the data shows | Basis |
|---|---|---|
| E8-PATCH | An open vulnerability past its patch window: 48 hours for a critical or exploited flaw in an online service, two weeks for other online service flaws, two weeks for browsers, office, PDF and security software, your own window (30 days by default) for the rest | Essential Eight Maturity Level One, ISM-1876, ISM-1690, ISM-1691 |
| AU-NDB-ASSESS | An open incident involving personal information of Australians, not yet assessed, within 7 days of (or past) 30 days from when it was found | Privacy Act 1988 (Cth) s26WH |
| AU-NDB-NOTIFY | Likely serious harm recorded for Australians and the OAIC not notified | Privacy Act 1988 (Cth) s26WK and s26WL |
| NZ-PRIVACY-NOTIFY | Serious harm likely for New Zealanders and the Privacy Commissioner not notified | Privacy Act 2020 s114 |
| ISO-SOA-JUSTIFY | A control excluded from the Statement of Applicability with no reason recorded | ISO/IEC 27001:2022 clause 6.1.3 d) |
| ISO-INTERNAL-AUDIT | No internal audit in the last 12 months (settings) | ISO/IEC 27001:2022 clause 9.2, audits at planned intervals |
| ISO-MANAGEMENT-REVIEW | No management review in the last 12 months (settings) | ISO/IEC 27001:2022 clause 9.3, reviews at planned intervals |
| ISO-RISK-TREATMENT | An open risk with no owner or no treatment chosen | ISO/IEC 27001:2022 clauses 6.1.2 and 6.1.3 |
| LOCAL-OFFBOARDING | A leaver who still has an account, or whose access was removed more than a day (settings) after leaving | Your access control policy |
| LOCAL-MFA | An internet-facing system without MFA enforced | Your access control policy; the Essential Eight multi-factor authentication strategy |
| LOCAL-EVIDENCE | A control marked implemented with no evidence, or evidence past its life | Your evidence rules |
| LOCAL-POLICY-REVIEW | A policy never approved, or past its review period (12 months by default) | Your policy on policies |
| LOCAL-ACCESS-REVIEW | A system with active accounts not reviewed in 90 days (settings), or never | Your access control policy |
| LOCAL-VENDOR | A medium or high criticality supplier never assessed, overdue, or holding confidential data without a current assurance report | Your supplier security policy |
| LOCAL-PEOPLE | Active staff whose training is older than 12 months, or who have not accepted the policies since the last approval | Your training and policy rules |

Change any number in `settings` with `update settings`. Change a rule with /customise.

## Essential Eight patch windows

The Australian Signals Directorate's Essential Eight maturity model, mapped to the Information Security Manual (ISM), sets the Maturity Level One timeframes this tool uses ([Essential Eight maturity model and ISM mapping](https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/essential-eight/essential-eight-maturity-model-and-ism-mapping)):

- ISM-1876: patches, updates or other vendor mitigations for vulnerabilities in online services are applied within 48 hours of release when vulnerabilities are assessed as critical by vendors or when working exploits exist.
- ISM-1690: the same for online services within two weeks of release when vulnerabilities are non-critical and no working exploits exist.
- ISM-1691: patches for office productivity suites, web browsers and their extensions, email clients, PDF software and security products within two weeks of release.

The clock runs from `released_on`, the date the fix was released. Record `category`, `severity` and `exploit_exists` on each vulnerability so the right window applies. The model updated these windows in November 2023; check the page above for later changes before relying on them.

## Privacy breaches in Australia

Under the Notifiable Data Breaches scheme, an entity that suspects an eligible data breach must take all reasonable steps to complete an assessment within 30 days of becoming aware of the grounds for suspicion (Privacy Act 1988 s26WH). The OAIC treats 30 days as an outer limit, not a target. Once there are reasonable grounds to believe an eligible data breach has happened, the entity notifies the OAIC and the people affected as soon as practicable ([OAIC: the NDB scheme, an overview](https://www.oaic.gov.au/__data/assets/pdf_file/0011/5213/the-ndb-scheme-an-overview.pdf)).

The scheme applies to entities covered by the Privacy Act. Many businesses with annual turnover of $3 million or less are exempt unless, for example, they provide a health service or hold tax file numbers. Record `AU` in `jurisdictions` only if the scheme applies to you; your adviser confirms that.

## Privacy breaches in New Zealand

An agency must notify the Privacy Commissioner as soon as practicable after becoming aware that a notifiable privacy breach has happened (Privacy Act 2020 s114), and the people affected as soon as reasonably practicable unless an exception applies. A breach is notifiable when it is reasonable to believe it has caused or is likely to cause serious harm ([NZLII: Privacy Act 2020 s114](https://www.nzlii.org/nz/legis/consol_act/pa2020108/s114.html)). The Office of the Privacy Commissioner has said that, unless there are extenuating circumstances, notification should be within 72 hours ([OPC](https://privacy.org.nz/blog/opc-sends-warnings-to-organisations-to-get-it-right-next-time)). The check shows days since the incident was found.

## ISO/IEC 27001:2022

The standard asks for a Statement of Applicability that lists the necessary controls, why each is included, whether it is implemented, and why any Annex A control is excluded (clause 6.1.3 d), for internal audits at planned intervals (9.2) and for management reviews at planned intervals (9.3). It is sold by ISO ([ISO/IEC 27001:2022](https://www.iso.org/standard/27001)); this tool does not reproduce its text. Load your own control list (your Vanta export, or your consultant's register) and keep the Annex A reference in `refs`.

The twelve-month intervals in settings are this tool's defaults, not the standard's wording. Your certification body agrees the audit programme with you.

## SOC 2

SOC 2 reports are issued by a CPA firm against the AICPA Trust Services Criteria. This tool tracks the controls and evidence you map to them (keep the criteria reference, for example CC6, in `refs`). It makes no SOC 2 specific check.
