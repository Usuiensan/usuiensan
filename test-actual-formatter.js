/**
 * 実際のphone-formatter.jsを使用した市外局番テスト
 */

// phone-formatter.js から validatePhoneNumber を読み込む
const fs = require('fs');
const path = require('path');

// phone-formatter.js のコンテンツを読み込む
const formatterCode = fs.readFileSync(
  path.join(__dirname, 'assets/js/phone-formatter.js'),
  'utf8',
);

// JSON をテスト環境にロードしておく（eval の中で参照されるため）
const areaCodes = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'assets/json/phone-area-codes.json'), 'utf8'),
);
global.window = global;
global.window.PHONE_AREA_CODES = areaCodes;

// evaluate して実行
eval(formatterCode);

const testCases = [
  { input: '09000000000', desc: '携帯電話（090）' },
  { input: '07512345678', desc: '京都固定電話（075）' },
  { input: '06123456789', desc: '大阪固定電話（06）' },
  { input: '07712345678', desc: '滋賀固定電話（077）' },
  { input: '07812345678', desc: '兵庫固定電話（078）' },
  { input: '07912345678', desc: '兵庫固定電話（079）' },
  { input: '03123456789', desc: '東京固定電話（03）- 近畿圏外' },
  { input: '01201234567', desc: 'フリーダイヤル（0120）' },
  { input: '05701234567', desc: 'ナビダイヤル（0570）' },
  { input: '090123456', desc: '入力途中（9桁）' },
  { input: '1234567890', desc: '無効（0で始まらない）' },
];

console.log('\n=== 実際のファイルで市外局番テスト ===\n');
console.log(
  '入力'.padEnd(15) +
    ' | 説明'.padEnd(27) +
    ' | type'.padEnd(12) +
    ' | 地域'.padEnd(20) +
    ' | 近畿',
);
console.log('-'.repeat(100));

testCases.forEach((testCase) => {
  const result = validatePhoneNumber(testCase.input);
  const kinki = result.isKinki ? '✓' : '✗';

  console.log(
    testCase.input.padEnd(15) +
      ' | ' +
      testCase.desc.padEnd(26) +
      ' | ' +
      result.type.padEnd(11) +
      ' | ' +
      (result.region || '-').padEnd(19) +
      ' | ' +
      kinki,
  );
});

console.log('\n=== 詳細結果 ===\n');
testCases.forEach((testCase) => {
  const result = validatePhoneNumber(testCase.input);
  console.log(`【${testCase.input}】 ${testCase.desc}`);
  console.log(
    `  type: ${result.type}, region: ${result.region || 'null'}, isKinki: ${result.isKinki}`,
  );
  console.log(`  reason: ${result.reason}`);
  console.log('');
});
