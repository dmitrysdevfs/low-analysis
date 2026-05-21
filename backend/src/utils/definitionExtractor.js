/**
 * Extracts definitions from Article 1 elements.
 * Looks for text matching "1) term - definition" or 'термін "term" - definition'.
 */
export const extractDefinitions = (elements) => {
  const definitions = [];
  const definitionElements = elements.filter(
    (el) =>
      el.code &&
      (el.code.includes('.st1.') || el.code.includes('.st2.')) &&
      el.text,
  );

  for (const el of definitionElements) {
    let text = el.text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    // Temporarily replace dashes inside parentheses to avoid splitting on e.g. "(далі - ...)"
    text = text.replace(/\(([^)]+)\)/g, (match, content) => {
      const replacedContent = content.replace(/[-–—]/g, '__DASH__');
      return `(${replacedContent})`;
    });

    // 1. Try matching with quotes: 1) "term" - def or термін "term" - def
    // Enforce that the dash separator must be surrounded by spaces to prevent matching compound words.
    let match = text.match(
      /^(?:\d+\)\s*)?(?:термін\s+)?["']([^"']+)["']\s+[-–—]\s+(.+)$/i,
    );

    // 2. Try without quotes: 1) term - def
    if (!match) {
      match = text.match(
        /^(?:\d+\)\s*)?(?:терміни?\s+)?([^-–—]+?)\s+[-–—]\s+(.+)$/i,
      );
    }

    if (match) {
      let term = match[1].replace(/__DASH__/g, '-').trim();
      let definition = match[2].replace(/__DASH__/g, '-').trim();
      // Only accept reasonable term lengths
      if (term && definition && term.length < 150) {
        definitions.push({ term, definition });
      }
    }
  }
  return definitions;
};
