export type VariableMenuNode = {
  id: string;
  label: string;
  children?: VariableMenuNode[];
};

const leaf = (id: string, label: string): VariableMenuNode => ({ id, label });

function slug(label: string, i: number) {
  const s = label
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 56);
  return `${s || 'field'}-${i}`;
}

/** Original “Rippling recipient” employee sub-groups (each chip used the visible label text). */
const EMPLOYEE_RECIPIENT_FIELD_GROUPS = [
  'Employee details',
  'Entity information',
  'Entity contractor details',
  'Country-specific personal inform...',
  'Employment status',
  'Third Party Apps',
  'Authentication settings',
  'Employment information',
  'Compensation Band',
  'Employee insurance fields',
  'Employee contractor details',
  'Employee login details',
  'Country-specific employment inf...',
  'Employee personal information',
];

const CUSTOM_DOCUMENT_CONSULTANT = [
  'Contractor Name',
  'Contractor Full Address',
  'Contractor Address',
  'Contractor City',
  'Contractor State',
  'Contractor Zip',
  '1099 Contractor Project Description',
  '1099 Contractor Compensation Description',
  'Contractor Signatory Signature',
  'Contractor Signatory Name',
  'Contractor Signatory Title',
  'Contractor Signatory Signature Date',
  'Personal Email',
  'Contractor ABN',
];

const CUSTOM_DOCUMENT_COMPANY = [
  'Business Legal Name',
  'Business DBA Name',
  'Business Full Address name',
  'Business Street Address',
  'Business city',
  'Business State',
  'Business Zip',
  'Business Phone',
  'the Fein For the business',
  'Company Email',
];

const CUSTOM_DOCUMENT_EMPLOYEE = [
  'Full name',
  'First name',
  'Last name',
  'Employee home full address',
  'Employee home street address',
  'employee home city',
  'employee home state',
  'employee home zip code',
  'Personal Email',
  'Relocation origin city',
  'Relocation Destination city',
  'End Date',
  'Title',
  'department',
  'Duties',
  'Additional terms',
  'US State or Country (for non-US Location)',
  'Start Date',
  'Manager Name',
  'Manager title',
  'Standard weekly hours',
  'Exempt / non-exempt',
  'Full /part-time',
  'pay frequency',
  'PTO days per year',
  'Work location name',
  'Work location address',
  'Work location city',
  'Work location state',
  "Manager's work email",
  "Manager's phone number",
  'Personal leave days per year',
];

/** Extended document placeholders (titles, numbering, envelopes, archival). */
const DOCUMENT_EXTENDED_VARS = [
  'Document friendly title',
  'Internal reference number',
  'Envelope expiration date',
  'Routing policy name',
  'Template owner team',
  'Last published by (full name)',
  'Last published at (localized)',
  'Document locale (language tag)',
  'Page count estimate',
  'Attachment manifest checksum',
  'Watermark profile',
  'Regulated data category tag',
  'Counterparty disclosure footnote ID',
];

/**
 * Catalog root: merges original Recipient / Document-custom groups with hierarchical navigation.
 */
