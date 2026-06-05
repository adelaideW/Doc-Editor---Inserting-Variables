export type VariableFieldKind = 'folder' | 'text' | 'date' | 'boolean' | 'list' | 'currency' | 'number';

export type VariableMenuNode = {
  id: string;
  label: string;
  children?: VariableMenuNode[];
  searchKeywords?: string[];
  fieldKind?: VariableFieldKind;
  recipientType?: 'employee' | 'manager' | 'custom';
  fieldType?: 'text' | 'checkbox' | 'signature' | 'date-signed';
  needsRecipient?: boolean;
};

const leaf = (id: string, label: string, fieldKind: VariableFieldKind = 'text'): VariableMenuNode => ({
  id,
  label,
  fieldKind,
});

const addressLeaves = (prefix: string): VariableMenuNode[] => [
  leaf(`${prefix}.country`, 'Country', 'list'),
  leaf(`${prefix}.city`, 'City'),
  leaf(`${prefix}.country-code`, 'Country code'),
  leaf(`${prefix}.county-code`, 'County code'),
  leaf(`${prefix}.county-name`, 'County name'),
  leaf(`${prefix}.full`, 'Full address'),
  leaf(`${prefix}.state`, 'State'),
  leaf(`${prefix}.state-code`, 'State code'),
  leaf(`${prefix}.street`, 'Street address'),
  leaf(`${prefix}.zip`, 'Zip'),
];

const recipientFieldLeaves = (
  prefix: string,
  recipientType: 'employee' | 'manager' | 'custom'
): VariableMenuNode[] => [
  {
    id: `${prefix}.text`,
    label: 'Text',
    recipientType,
    fieldType: 'text',
    needsRecipient: recipientType === 'custom',
    searchKeywords: ['field', recipientType, 'recipient', 'text'],
  },
  {
    id: `${prefix}.checkbox`,
    label: 'Checkbox',
    recipientType,
    fieldType: 'checkbox',
    needsRecipient: recipientType === 'custom',
    searchKeywords: ['field', recipientType, 'recipient', 'checkbox'],
  },
  {
    id: `${prefix}.signature`,
    label: 'Signature',
    recipientType,
    fieldType: 'signature',
    needsRecipient: recipientType === 'custom',
    searchKeywords: ['field', recipientType, 'recipient', 'signature', 'sign'],
  },
  {
    id: `${prefix}.date-signed`,
    label: 'Date signed',
    recipientType,
    fieldType: 'date-signed',
    needsRecipient: recipientType === 'custom',
    searchKeywords: ['field', recipientType, 'recipient', 'date', 'signed'],
  },
];

function slug(label: string, i: number) {
  const s = label
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 56);
  return `${s || 'field'}-${i}`;
}

export function hasVariableChildren(n: VariableMenuNode): boolean {
  return !!n.children && n.children.length > 0;
}

export function countLeafNodes(node: VariableMenuNode): number {
  if (!hasVariableChildren(node)) return 1;
  return node.children!.reduce((sum, child) => sum + countLeafNodes(child), 0);
}

function leavesForCategory(categoryId: string, labels: string[], targetCount: number): VariableMenuNode[] {
  const names = [...labels];
  let filler = 1;
  while (names.length < targetCount) {
    names.push(`Demo placeholder ${filler}`);
    filler += 1;
  }
  return names.slice(0, targetCount).map((label, i) => leaf(`${categoryId}.f-${slug(label, i)}`, label));
}

function dropdownCategory(
  id: string,
  label: string,
  sourceLabels: string[],
  targetCount: number
): VariableMenuNode {
  return { id, label, children: leavesForCategory(id, sourceLabels, targetCount) };
}

function dropdownFolder(id: string, label: string, children: VariableMenuNode[]): VariableMenuNode {
  return { id, label, fieldKind: 'folder', children };
}

