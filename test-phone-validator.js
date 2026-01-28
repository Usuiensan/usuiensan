// 判定機能テストスクリプト
function validatePhoneNumber(value) {
  const digits = value.replace(/[^0-9]/g, '');

  if (!digits.startsWith('0')) {
    return {
      isValid: false,
      isGeneral: false,
      type: 'unknown',
      region: null,
      reason: '0から始まる番号ではありません',
    };
  }

  if (digits.length < 10 || digits.length > 11) {
    return {
      isValid: false,
      isGeneral: false,
      type: 'unknown',
      region: null,
      reason: '桁数が不正です（10～11桁）',
    };
  }

  const secondChar = digits[1];
  const thirdChar = digits[2];

  // 携帯電話チェック
  if ('6789'.includes(secondChar) && digits.length === 11) {
    return {
      isValid: true,
      isGeneral: true,
      type: 'mobile',
      region: null,
      reason: `携帯電話（0${secondChar}0系）`,
    };
  }

  // 4桁市外局番
  if (['1', '2', '3', '4', '5'].includes(secondChar) &&
      ['0', '2', '5', '7', '9'].includes(thirdChar)) {
    return {
      isValid: true,
      isGeneral: true,
      type: 'fixed',
      region: '4桁市外局番地域',
      reason: '固定電話（4桁市外局番）',
    };
  }

  // 3桁市外局番
  if (['6', '7', '8', '9'].includes(secondChar) &&
      thirdChar && thirdChar !== '0') {
    return {
      isValid: true,
      isGeneral: true,
      type: 'fixed',
      region: '3桁市外局番地域',
      reason: '固定電話（3桁市外局番）',
    };
  }

  // 2桁市外局番
  if (['1', '2', '3', '4', '5', '6'].includes(secondChar)) {
    return {
      isValid: true,
      isGeneral: true,
      type: 'fixed',
      region: '2桁市外局番地域',
      reason: '固定電話（2桁市外局番）',
    };
  }

  return {
    isValid: false,
    isGeneral: false,
    type: 'unknown',
    region: null,
    reason: '電話番号として判定できません',
  };
}

// テストケース
console.log('=== 電話番号判定テスト ===\n');

const testCases = [
  ['09012345678', '有効な携帯電話'],
  ['08012345678', '有効な携帯電話（ドコモ）'],
  ['07011111111', '有効な携帯電話（ワイモバイル）'],
  ['01012345678', '無効（キャリア外の0100）'],
  ['03123456789', '有効な固定電話（東京）'],
  ['06123456789', '有効な固定電話（大阪）'],
  ['07512345678', '有効な固定電話（京都）'],
  ['07812345678', '有効な固定電話（兵庫）'],
  ['01201234567', '有効な固定電話（4桁市外局番）'],
  ['05701234567', '有効な固定電話（4桁市外局番）'],
  ['1234567890', '無効（0で始まらない）'],
  ['09001234567', '無効（桁数が多い）'],
  ['0901234567', '無効（10桁で携帯の形式外）'],
];

testCases.forEach(([phone, label]) => {
  const result = validatePhoneNumber(phone);
  console.log(`📞 ${phone}`);
  console.log(`   ラベル: ${label}`);
  console.log(`   有効: ${result.isValid ? '✓' : '✗'}`);
  console.log(`   タイプ: ${result.type}`);
  console.log(`   一般人の番号: ${result.isGeneral ? '◎ YES' : '✗ NO'}`);
  if (result.region) console.log(`   地域: ${result.region}`);
  console.log(`   理由: ${result.reason}`);
  console.log();
});
