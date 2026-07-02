import type { VariableItem } from '../VariableDropdown';

export type RecipientFieldLabel = 'Text' | 'Checkbox' | 'Signature' | 'Date signed';

export type RecipientKind = 'placeholder' | 'internal';

export type RecipientEntry = {
  id: string;
  label: string;
  sublabel: string;
  paletteIndex: number;
  kind: RecipientKind;
};

export type RecipientPanelView = 'fields' | 'recipients';

export type RecipientTone = {
  bg: string;
  border: string;
  icon: string;
  avatarBg: string;
  avatarIcon: string;
};

export const RECIPIENT_FIELD_MIME = 'application/x-recipient-field-label';
export const RECIPIENT_FIELD_RID_MIME = 'application/x-recipient-field-rid';

export const RECIPIENT_FIELD_LABELS: RecipientFieldLabel[] = [
  'Text',
  'Checkbox',
  'Signature',
  'Date signed',
];

export const RECIPIENT_TONE_PALETTE: RecipientTone[] = [
  { bg: '#F3E8FF', border: '#E9D5FF', icon: '#7E22CE', avatarBg: '#F3E8FF', avatarIcon: '#7E22CE' },
  { bg: '#CCFBF1', border: '#99F6E4', icon: '#0F766E', avatarBg: '#CCFBF1', avatarIcon: '#0F766E' },
  { bg: '#FEF3C7', border: '#FDE68A', icon: '#B45309', avatarBg: '#FEF3C7', avatarIcon: '#B45309' },
  { bg: '#FFE4E6', border: '#FECDD3', icon: '#BE123C', avatarBg: '#FFE4E6', avatarIcon: '#BE123C' },
  { bg: '#DBEAFE', border: '#BFDBFE', icon: '#1D4ED8', avatarBg: '#DBEAFE', avatarIcon: '#1D4ED8' },
  { bg: '#E0E7FF', border: '#C7D2FE', icon: '#4338CA', avatarBg: '#E0E7FF', avatarIcon: '#4338CA' },
  { bg: '#DCFCE7', border: '#BBF7D0', icon: '#15803D', avatarBg: '#DCFCE7', avatarIcon: '#15803D' },
];

export const DEFAULT_RECIPIENTS: RecipientEntry[] = [
  { id: 'employee', label: 'Employee', sublabel: 'Placeholder recipient', paletteIndex: 0, kind: 'placeholder' },
  {
    id: 'manager',
    label: "Employee's manager",
    sublabel: 'Placeholder recipient',
    paletteIndex: 1,
    kind: 'placeholder',
  },
];

export function toneForRecipient(recipients: RecipientEntry[], recipientId: string): RecipientTone {
  const entry = recipients.find((r) => r.id === recipientId);
  const index = entry?.paletteIndex ?? 0;
  return RECIPIENT_TONE_PALETTE[index % RECIPIENT_TONE_PALETTE.length];
}

function fieldLabelToType(label: RecipientFieldLabel): VariableItem['fieldType'] {
  switch (label) {
    case 'Checkbox':
      return 'checkbox';
    case 'Signature':
      return 'signature';
    case 'Date signed':
      return 'date-signed';
    default:
      return 'text';
  }
}

function recipientIdToType(
  recipientId: string,
  recipients: RecipientEntry[]
): 'employee' | 'manager' | 'custom' {
  if (recipientId === 'employee') return 'employee';
  if (recipientId === 'manager') return 'manager';
  const entry = recipients.find((r) => r.id === recipientId);
  if (entry?.kind === 'placeholder' && (entry.id === 'employee' || entry.id === 'manager')) {
    return entry.id as 'employee' | 'manager';
  }
  return 'custom';
}

export function buildRecipientFieldItem(
  fieldLabel: RecipientFieldLabel,
  recipientId: string,
  recipients: RecipientEntry[] = DEFAULT_RECIPIENTS
): VariableItem {
  const recipient = recipients.find((r) => r.id === recipientId);
  const recipientType = recipientIdToType(recipientId, recipients);
  const fieldType = fieldLabelToType(fieldLabel);
  const roleLabel = recipient?.label ?? 'Recipient';
  return {
    id: `recipient-field.${recipientId}.${fieldType}`,
    label: fieldLabel,
    insertLabel: fieldLabel,
    category: 'Recipient fields',
    path: `Recipient fields > ${roleLabel} > ${fieldLabel}`,
    searchText: `${fieldLabel} ${roleLabel} recipient field`.toLowerCase(),
    recipientType,
    fieldType,
    needsRecipient: recipientType === 'custom',
  };
}

export function parseRecipientFieldLabel(value: string): RecipientFieldLabel | null {
  return RECIPIENT_FIELD_LABELS.includes(value as RecipientFieldLabel)
    ? (value as RecipientFieldLabel)
    : null;
}
