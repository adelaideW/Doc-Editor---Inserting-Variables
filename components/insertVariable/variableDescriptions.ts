/** Target length for ~3 lines at 280px / 11–12px type. */
const MAX_DESCRIPTION_CHARS = 140;

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

/** Prototype descriptions derived from variable titles (max ~3 lines when rendered). */
export function getVariableDescription(label: string): string {
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
