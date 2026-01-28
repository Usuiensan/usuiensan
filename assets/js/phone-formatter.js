/**
 * 電話番号フォーマッター＆バリデータ（日本）
 * 携帯電話と固定電話のフォーマッティング・判定機能を提供
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
 *
 * 【判定機能】
 * - 日本の電話番号として妥当性チェック
 * - 一般人の電話番号の可能性判定
 * - 電話番号タイプ判別（携帯/固定/特殊番号/不明）
 * - 地域情報の推定
 */

/**
 * 電話番号の総合判定を行う
 * @param {string} value - 入力値（数字のみまたはハイフン含む）
 * @returns {Object} 判定結果
 *   - isValid: 日本の電話番号として有効か
 *   - isGeneral: 一般人の電話番号の可能性が高いか
 *   - type: 'mobile' | 'fixed' | 'special' | 'unknown'
 *   - region: 地域情報（固定電話の場合）
 *   - reason: 判定の理由
 */
function validatePhoneNumber(value) {
  const digits = value.replace(/[^0-9]/g, '');

  // 基本チェック
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

  // 電話番号タイプの判定
  const phoneType = classifyPhoneNumberType(digits);

  return {
    isValid: phoneType.isValid,
    isGeneral: phoneType.isGeneral,
    type: phoneType.type,
    region: phoneType.region,
    reason: phoneType.reason,
  };
}

/**
 * 電話番号タイプを分類する（内部関数）
 * @private
 */
function classifyPhoneNumberType(digits) {
  const secondChar = digits[1];
  const thirdChar = digits[2];

  // パターン1: 携帯電話 (0[6789]0-XXXX-XXXX)
  // 11桁で 0[6789]0 で始まるパターン
  // digits[0]='0', digits[1]='6/7/8/9', digits[2]='0'
  if (digits.length === 11 && '6789'.includes(secondChar) && digits[2] === '0') {
    return {
      isValid: true,
      isGeneral: true,
      type: 'mobile',
      region: null,
      reason: `携帯電話（0${secondChar}0系）`,
    };
  }

  // パターン2: 固定電話 (市外局番を判別)
  const fixedPhoneInfo = identifyFixedPhoneRegion(digits);
  if (fixedPhoneInfo) {
    return {
      isValid: true,
      isGeneral: true,
      type: 'fixed',
      region: fixedPhoneInfo.region,
      reason: `固定電話（${fixedPhoneInfo.region}）`,
    };
  }

  // パターン3: フリーダイヤル・ナビダイヤルなど (0120, 0570など)
  const specialInfo = identifySpecialNumber(digits);
  if (specialInfo) {
    return {
      isValid: true,
      isGeneral: specialInfo.isGeneral,
      type: 'special',
      region: null,
      reason: specialInfo.reason,
    };
  }

  // パターン4: 判定不可
  return {
    isValid: false,
    isGeneral: false,
    type: 'unknown',
    region: null,
    reason: '電話番号として判定できません',
  };
}

/**
 * 固定電話の地域を判定する
 * @private
 * @returns {Object|null} {region: '地域名', digits: 桁数} または null
 */
function identifyFixedPhoneRegion(digits) {
  const secondChar = digits[1];
  const thirdChar = digits[2];

  // 携帯電話の可能性をまずチェック
  // 携帯電話は 0[6789]0 で始まり11桁
  if (digits.length === 11 && '6789'.includes(secondChar) && digits[2] === '0') {
    return null; // 携帯電話なので固定電話ではない
  }

  // 4桁市外局番パターン: 0[1-5][0257-9]
  // 例: 0120, 0570, 0210, 0250, 0270, etc.
  if (
    ['1', '2', '3', '4', '5'].includes(secondChar) &&
    ['0', '2', '5', '7', '9'].includes(thirdChar)
  ) {
    // TODO: 4桁市外局番の詳細マッピング
    // 例: 0120→フリーダイヤル, 0210→青森, 0250→新潟, など
    return {
      region: '4桁市外局番地域',
      digits: 4,
    };
  }

  // 3桁市外局番パターン: 0[6-9][1-9]
  // 例: 075 (京都), 078 (兵庫), 099 (鹿児島)
  if (
    ['6', '7', '8', '9'].includes(secondChar) &&
    thirdChar &&
    thirdChar !== '0'
  ) {
    // TODO: 3桁市外局番の詳細マッピング
    // 例: 075→京都, 078→兵庫, など
    return {
      region: '3桁市外局番地域',
      digits: 3,
    };
  }

  // 2桁市外局番パターン: 0[1-6]
  // 例: 03 (東京), 06 (大阪), 092 (福岡)
  if (['1', '2', '3', '4', '5', '6'].includes(secondChar)) {
    // TODO: 2桁市外局番の詳細マッピング
    // 例: 03→東京, 06→大阪, など
    return {
      region: '2桁市外局番地域',
      digits: 2,
    };
  }

  return null;
}

/**
 * 特殊番号（フリーダイヤル、ナビダイヤルなど）を判定する
 * @private
 * @returns {Object|null} {reason: 説明, isGeneral: boolean} または null
 */
function identifySpecialNumber(digits) {
  const areaCode = digits.slice(0, 4);

  // TODO: 特殊番号の判定ロジックを追加
  // フリーダイヤル: 0120, 0800
  // ナビダイヤル: 0570
  // など

  return null;
}

/**
 * 携帯電話かどうかを判定する
 * @param {string} value - 入力値
 * @returns {boolean}
 */
function isMobilePhone(value) {
  const result = validatePhoneNumber(value);
  return result.type === 'mobile' && result.isValid;
}

/**
 * 固定電話かどうかを判定する
 * @param {string} value - 入力値
 * @returns {Object} {isFixed: boolean, region: string|null}
 */
function isFixedPhone(value) {
  const result = validatePhoneNumber(value);
  return {
    isFixed: result.type === 'fixed' && result.isValid,
    region: result.region,
  };
}

/**
 * 一般人の電話番号の可能性が高いかを判定する
 * @param {string} value - 入力値
 * @returns {boolean}
 */
function isGeneralPhoneNumber(value) {
  const result = validatePhoneNumber(value);
  return result.isGeneral && result.isValid;
}

/**
 * 日本の電話番号として有効かを判定する
 * @param {string} value - 入力値
 * @returns {boolean}
 */
function isValidJapanesePhoneNumber(value) {
  const result = validatePhoneNumber(value);
  return result.isValid;
}

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
