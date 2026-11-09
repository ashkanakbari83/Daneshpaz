/**
 * Gather the tips and warnings already written for each cooking step into two
 * de-duplicated lists for the recipe page. Nothing is added or reworded:
 * [{ text, step (1-based), title }].
 */
export function collectStepNotes(steps = []) {
  const seen = { tips: new Set(), warnings: new Set() };
  const out = { tips: [], warnings: [] };
  steps.forEach((step, index) => {
    for (const kind of ['tips', 'warnings']) {
      for (const text of step[kind] ?? []) {
        if (seen[kind].has(text)) continue;
        seen[kind].add(text);
        out[kind].push({ text, step: index + 1, title: step.title });
      }
    }
  });
  return out;
}