/** Country-specific personal information — mirror folder + address groups (screenshots). */
const COUNTRY_SPECIFIC_PERSONAL_INFORMATION: VariableMenuNode = {
  id: 'cat.country-personal',
  label: 'Country-specific personal information',
  children: [
    dropdownFolder('country.personal.root', 'Country-specific personal information', [
      dropdownFolder('country.personal.emergency-address', 'Emergency address', addressLeaves('country.personal.emergency')),
      dropdownFolder('country.personal.mailing-address', 'Mailing address', addressLeaves('country.personal.mailing')),
      dropdownFolder('country.personal.registered-address', 'Registered address', addressLeaves('country.personal.registered')),
      leaf('country.personal.emergency-notification', 'Emergency contact notification', 'boolean'),
      leaf('country.personal.citizenship', 'Has citizenship in country of employment', 'boolean'),
      leaf('country.personal.pin', 'Whether EE has PIN number', 'boolean'),
      leaf('country.personal.blood', 'Blood group', 'list'),
      leaf('country.personal.citizenship-pk', 'Country of citizenship (Pakistan)', 'list'),
      leaf('country.personal.disability', 'Disability status', 'list'),
      leaf('country.personal.race', 'Race', 'list'),
      leaf('country.personal.emergency-relationship', 'Relationship with emergency contact'),
    ]),
  ],
};

const EMPLOYEE_LOGIN_DETAILS: VariableMenuNode = {
  id: 'cat.employee-login',
  label: 'Employee login details',
  children: [
    leaf('login.date-joined', 'Date joined Rippling', 'date'),
    leaf('login.last-password-change', 'Last password change date', 'date'),
    leaf('login.last-password-reset', 'Last password reset date', 'date'),
    leaf('login.blocked', 'Login blocked', 'boolean'),
    leaf('login.password-compromised', 'Password is compromised', 'boolean'),
    leaf('login.phone-verified', 'Phone number verified', 'boolean'),
    dropdownFolder('login.last-sign-in', 'Last sign in details', [
      leaf('login.sign-in.ip', 'Sign-in IP address'),
      leaf('login.sign-in.device', 'Sign-in device'),
      leaf('login.sign-in.timestamp', 'Sign-in timestamp', 'date'),
    ]),
  ],
};

const ENTITY_CONTRACTOR_DETAILS: VariableMenuNode = {
  id: 'cat.entity-contractor',
  label: 'Entity contractor details',
  children: [
    leaf('entity.contractor.is-entity', 'Is contractor an entity?', 'boolean'),
    leaf('entity.contractor.single-member-llc', 'Is the LLC is owned by a single member?', 'boolean'),
    leaf('entity.contractor.missing-ein', 'Missing EIN', 'boolean'),
    leaf('entity.contractor.tax-location', 'Contractor tax location type', 'list'),
    leaf('entity.contractor.tax-type', 'Entity contractor tax type', 'list'),
    leaf('entity.contractor.type', 'Entity contractor type', 'list'),
    leaf('entity.contractor.tin-type', 'Tax payer identification number (TIN) type', 'list'),
    leaf('entity.contractor.ein', 'EIN'),
    leaf('entity.contractor.business-name', 'Entity contractor business name'),
    leaf('entity.contractor.legal-name', 'Entity contractor legal name'),
    leaf('entity.contractor.ftin', 'Foreign taxpayer identification number (FTIN)'),
    leaf('entity.contractor.project', '1099 Contractor Project Description'),
    leaf('entity.contractor.compensation', '1099 Contractor Compensation Description'),
  ],
};

const COMPENSATION: VariableMenuNode = {
  id: 'cat.compensation',
  label: 'Compensation',
  children: [
    leaf('comp.eor-equity', 'Do you want to add EOR Equity Services for this employee?', 'boolean'),
    leaf('comp.bonus-schedule', 'Bonus schedule', 'list'),
    leaf('comp.currency', 'Compensation currency', 'list'),
    leaf('comp.time-period', 'Compensation time period', 'list'),
    leaf('comp.commission-freq', 'On-target commission payment frequency', 'list'),
    leaf('comp.payment-type', 'Payment type', 'list'),
    leaf('comp.target-bonus-freq', 'Target annual bonus payment frequency', 'list'),
    leaf('comp.equity-type', 'Type of equity', 'list'),
    leaf('comp.payment-terms', 'Payment terms'),
    leaf('comp.equity-type-other', 'Type of equity other'),
    leaf('comp.annual-base', 'Annual base compensation', 'currency'),
    dropdownFolder('comp.equity-vesting', 'Equity vesting schedule', [
      dropdownFolder('comp.equity-package', 'Equity vesting package', [
        leaf('comp.vesting.cliff-months', 'Cliff months', 'number'),
        leaf('comp.vesting.total-months', 'Total vesting months', 'number'),
        leaf('comp.vesting.total-years', 'Total vesting years', 'number'),
        leaf('comp.vesting.type', 'Vesting type', 'list'),
      ]),
      leaf('comp.vesting.effective-salary', 'Effective from salary date', 'date'),
      leaf('comp.vesting.grant-date', 'Equity grant date', 'date'),
      leaf('comp.vesting.bonus-days', 'Bonus payment days', 'number'),
      leaf('comp.vesting.share-count', 'Offer letter share count', 'number'),
      leaf('comp.vesting.target-bonus-pct', 'Target annual bonus percent', 'number'),
    ]),
  ],
};

