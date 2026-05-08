import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('data/raw/1953-20.html', 'utf8');
const $ = cheerio.load(html);

console.log('TITLE 1 (rvts78):', $('.rvts78').first().text().trim());
console.log('TITLE 2 (rvps1 span):', $('p.rvps1 span').first().text().trim());
console.log('TITLE 3 (h1):', $('h1').first().text().trim());
console.log('TITLE 4 (title tag):', $('title').text().trim());

const code = [];
$('#edition option[selected]').each((_, el) => {
  code.push($(el).attr('value'));
});
console.log('EDITION SELECTED OPTIONS:', code);

const allEditions = [];
$('#edition option').each((_, el) => {
  allEditions.push($(el).attr('value'));
});
console.log('ALL EDITIONS:', allEditions.slice(0, 3));

console.log('--- STRUCTURE ---');
const articleNode = $('#article');
if (articleNode.length) {
  console.log('Found #article');
  console.log('First 500 chars inside #article:', articleNode.text().replace(/\s+/g, ' ').substring(0, 500));
} else {
  console.log('NO #article found. Looking for .rvps2 or other paragraphs...');
}

const first10p = [];
$('p').slice(0, 10).each((_, el) => {
  first10p.push({
    class: $(el).attr('class'),
    text: $(el).text().substring(0, 50).trim()
  });
});
console.log('First 10 p tags:', first10p);


