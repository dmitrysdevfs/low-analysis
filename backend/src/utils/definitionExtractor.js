/**
 * Extracts definitions from Article 1 elements.
 * Looks for text matching "1) term - definition" or 'термін "term" - definition'.
 */
export const extractDefinitions = (elements) => {
  const definitions = [];
  const st1Elements = elements.filter(
    (el) => el.code && el.code.includes('.st1.') && el.text,
  );

  for (const el of st1Elements) {
    const text = el.text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    // 1. Try matching with quotes: 1) "term" - def or термін "term" - def
    let match = text.match(
      /^(?:\d+\)\s*)?(?:термін\s+)?["']([^"']+)["']\s*[-–—]\s*(.+)$/i,
    );

    // 2. Try without quotes: 1) term - def
    if (!match) {
      match = text.match(
        /^(?:\d+\)\s*)?(?:терміни?\s+)?([^-–—]+?)\s*[-–—]\s*(.+)$/i,
      );
    }

    if (match) {
      let term = match[1].trim();
      let definition = match[2].trim();
      // Only accept reasonable term lengths
      if (term && definition && term.length < 150) {
        definitions.push({ term, definition });
      }
    }
  }
  return definitions;
};