const EMPLOYEE_CONTRACTOR_DETAILS: VariableMenuNode = {
  id: 'cat.employee-contractor',
  label: 'Employee contractor details',
  children: [leaf('emp.contractor.sole-prop', 'Sole proprietor name')],
};

/** Nested sub-folders for V2 modal three-layer demo (matches Rippling object graph screenshots). */
const EMPLOYEE_PERSONAL_INFORMATION: VariableMenuNode = {
  id: 'cat.employee-personal',
  label: 'Employee personal information',
  children: [
    dropdownFolder('emp.personal.emergency-contact', 'Emergency contact phone number', [
      leaf('emp.personal.emergency.country-code', 'Country code'),
      leaf('emp.personal.emergency.national', 'National number'),
      leaf('emp.personal.emergency.extension', 'Phone number extension'),
    ]),
    dropdownFolder('emp.personal.locale', 'Employee locale settings', [
      leaf('emp.personal.locale.region', 'Locale region'),
      leaf('emp.personal.locale.language', 'Profile language'),
      leaf('emp.personal.locale.timezone', 'Work timezone'),
    ]),
    dropdownFolder('emp.personal.name', 'Employee name details', [
      leaf('emp.personal.name.first', 'Legal first name'),
      leaf('emp.personal.name.full', 'Legal full name'),
      leaf('emp.personal.name.last', 'Legal last name'),
      leaf('emp.personal.name.middle', 'Legal middle name'),
    ]),
    dropdownFolder('emp.personal.home-address', 'Home address', [
      leaf('emp.personal.home.country', 'Country'),
      leaf('emp.personal.home.city', 'City'),
      leaf('emp.personal.home.country-code', 'Country code'),
      leaf('emp.personal.home.county-code', 'County code'),
      leaf('emp.personal.home.county-name', 'County name'),
      leaf('emp.personal.home.full', 'Full address'),
      leaf('emp.personal.home.state', 'State'),
      leaf('emp.personal.home.state-code', 'State code'),
      leaf('emp.personal.home.street', 'Street address'),
      leaf('emp.personal.home.zip', 'Zip'),
    ]),
    dropdownFolder('emp.personal.phone', 'Phone number', [
      leaf('emp.personal.phone.country-code', 'Country code'),
      leaf('emp.personal.phone.national', 'National number'),
      leaf('emp.personal.phone.extension', 'Phone number extension'),
    ]),
    leaf('emp.personal.dob', 'Date of birth', 'date'),
    leaf('emp.personal.ssn-expected', 'Expected date for SSN', 'date'),
    leaf('emp.personal.age', 'Age', 'number'),
    leaf('emp.personal.gender-identified', 'Identified gender', 'list'),
    leaf('emp.personal.sex', 'Sex', 'list'),
    leaf('emp.personal.tshirt', 'T-shirt size', 'list'),
  ],
};

const EMPLOYEE_LOGIN_FIELDS = [
  'Work email',
  'Username',
  'Last login at',
  'MFA enabled',
  'Auth provider',
  'Account status',
  'Password last changed',
];

const COMPENSATION_FIELDS = [
  'Annual base salary',
  'Pay currency',
  'Pay frequency',
  'Bonus target percent',
  'Equity grant shares',
  'Commission plan code',
  'Overtime eligibility',
  'FLSA exemption status',
  'Compensation band min',
  'Compensation band max',
  'Compensation band midpoint',
  'Localized pay currency',
  'Discretionary bonus plan',
  'Signing bonus amount',
  'Relocation bonus',
  'Stock option grant date',
  'Vesting schedule label',
  'Cliff months',
  'Total compensation estimate',
  'Hourly rate',
  'Weekly hours',
  'Pay grade',
  'Cost center allocation',
  'Pay group',
  'Payroll schedule',
  'Last compensation change date',
  'Compensation effective date',
  'Prior base salary',
  'Compa-ratio',
  'Geographic pay differential',
  'Shift differential',
  'On-call stipend',
  'Car allowance',
  'Phone stipend',
  'Commission draw',
  'Draw recovery balance',
  'Incentive plan year',
];

