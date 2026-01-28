const fs = require('fs');
const path = require('path');

// load formatter
const formatterCode = fs.readFileSync(
  path.join(__dirname, 'assets/js/phone-formatter.js'),
  'utf8',
);
// load area codes
const areaCodes = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'assets/json/phone-area-codes.json'),
    'utf8',
  ),
);
global.window = global;
global.window.PHONE_AREA_CODES = areaCodes;

eval(formatterCode);

// expose formatting helper for node tests
if (typeof formatFixedPhone === 'function')
  global.formatFixedPhone = formatFixedPhone;

const samples = [
  '0312345678', // 03-1234-5678
  '0612345678', // 06-1234-5678
  '0751234567', // 075-123-4567
  '0781234567', // 078-123-4567
  '0120123456', // 0120-123-456
  '0570123456', // 0570-123-456
  '0721123456', // 0721-123-456
  '0743123456', // 0743-123-456
  '0532123456', // 0532-123-456
  '0493123456', // 0493-123-456
  '0892123456', // 0892-123-456
];

console.log('input -> formatted');
samples.forEach((s) => {
  console.log(s + ' -> ' + formatFixedPhone(s));
});