export const VARIABLE_TREE: VariableMenuNode[] = [
  {
    id: 'root.employee',
    label: 'Employee',
    children: [
      {
        id: 'emp.recipient',
        label: 'Recipient field groups',
        children: EMPLOYEE_RECIPIENT_FIELD_GROUPS.map((label, i) =>
          leaf(`emp.rec.${slug(label, i)}`, label)
        ),
      },
      {
        id: 'emp.offer',
        label: 'Template placeholders (employee)',
        children: CUSTOM_DOCUMENT_EMPLOYEE.map((label, i) =>
          leaf(`emp.tpl.${slug(label, i)}`, label)
        ),
      },
      {
        id: 'emp.identity',
        label: 'Identifiers & residency',
        children: [
          {
            id: 'emp.tax.shell',
            label: 'Tax & identifiers',
            children: [
              leaf('emp.tax.ssn-mask', 'National ID masked last four digits'),
              leaf('emp.tax.country', 'Primary tax residence country code (ISO)'),
              leaf('emp.tax.alt', 'Secondary tax withholding jurisdiction'),
              leaf('emp.tax.filing-status', 'Stated marital status for withholding'),
              leaf('emp.tax.w4-year', 'W-4 declaration tax year'),
            ],
          },
          {
            id: 'emp.contact.shell',
            label: 'Contact routing',
            children: [
              leaf('emp.contact.work-email', 'Primary work email routing address'),
              leaf('emp.contact.direct-dial', 'Direct dial desk phone (formatted)'),
              {
                id: 'emp.contact.escalation',
                label: 'Escalation path',
                children: [
                  leaf('emp.contact.esc.mgr', 'People manager escalation inbox'),
                  leaf('emp.contact.oncall', 'On-call distribution list alias'),
                  leaf('emp.contact.security', 'Security operations alias'),
                  leaf('emp.contact.hr-general', 'HR shared inbox routing'),
                  leaf('emp.contact.benefits', 'Benefits support queue slug'),
                  leaf('emp.contact.payroll-queue', 'Payroll ticketing queue keyword'),
                  leaf('emp.contact.finance-ap', 'Accounts payable escalation tag'),
                  leaf('emp.contact.legal-queue', 'Internal legal routing tag'),
                  leaf('emp.contact.it-help', 'Corporate IT escalation token'),
                  leaf('emp.contact.facilities-desk', 'Facilities ticketing route'),
                  leaf('emp.contact.procurement-queue', 'Procurement helpdesk reference'),
                  leaf('emp.contact.travel-desk', 'Travel desk queue handle'),
                  leaf('emp.contact.expense-queue', 'Expense operations queue slug'),
                  leaf('emp.contact.recruiting-ops', 'Recruiting operations alias'),
                  leaf('emp.contact.dei-inbox', 'DEI inbox for confidential topics'),
                  leaf('emp.contact.ethics-hotline-token', 'Ethics hotline case token placeholder'),
                  leaf('emp.contact.workforce-analytics-queue', 'Workforce analytics support queue keyword'),
                  leaf('emp.contact.timekeeping-queue', 'Timekeeping exception queue slug'),
                  leaf('emp.contact.leaves-queue', 'Leave of absence operations queue slug'),
                  leaf('emp.contact.accommodations-queue', 'Accommodations request queue slug'),
                  leaf('emp.contact.workvisa-queue', 'Work authorization case queue slug'),
                  leaf('emp.contact.relocation-queue', 'Relocation concierge queue slug'),
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'emp.role',
        label: 'Role & compensation',
        children: [
          leaf('emp.role.title', 'Current published job title'),
          {
            id: 'emp.role.payroll',
            label: 'Payroll attributes',
            children: [
              leaf('emp.pay.base', 'Annual base compensation (localized currency)'),
              leaf('emp.pay.exempt', 'Fair Labor exemption status indicator'),
              leaf('emp.pay.ot-rule', 'Overtime policy label'),
              leaf('emp.pay.bonus-schedule', 'Discretionary bonus plan code'),
              leaf('emp.pay.equity-plan', 'Equity incentive plan mnemonic'),
              leaf('emp.pay.currency', 'Localized pay currency ISO code'),
            ],
          },
          leaf('emp.role.level-grade', 'Level / grade ladder code'),
          leaf('emp.role.reports-count', 'Direct reports headcount rollup'),
          leaf('emp.role.work-mode', 'On-site hybrid remote classification'),
          leaf('emp.role.union-code', 'Union membership status code'),
        ],
      },
    ],
  },
  {
    id: 'root.doc_custom',
    label: 'Document custom variables',
    children: [
      {
        id: 'doc.custom.consultant',
        label: 'Consultant / 1099 contractor information',
        children: CUSTOM_DOCUMENT_CONSULTANT.map((label, i) =>
          leaf(`doc.c.cons.${slug(label, i)}`, label)
        ),
      },
      {
        id: 'doc.custom.company',
        label: 'Company information',
        children: CUSTOM_DOCUMENT_COMPANY.map((label, i) =>
          leaf(`doc.c.co.${slug(label, i)}`, label)
        ),
      },
      {
        id: 'doc.custom.clauses',
        label: 'Document body boilerplate',
        children: DOCUMENT_EXTENDED_VARS.map((label, i) => leaf(`doc.body.${slug(label, i)}`, label)),
      },
    ],
  },
  {
    id: 'root.docwf',
    label: 'Document workflow & envelopes',
    children: [
      {
        id: 'docwf.signatures',
        label: 'Signatures & proof',
        children: [
          leaf('doc.sign.when', 'Completed signature capture timestamp (UTC)'),
          {
            id: 'doc.sign.ip.shell',
            label: 'Signer network context',
            children: [
              leaf('doc.sign.ip.mask', 'Signer IPv4 /24 masked prefix'),
              leaf('doc.sign.geo', 'Geo-IP derived metro label'),
              leaf('doc.sign.vpn-hint', 'VPN / corp network hint'),
              leaf('doc.sign.session-id-mask', 'Session identifier short hash'),
            ],
          },
          leaf('doc.sign.ordinal', 'Signatory ordinal on routing path'),
          leaf('doc.sign.ceremony.locale', 'Signing ceremony locale'),
          leaf('doc.sign.idv.level', 'Identity verification assurance level'),
        ],
      },
      {
        id: 'docwf.lifecycle',
        label: 'Lifecycle & notices',
        children: [
          leaf('doc.lifecycle.created-at', 'Document created timestamp'),
          leaf('doc.lifecycle.sent-at', 'Envelope sent timestamp'),
          leaf('doc.lifecycle.reminder-seq', 'Reminder sequence ordinal'),
          leaf('doc.lifecycle.void-reason-token', 'Void reason category token'),
          leaf('doc.lifecycle.archive-box', 'Archival vault box moniker'),
          leaf('doc.lifecycle.legal-hold-tag', 'Legal hold policy tag'),
        ],
      },
      {
        id: 'docwf.recipients',
        label: 'Recipient roles',
        children: [
          leaf('doc.recipient.primary-email', 'Primary recipient email normalized'),
          leaf('doc.recipient.cc-list-count', 'CC recipient count rollup'),
          leaf('doc.recipient.signing-group', 'Signing group label'),
          leaf('doc.recipient.approver-queue', 'Sequential approver roster token'),
          leaf('doc.recipient.witness-required', 'Witness requirement flag mnemonic'),
          leaf('doc.recipient.notarize-channel', 'Notarization vendor channel slug'),
          leaf('doc.recipient.localization.pack', 'Localization pack version'),
          leaf('doc.recipient.data-residency.region', 'Data residency pledge region tag'),
          leaf('doc.recipient.redaction.policy', 'Redaction ruleset profile ID'),
          leaf('doc.recipient.audit-id', 'Structured audit artifact ID'),
          leaf('doc.recipient.proof-delivery-hash', 'Proof-of-delivery short hash'),
        ],
      },
      leaf('doc.version', 'Template revision hash (short)'),
      leaf('doc.version-semver', 'Template semantic version pin'),
      leaf('doc.variant.label', 'Template variant discriminator label'),
    ],
  },
  {
    id: 'root.agreement',
    label: 'Agreement metadata',
    children: [
      leaf('agr.exec.date', 'Signature execution timestamp (UTC)'),
      {
        id: 'agr.workflow',
        label: 'Workflow routing',
        children: [
          leaf('agr.signer.seq', 'Signatory ordinal position'),
          leaf('agr.signer-ip', 'Signer IP subnet (masked)'),
          leaf('agr.workflow.stage', 'Current workflow stage code'),
          leaf('agr.workflow.sla-days', 'SLA days remaining rollup'),
          leaf('agr.workflow.approval-matrix', 'Approval matrix moniker'),
          leaf('agr.workflow.jurisdiction-choice', 'Governing jurisdiction choice'),
          leaf('agr.workflow.severability-clause-flag', 'Severability clause variant flag'),
        ],
      },
      {
        id: 'agr.commercial',
        label: 'Commercial terms',
        children: [
          leaf('agr.commercial.effective-date', 'Agreement effective calendar date'),
          leaf('agr.commercial.term-length', 'Initial term duration label'),
          leaf('agr.commercial.auto-renew-cycle', 'Auto-renew notice cycle keyword'),
          leaf('agr.commercial.termination-window', 'Termination notice window label'),
          leaf('agr.commercial.governing-law-venue', 'Governing law and venue text'),
          leaf('agr.commercial.confidentiality-term', 'Confidentiality survivorship duration'),
          leaf('agr.commercial.liability-cap-basis', 'Liability cap basis descriptor'),
          leaf('agr.commercial.insurance-requirements-summary', 'Insurance requirements synopsis tag'),
          leaf('agr.commercial.audit-frequency', 'Audit rights frequency mnemonic'),
          leaf('agr.commercial.data-processing-addendum-pin', 'DPA annex version pin'),
        ],
      },
    ],
  },
];
