/**
 * 市外局番判定ロジックのデバッグ
 */

// 簡単なテスト
const testPhone = '07512345678'; // 京都（075）
const digits = testPhone.replace(/[^0-9]/g, '');
const secondChar = digits[1]; // '7'
const thirdChar = digits[2]; // '5'

console.log('=== デバッグ ===');
console.log(`入力: ${testPhone}`);
console.log(`digits: ${digits}`);
console.log(`secondChar: ${secondChar}`);
console.log(`thirdChar: ${thirdChar}`);
console.log(`digits.substring(0, 2): ${digits.substring(0, 2)}`);
console.log(`digits.substring(0, 3): ${digits.substring(0, 3)}`);

console.log('\n=== ロジック判定 ===');
console.log(
  `2桁判定: ['1', '2', '3', '4', '5', '6'].includes('${secondChar}') = ${['1', '2', '3', '4', '5', '6'].includes(secondChar)}`,
);
console.log(
  `3桁判定: ['1', '2', '5', '7', '8', '9'].includes('${secondChar}') = ${['1', '2', '5', '7', '8', '9'].includes(secondChar)}`,
);

console.log('\n=== 問題分析 ===');
console.log('075 は 3桁市外局番ですが:');
console.log('  - secondChar = 7 なので、2桁判定に引っかからない（正解）');
console.log('  - secondChar = 7 なので、3桁判定に引っかかる（正解）');
console.log(
  '  - ただし 3桁チェックで digits.substring(0, 2) = "07" を使っている',
);
console.log(
  '  - "07" は 3桁市外局番マップに無く、デフォルトで "3桁市外局番地域" になっている',
);
console.log('\n=> 修正: digits.substring(0, 3) を使うべき！');
