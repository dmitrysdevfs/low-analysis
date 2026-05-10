import axios from 'axios';

/**
 * Extracts the core law code from a zakon.rada URL or raw code.
 * Example: "https://zakon.rada.gov.ua/laws/show/254к/96-ВР/ed20200101" -> "254к/96-ВР"
 * Example: "1953-20" -> "1953-20"
 */
export const extractLawCode = (input) => {
  if (!input) return null;
  const decodedInput = decodeURI(input);

  // If it's a URL
  if (decodedInput.includes('zakon.rada.gov.ua')) {
    const urlMatch = decodedInput.match(
      /\/laws\/show\/((?:[^/#?]+)(?:\/[^/#?]+)?)/,
    );
    if (urlMatch && urlMatch[1]) {
      let rawCode = urlMatch[1];
      // strip /ed... if it's there
      rawCode = rawCode.split('/ed')[0];
      // strip /print if it's there
      rawCode = rawCode.split('/print')[0];
      return rawCode;
    }
  }

  // Not a URL, assume direct code
  return decodedInput.trim();
};

/**
 * Fetches the main HTML and frame HTML for a given law code.
 * @param {string} code - e.g. "254к/96-ВР"
 * @returns {Promise<{mainHtml: string, frameHtml: string}>}
 */
export const fetchLawData = async (code) => {
  const encodedCode = encodeURI(code);
  const mainUrl = `https://zakon.rada.gov.ua/laws/show/${encodedCode}`;
  const frameUrl = `${mainUrl}.frame`; // zakon rada appends .frame to get the text

  const axiosConfig = {
    headers: {
      'Accept-Language': 'uk',
      'User-Agent': 'Mozilla/5.0 (compatible; LowAnalysisBot/1.0)',
    },
    timeout: 15000,
  };

  try {
    const [mainRes, frameRes] = await Promise.all([
      axios.get(mainUrl, axiosConfig),
      axios.get(frameUrl, axiosConfig),
    ]);

    return {
      mainHtml: mainRes.data,
      frameHtml: frameRes.data,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Law not found at ${mainUrl}`);
    }
    throw new Error(`Failed to fetch law: ${error.message}`);
  }
};
