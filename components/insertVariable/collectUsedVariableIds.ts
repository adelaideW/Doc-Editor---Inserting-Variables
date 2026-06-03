/** Collect variable ids currently inserted in the editor as chips. */
export function collectUsedVariableIds(editor: HTMLElement | null): Set<string> {
  const ids = new Set<string>();
  if (!editor) return ids;
  editor.querySelectorAll('.variable-chip[data-variable-id]').forEach((el) => {
    const id = el.getAttribute('data-variable-id');
    if (id) ids.add(id);
  });
  return ids;
}
