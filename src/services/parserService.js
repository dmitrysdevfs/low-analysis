import * as cheerio from 'cheerio';

export const parseLawHtml = (html) => {
  const $ = cheerio.load(html);
  // TODO: Implement logic to parse law structure
  return {
    title: $('h1').text(),
    elements: []
  };
};
