/**
 * 電話番号フォーマッター（日本）
 * 携帯電話と固定電話のフォーマッティング機能を提供
 *
 * 【携帯電話】
 * - 形式：0[6789]0-XXXX-XXXX（11桁）
 * - キャリア検証：2文字目が6,7,8,9のいずれか
 *
 * 【固定電話】
 * - 市外局番パターン自動判別
 * - 2桁市外局番: XX-XXXX-XXXX (03, 06など)
 * - 3桁市外局番: XXX-XXX-XXXX (075, 078など)
 * - 4桁市外局番: XXXX-XXX-XXXX (0120, 0570など)
 */

/**
 * 携帯電話のフォーマット
 * 0[6789]0-XXXX-XXXX（11桁）
 * @param {string} value - 入力値
 * @returns {string} フォーマットされた値
 */
const formatMobilePhone = (value) => {
  const digits = value.replace(/[^0-9]/g, '');

  // 最初の1文字が0ではない場合は数字のみ返す
  if (!digits.startsWith('0')) return digits.slice(0, 11);

  // 2文字目が6,7,8,9ではない場合はフォーマットしない
  if (digits.length >= 2 && !'6789'.includes(digits[1])) {
    return digits.slice(0, 11);
  }

  const truncated = digits.slice(0, 11);

  if (truncated.length <= 3) return truncated;
  if (truncated.length <= 7)
    return truncated.slice(0, 3) + '-' + truncated.slice(3);
  return (
    truncated.slice(0, 3) +
    '-' +
    truncated.slice(3, 7) +
    '-' +
    truncated.slice(7)
  );
};

/**
 * 固定電話のフォーマット（独自実装）
 * 日本の市外局番パターンに対応
 *
 * 対応パターン:
 * - 2桁市外局番 (03, 06など): XX-XXXX-XXXX
 * - 3桁市外局番 (075, 078など): XXX-XXX-XXXX
 * - 4桁市外局番 (0120, 0570など): XXXX-XXX-XXXX
 *
 * @param {string} value - 入力値
 * @returns {string} フォーマットされた値
 */
const formatFixedPhone = (value) => {
  const digits = value.replace(/[^0-9]/g, '');

  if (!digits.startsWith('0')) {
    return digits.slice(0, 11);
  }

  const truncated = digits.slice(0, 11);

  // 3桁目で市外局番の長さを判定
  const secondChar = truncated[1];
  const thirdChar = truncated[2];

  // 4桁市外局番パターン: 0[1-5]0[0-9]
  if (
    secondChar === '1' ||
    secondChar === '2' ||
    secondChar === '3' ||
    secondChar === '4' ||
    secondChar === '5'
  ) {
    if (
      thirdChar === '0' ||
      thirdChar === '2' ||
      thirdChar === '5' ||
      thirdChar === '7' ||
      thirdChar === '9'
    ) {
      // フリーダイヤル: 0120, ナビダイヤル: 0570など
      if (truncated.length <= 4) return truncated;
      if (truncated.length <= 7)
        return truncated.slice(0, 4) + '-' + truncated.slice(4);
      return (
        truncated.slice(0, 4) +
        '-' +
        truncated.slice(4, 7) +
        '-' +
        truncated.slice(7)
      );
    }
  }

  // 3桁市外局番パターン: 0[67][0-9]
  if (
    (secondChar === '6' ||
      secondChar === '7' ||
      secondChar === '8' ||
      secondChar === '9') &&
    thirdChar &&
    thirdChar !== '0'
  ) {
    // 075 (京都), 078 (神戸)など
    if (truncated.length <= 3) return truncated;
    if (truncated.length <= 6)
      return truncated.slice(0, 3) + '-' + truncated.slice(3);
    return (
      truncated.slice(0, 3) +
      '-' +
      truncated.slice(3, 6) +
      '-' +
      truncated.slice(6)
    );
  }

  // 2桁市外局番パターン: 0[1-6]（デフォルト）
  // 03 (東京), 06 (大阪)など
  if (truncated.length <= 2) return truncated;
  if (truncated.length <= 6)
    return truncated.slice(0, 2) + '-' + truncated.slice(2);
  return (
    truncated.slice(0, 2) +
    '-' +
    truncated.slice(2, 6) +
    '-' +
    truncated.slice(6)
  );
};

/**
 * 電話番号入力フィールドをセットアップ
 * 携帯電話と固定電話のイベントリスナーを設定
 */
function setupPhoneNumberInputs() {
  const mobilePhoneInput = document.getElementById('mobilePhone');
  const fixedPhoneInput = document.getElementById('fixedPhone');

  // 携帯電話イベント
  if (mobilePhoneInput) {
    mobilePhoneInput.addEventListener('input', (e) => {
      const formatted = formatMobilePhone(e.target.value);
      e.target.value = formatted;
      saveFormData(true);
    });

    mobilePhoneInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData(
        'text',
      );
      const formatted = formatMobilePhone(pastedText);
      e.target.value = formatted;
      mobilePhoneInput.dispatchEvent(new Event('input'));
    });
  }

  // 固定電話イベント
  if (fixedPhoneInput) {
    fixedPhoneInput.addEventListener('input', (e) => {
      const formatted = formatFixedPhone(e.target.value);
      e.target.value = formatted;
      saveFormData(true);
    });

    fixedPhoneInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData(
        'text',
      );
      const formatted = formatFixedPhone(pastedText);
      e.target.value = formatted;
      fixedPhoneInput.dispatchEvent(new Event('input'));
    });
  }
}