const EMPLOYMENT_STATUS_FIELDS = [
  'Employment type',
  'Active status',
  'Termination date',
  'Termination reason',
  'Rehire eligibility',
  'Leave status',
  'Leave start date',
  'Leave end date',
  'Probation end date',
  'Notice period days',
  'Worker classification',
  'Union membership',
  'Visa status',
  'Work authorization expiry',
  'Background check status',
  'I-9 verification status',
];

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

/**
 * Root categories for inline / modal variable dropdowns (V3-style Rippling object graph).
 * Counts match demo targets; gaps filled with placeholders when the catalog has fewer labels.
 */
export const VARIABLE_DROPDOWN_TREE: VariableMenuNode[] = [
  COUNTRY_SPECIFIC_PERSONAL_INFORMATION,
  EMPLOYEE_PERSONAL_INFORMATION,
  EMPLOYEE_LOGIN_DETAILS,
  ENTITY_CONTRACTOR_DETAILS,
  dropdownCategory(
    'cat.employment-info',
    'Employment information',
    [
      ...CUSTOM_DOCUMENT_EMPLOYEE,
      ...EMPLOYEE_RECIPIENT_FIELD_GROUPS,
      'Start Date',
      'Manager Name',
      'Manager title',
      'Standard weekly hours',
      'Work location name',
      'Duties',
      'department',
      'Title',
    ],
    47
  ),
  EMPLOYEE_CONTRACTOR_DETAILS,
  dropdownCategory('cat.country-employment', 'Country-specific employment information', [
    'Country-specific employment inf...',
  ], 1),
  COMPENSATION,
  dropdownCategory('cat.employment-status', 'Employment status', EMPLOYMENT_STATUS_FIELDS, 16),
  dropdownCategory('cat.recruiting', 'Recruiting', ['Recruiting requisition ID'], 1),
  dropdownCategory('cat.third-party', 'Third Party Apps', ['Third Party Apps', 'Connected app name'], 2),
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
    id: 'root.recipient-fields',
    label: 'Recipient fields',
    searchKeywords: ['recipient', 'field', 'recipient fields'],
    children: [
      {
        id: 'recipient.employee',
        label: 'Employee',
        searchKeywords: ['employee', 'recipient'],
        children: recipientFieldLeaves('recipient.employee', 'employee'),
      },
      {
        id: 'recipient.employee-manager',
        label: "Employee's manager",
        searchKeywords: ['manager', 'employee manager', 'recipient'],
        children: recipientFieldLeaves('recipient.employee-manager', 'manager'),
      },
      {
        id: 'recipient.custom',
        label: 'Custom',
        searchKeywords: ['custom', 'recipient', 'custom recipient'],
        children: recipientFieldLeaves('recipient.custom', 'custom'),
      },
    ],
  },
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

function sortNodesByLabel(nodes: VariableMenuNode[]): VariableMenuNode[] {
  return [...nodes].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  );
}

/**
 * Flat dropdown root: one “Recipient fields” folder (Custom, Employee, Employee's manager)
 * sorted with employee categories A–Z at the root.
 */
function buildVariableDropdownRoot(): VariableMenuNode[] {
  const recipientRoot = VARIABLE_TREE[0];
  const recipientFields: VariableMenuNode = {
    ...recipientRoot,
    children: sortNodesByLabel(recipientRoot?.children ?? []),
  };
  return sortNodesByLabel([recipientFields, ...VARIABLE_DROPDOWN_TREE]);
}

export const VARIABLE_DROPDOWN_ROOT: VariableMenuNode[] = buildVariableDropdownRoot();

/** Parenthetical count beside folder rows at the flat root list. */
export function getDropdownFolderLabel(node: VariableMenuNode, pathIds: string[]): string {
  if (!hasVariableChildren(node)) return node.label;
  if (pathIds.length === 0) {
    const count =
      node.id === 'root.recipient-fields' ? node.children!.length : countLeafNodes(node);
    return `${node.label} (${count})`;
  }
  if (pathIds.length === 1 && pathIds[0] === 'root.recipient-fields') {
    return `${node.label} (${countLeafNodes(node)})`;
  }
  return node.label;
}
