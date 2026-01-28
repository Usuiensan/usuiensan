/**
 * 市外局番テストスクリプト
 */

const testCases = [
  { input: '09000000000', desc: '携帯電話（090）' },
  { input: '07512345678', desc: '京都固定電話（075）' },
  { input: '06123456789', desc: '大阪固定電話（06）' },
  { input: '07712345678', desc: '滋賀固定電話（077）' },
  { input: '07812345678', desc: '兵庫固定電話（078）' },
  { input: '07912345678', desc: '兵庫固定電話（079）' },
  { input: '03123456789', desc: '東京固定電話（03）- 近畿圏外' },
  { input: '06212345678', desc: '4桁市外局番（0621）' },
  { input: '01201234567', desc: 'フリーダイヤル（0120）' },
  { input: '05701234567', desc: 'ナビダイヤル（0570）' },
  { input: '090123456', desc: '入力途中（9桁）' },
  { input: '1234567890', desc: '無効（0で始まらない）' },
];

// validatePhoneNumber 関数を簡易実装（テスト用）
function identifyFixedPhoneRegion(digits) {
  const secondChar = digits[1];
  const thirdChar = digits[2];

  if (
    digits.length === 11 &&
    '6789'.includes(secondChar) &&
    digits[2] === '0'
  ) {
    return null; // 携帯電話
  }

  // 4桁市外局番
  if (
    ['1', '2', '3', '4', '5'].includes(secondChar) &&
    ['0', '2', '5', '7', '9'].includes(thirdChar)
  ) {
    const areaCode = digits.substring(0, 4);
    const fourDigitAreaCodes = {
      '0120': { region: 'フリーダイヤル', isKinki: false },
      '0570': { region: 'ナビダイヤル', isKinki: false },
    };

    if (fourDigitAreaCodes[areaCode]) {
      const info = fourDigitAreaCodes[areaCode];
      return { region: info.region, digits: 4, isKinki: info.isKinki };
    }
    return { region: '特殊番号', digits: 4, isKinki: false };
  }

  // 3桁市外局番
  if (
    ['6', '7', '8', '9'].includes(secondChar) &&
    thirdChar &&
    thirdChar !== '0'
  ) {
    const areaCode = digits.substring(0, 3);
    const threeDigitAreaCodes = {
      '075': { region: '京都府', isKinki: true },
      '077': { region: '滋賀県', isKinki: true },
      '078': { region: '兵庫県（神戸）', isKinki: true },
      '079': { region: '兵庫県（姫路）', isKinki: true },
      '072': { region: '大阪府（泉大津）', isKinki: true },
    };

    if (threeDigitAreaCodes[areaCode]) {
      const info = threeDigitAreaCodes[areaCode];
      return { region: info.region, digits: 3, isKinki: info.isKinki };
    }
    return { region: '3桁市外局番地域', digits: 3, isKinki: false };
  }

  // 2桁市外局番
  if (['1', '2', '3', '4', '5', '6'].includes(secondChar)) {
    const areaCode = digits.substring(0, 2);
    const twoDigitAreaCodes = {
      '03': { region: '東京都', isKinki: false },
      '06': { region: '大阪府', isKinki: true },
    };

    if (twoDigitAreaCodes[areaCode]) {
      const info = twoDigitAreaCodes[areaCode];
      return { region: info.region, digits: 2, isKinki: info.isKinki };
    }
    return { region: '2桁市外局番地域', digits: 2, isKinki: false };
  }

  return null;
}

function validatePhoneNumber(value) {
  const digits = value.replace(/[^0-9]/g, '');

  if (!digits.startsWith('0')) {
    return {
      isValid: false,
      isGeneral: false,
      type: 'unknown',
      region: null,
      isKinki: false,
      reason: '0から始まる番号ではありません',
    };
  }

  if (digits.length < 10) {
    return {
      isValid: false,
      isGeneral: false,
      type: 'incomplete',
      region: null,
      isKinki: false,
      reason: `桁数が不足しています（${digits.length}桁 / 最小10桁）`,
    };
  }

  if (digits.length > 11) {
    return {
      isValid: false,
      isGeneral: false,
      type: 'unknown',
      region: null,
      isKinki: false,
      reason: '桁数が多すぎます（最大11桁）',
    };
  }

  const secondChar = digits[1];

  // 携帯電話
  if (
    digits.length === 11 &&
    '6789'.includes(secondChar) &&
    digits[2] === '0'
  ) {
    return {
      isValid: true,
      isGeneral: true,
      type: 'mobile',
      region: null,
      isKinki: true,
      reason: `携帯電話（0${secondChar}0系）`,
    };
  }

  // 固定電話
  const fixedPhoneInfo = identifyFixedPhoneRegion(digits);
  if (fixedPhoneInfo) {
    return {
      isValid: true,
      isGeneral: true,
      type: 'fixed',
      region: fixedPhoneInfo.region,
      isKinki: fixedPhoneInfo.isKinki,
      reason: `固定電話（${fixedPhoneInfo.region}）`,
    };
  }

  return {
    isValid: false,
    isGeneral: false,
    type: 'unknown',
    region: null,
    isKinki: false,
    reason: '電話番号として判定できません',
  };
}

console.log('\n=== 市外局番テスト結果 ===\n');
console.log(
  '入力番号'.padEnd(20) +
    '| 説明'.padEnd(25) +
    '| type'.padEnd(12) +
    '| 地域'.padEnd(15) +
    '| 近畿圏\n' +
    '-'.repeat(90),
);

testCases.forEach((testCase) => {
  const result = validatePhoneNumber(testCase.input);
  const kinki = result.isKinki ? '✓ YES' : '✗ NO';

  console.log(
    testCase.input.padEnd(20) +
      '| ' +
      testCase.desc.padEnd(24) +
      '| ' +
      result.type.padEnd(11) +
      '| ' +
      (result.region || '-').padEnd(14) +
      '| ' +
      kinki,
  );
});

console.log('\n=== 詳細結果 ===\n');
testCases.forEach((testCase) => {
  const result = validatePhoneNumber(testCase.input);
  console.log(`【${testCase.input}】 ${testCase.desc}`);
  console.log(`  isValid: ${result.isValid}`);
  console.log(`  type: ${result.type}`);
  console.log(`  region: ${result.region || 'null'}`);
  console.log(`  isKinki: ${result.isKinki}`);
  console.log(`  reason: ${result.reason}`);
  console.log('');
});
