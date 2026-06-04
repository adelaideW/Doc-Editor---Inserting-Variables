import type { VariableItem } from '../VariableDropdown';
import type { RecipientSelection } from './RecipientAssignPopover';

/** Target length for ~3 lines at 280px / 11–12px type. */
const MAX_DESCRIPTION_CHARS = 140;

export type RecipientFieldMeta = {
  recipientType: 'employee' | 'manager' | 'custom';
  fieldType?: 'text' | 'checkbox' | 'signature' | 'date-signed';
  /** Assigned recipient label (lowercase), e.g. "legal counsel" or a person's name. */
  assignedRoleLabel?: string;
};

export function recipientTypeFromPlaceholderId(
  id: string
): RecipientFieldMeta['recipientType'] | null {
  if (id === 'employee') return 'employee';
  if (id === 'manager') return 'manager';
  return null;
}

export function parseRecipientFieldType(
  value: string | null
): RecipientFieldMeta['fieldType'] | undefined {
  if (
    value === 'text' ||
    value === 'checkbox' ||
    value === 'signature' ||
    value === 'date-signed'
  ) {
    return value;
  }
  return undefined;
}

function truncateLabel(label: string, max = 36): string {
  const trimmed = label.trim();
  if (trimmed.length <= max) return trimmed;
  const slice = trimmed.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > max * 0.55 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trim()}…`;
}

/** Build a short, name-aware sentence capped for line-clamp-3 UI. */
function describe(label: string, detail: string): string {
  const name = label.trim();
  let text = `${name} — ${detail}`;
  if (text.length <= MAX_DESCRIPTION_CHARS) return text;
  text = `${truncateLabel(name)} — ${detail}`;
  if (text.length <= MAX_DESCRIPTION_CHARS) return text;
  return `${truncateLabel(name, 24)} — ${detail}`.slice(0, MAX_DESCRIPTION_CHARS).trim();
}

/** Recipient chip tooltips: “{role} {field} - {detail}”. */
function describeRecipientField(title: string, detail: string): string {
  let text = `${title} - ${detail}`;
  if (text.length <= MAX_DESCRIPTION_CHARS) return text;
  text = `${truncateLabel(title)} - ${detail}`;
  if (text.length <= MAX_DESCRIPTION_CHARS) return text;
  return `${truncateLabel(title, 24)} - ${detail}`.slice(0, MAX_DESCRIPTION_CHARS).trim();
}

function recipientRolePhrase(meta: RecipientFieldMeta): string {
  if (meta.assignedRoleLabel) return meta.assignedRoleLabel;
  switch (meta.recipientType) {
    case 'employee':
      return 'employee';
    case 'manager':
      return "employee's manager";
    case 'custom':
      return 'custom';
  }
}

function fieldTypePhrase(
  fieldType: RecipientFieldMeta['fieldType'] | undefined,
  label: string
): string {
  switch (fieldType) {
    case 'signature':
      return 'signature';
    case 'checkbox':
      return 'checkbox';
    case 'date-signed':
      return 'date signed';
    case 'text':
      return 'text';
    default:
      return label.trim().toLowerCase() || 'field';
  }
}

function recipientFieldDetail(
  fieldType: RecipientFieldMeta['fieldType'] | undefined,
  recipientType: RecipientFieldMeta['recipientType']
): string {
  switch (fieldType) {
    case 'signature':
      return 'signature captured when this recipient completes signing and is embedded in the final PDF.';
    case 'checkbox':
      return 'yes/no response collected from this recipient when they complete the document.';
    case 'date-signed':
      return 'date recorded when this recipient signs or completes their section of the document.';
    case 'text':
      return 'text entered by this recipient in the document body at send or signing time.';
    default:
      return recipientType === 'custom'
        ? 'assign a recipient before send; value is filled when they complete the document.'
        : 'merge field tied to this recipient role and populated when they interact with the document.';
  }
}

function recipientFieldDescription(meta: RecipientFieldMeta, label: string): string {
  const title = `${recipientRolePhrase(meta)} ${fieldTypePhrase(meta.fieldType, label)}`;
  return describeRecipientField(title, recipientFieldDetail(meta.fieldType, meta.recipientType));
}

/** Tooltip meta from chip DOM, including assigned recipient when resolved. */
export function getRecipientMetaFromChip(chip: HTMLElement): RecipientFieldMeta | undefined {
  const baseType = chip.getAttribute('data-recipient-type');
  if (baseType !== 'employee' && baseType !== 'manager' && baseType !== 'custom') {
    return undefined;
  }

  const fieldType = parseRecipientFieldType(chip.getAttribute('data-field-type'));
  const needsRecipient = chip.getAttribute('data-needs-recipient') === 'true';
  const relatedId = chip.getAttribute('data-related-recipient-id');
  const relatedLabel = chip.getAttribute('data-related-recipient')?.trim();

  if (!needsRecipient && relatedId) {
    const mapped = recipientTypeFromPlaceholderId(relatedId);
    if (mapped) return { recipientType: mapped, fieldType };
    if (relatedLabel) {
      return {
        recipientType: 'custom',
        fieldType,
        assignedRoleLabel: relatedLabel.toLowerCase(),
      };
    }
  }

  const storedRole = chip.getAttribute('data-assigned-role-label')?.trim();
  if (storedRole) {
    return {
      recipientType: baseType,
      fieldType,
      assignedRoleLabel: storedRole.toLowerCase(),
    };
  }

  return { recipientType: baseType, fieldType };
}

export function getChipVariableDescription(chip: HTMLElement): string | null {
  const label = chip.getAttribute('data-variable') ?? '';
  const meta = getRecipientMetaFromChip(chip);
  if (meta) return getVariableDescription(label, meta);
  const stored = chip.getAttribute('data-variable-description');
  if (stored) return stored;
  return label ? getVariableDescription(label) : null;
}

export function syncChipVariableDescription(chip: HTMLElement): void {
  const description = getChipVariableDescription(chip);
  if (description) chip.setAttribute('data-variable-description', description);
}

/** Meta after user picks a recipient in the assign popover. */
export function getRecipientMetaForAssignment(
  selection: RecipientSelection,
  fieldType?: RecipientFieldMeta['fieldType']
): RecipientFieldMeta {
  if (selection.kind === 'placeholder') {
    const mapped = recipientTypeFromPlaceholderId(selection.id);
    if (mapped) return { recipientType: mapped, fieldType };
    return {
      recipientType: 'custom',
      fieldType,
      assignedRoleLabel: selection.label.trim().toLowerCase(),
    };
  }
  return {
    recipientType: 'custom',
    fieldType,
    assignedRoleLabel: selection.employee.name.trim().toLowerCase(),
  };
}

/** Prototype descriptions derived from variable titles (max ~3 lines when rendered). */
export function getVariableDescription(label: string, meta?: RecipientFieldMeta): string {
  if (meta?.recipientType) {
    return recipientFieldDescription(meta, label);
  }

  const hay = label.toLowerCase();

  if (hay.includes('discriminator') || (hay.includes('variant') && hay.includes('template'))) {
    return describe(label, 'identifies which template variant was used when the envelope was sent.');
  }
  if (hay.includes('template') || hay.includes('revision') || hay.includes('version')) {
    return describe(label, 'template metadata captured at send time for document variant tracking.');
  }
  if (hay.includes('zip') || hay.includes('postal')) {
    return describe(label, 'postal code used for envelope routing and compliance filings.');
  }
  if (hay.includes('address')) {
    return describe(label, 'mailing or work address populated from Rippling at send time.');
  }
  if (hay.includes('city') || hay.includes('state') || hay.includes('country')) {
    return describe(label, 'geographic value from the related Rippling object at document send.');
  }
  if (hay.includes('name') || hay.includes('legal') || hay.includes('dba')) {
    return describe(label, 'display name merged into generated documents and merge fields.');
  }
  if (
    hay.includes('date') ||
    hay.includes('signed') ||
    hay.includes('timestamp') ||
    hay.includes('time')
  ) {
    return describe(label, 'date or timestamp stored on the object graph when the document was sent.');
  }
  if (
    hay.includes('currency') ||
    hay.includes('compensation') ||
    hay.includes('pay') ||
    hay.includes('salary')
  ) {
    return describe(label, 'monetary value localized to the worker currency for offer and comp tables.');
  }
  if (hay.includes('email') || hay.includes('phone') || hay.includes('dial')) {
    return describe(label, 'contact value pulled from the employee or company profile in Rippling.');
  }
  if (hay.includes('signature') || hay.includes('sign')) {
    return describe(label, 'signature field captured during signing and embedded in the final PDF.');
  }
  if (hay.includes('checkbox') || hay.includes('boolean') || hay.includes('flag')) {
    return describe(label, 'yes/no flag evaluated from the source object when the document is generated.');
  }
  if (hay.includes('hash') || hay.includes('token') || /\bid\b/.test(hay)) {
    return describe(label, 'system identifier stored on the workflow record at send time.');
  }
  if (hay.includes('ordinal') || hay.includes('sequence') || hay.includes('count')) {
    return describe(label, 'ordered or rolled-up workflow value merged at document generation.');
  }
  if (hay.includes('policy') || hay.includes('balance') || hay.includes('time off')) {
    return describe(label, 'time-off or policy data from the employee record at send time.');
  }

  return describe(label, 'Rippling merge field populated from the object graph at send time.');
}

export function getVariableDescriptionForItem(item: VariableItem): string {
  const label = item.insertLabel ?? item.label;
  if (item.recipientType) {
    return getVariableDescription(label, {
      recipientType: item.recipientType,
      fieldType: item.fieldType,
    });
  }
  return getVariableDescription(label);
}
