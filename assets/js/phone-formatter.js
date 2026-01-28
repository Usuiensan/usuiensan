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
 *   - type: 'mobile' | 'fixed' | 'special' | 'incomplete' | 'unknown'
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
      isKinki: false,
      reason: '0から始まる番号ではありません',
    };
  }

  // 桁数不足かチェック（入力が0で始まるが11桁未満）
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

  // 電話番号タイプの判定
  const phoneType = classifyPhoneNumberType(digits);

  return {
    isValid: phoneType.isValid,
    isGeneral: phoneType.isGeneral,
    type: phoneType.type,
    region: phoneType.region,
    isKinki: phoneType.isKinki || false,
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

  // パターン2: 固定電話 (市外局番を判別)
  const fixedPhoneInfo = identifyFixedPhoneRegion(digits);
  if (fixedPhoneInfo) {
    return {
      isValid: true,
      isGeneral: true,
      type: 'fixed',
      region: fixedPhoneInfo.region,
      isKinki: fixedPhoneInfo.isKinki || false,
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
 * @returns {Object|null} {region: '地域名', digits: 桁数, isKinki: 近畿圏か} または null
 */
function identifyFixedPhoneRegion(digits) {
  // Use centralized area code data when available
  const areaCodes = window.PHONE_AREA_CODES || { twoDigit: {}, threeDigit: {}, fourDigit: {}, fiveDigit: {} };

  // 携帯電話の除外チェック
  if (digits.length === 11 && /^0[6789]0/.test(digits)) {
    return null;
  }

  // 5桁優先 (稀なケース)
  const code5 = digits.substring(0, 5);
  if (areaCodes.fiveDigit && areaCodes.fiveDigit[code5]) {
    return { region: areaCodes.fiveDigit[code5].region, digits: 5, isKinki: !!areaCodes.fiveDigit[code5].isKinki };
  }

  // 4桁 (フリーダイヤル等)
  const code4 = digits.substring(0, 4);
  if (areaCodes.fourDigit && areaCodes.fourDigit[code4]) {
    return { region: areaCodes.fourDigit[code4].region, digits: 4, isKinki: !!areaCodes.fourDigit[code4].isKinki };
  }

  // 3桁
  const code3 = digits.substring(0, 3);
  if (areaCodes.threeDigit && areaCodes.threeDigit[code3]) {
    return { region: areaCodes.threeDigit[code3].region, digits: 3, isKinki: !!areaCodes.threeDigit[code3].isKinki };
  }

  // 2桁
  const code2 = digits.substring(0, 2);
  if (areaCodes.twoDigit && areaCodes.twoDigit[code2]) {
    return { region: areaCodes.twoDigit[code2].region, digits: 2, isKinki: !!areaCodes.twoDigit[code2].isKinki };
  }

  return null;
}

/**
 * 特殊番号（フリーダイヤル、ナビダイヤルなど）を判定する      '0920': { region: '長崎県', isKinki: false },
      '0920': { region: '長崎県', isKinki: false },
      '0930': { region: '福岡県', isKinki: false },
      '0940': { region: '福岡県', isKinki: false },
      '0942': { region: '佐賀県・福岡県', isKinki: false },
      '0943': { region: '福岡県', isKinki: false },
      '0943': { region: '福岡県', isKinki: false },
      '0944': { region: '熊本県・福岡県', isKinki: false },
      '0946': { region: '福岡県', isKinki: false },
      '0947': { region: '福岡県', isKinki: false },
      '0948': { region: '福岡県', isKinki: false },
      '0949': { region: '福岡県', isKinki: false },
      '0949': { region: '福岡県', isKinki: false },
      '0950': { region: '長崎県', isKinki: false },
      '0952': { region: '佐賀県', isKinki: false },
      '0954': { region: '佐賀県', isKinki: false },
      '0954': { region: '佐賀県', isKinki: false },
      '0955': { region: '佐賀県', isKinki: false },
      '0955': { region: '佐賀県・長崎県', isKinki: false },
      '0956': { region: '長崎県', isKinki: false },
      '0957': { region: '長崎県', isKinki: false },
      '0957': { region: '長崎県', isKinki: false },
      '0959': { region: '長崎県', isKinki: false },
      '0959': { region: '長崎県', isKinki: false },
      '0959': { region: '長崎県', isKinki: false },
      '0964': { region: '熊本県', isKinki: false },
      '0965': { region: '熊本県', isKinki: false },
      '0966': { region: '熊本県', isKinki: false },
      '0966': { region: '熊本県', isKinki: false },
      '0967': { region: '熊本県', isKinki: false },
      '0967': { region: '熊本県', isKinki: false },
      '0967': { region: '熊本県', isKinki: false },
      '0968': { region: '熊本県', isKinki: false },
      '0968': { region: '熊本県', isKinki: false },
      '0969': { region: '熊本県', isKinki: false },
      '0972': { region: '大分県', isKinki: false },
      '0972': { region: '大分県', isKinki: false },
      '0973': { region: '大分県', isKinki: false },
      '0973': { region: '大分県', isKinki: false },
      '0974': { region: '大分県', isKinki: false },
      '0974': { region: '大分県', isKinki: false },
      '0977': { region: '大分県', isKinki: false },
      '0978': { region: '大分県', isKinki: false },
      '0978': { region: '大分県', isKinki: false },
      '0978': { region: '大分県', isKinki: false },
      '0979': { region: '大分県・福岡県', isKinki: false },
      '0980': { region: '沖縄県', isKinki: false },
      '0980': { region: '沖縄県', isKinki: false },
      '0980': { region: '沖縄県', isKinki: false },
      '0982': { region: '宮崎県', isKinki: false },
      '0982': { region: '宮崎県', isKinki: false },
      '0982': { region: '宮崎県', isKinki: false },
      '0983': { region: '宮崎県', isKinki: false },
      '0984': { region: '宮崎県', isKinki: false },
      '0985': { region: '宮崎県', isKinki: false },
      '0986': { region: '鹿児島県・宮崎県', isKinki: false },
      '0987': { region: '宮崎県', isKinki: false },
      '0993': { region: '鹿児島県', isKinki: false },
      '0993': { region: '鹿児島県', isKinki: false },
      '0994': { region: '鹿児島県', isKinki: false },
      '0994': { region: '鹿児島県', isKinki: false },
      '0995': { region: '鹿児島県', isKinki: false },
      '0995': { region: '鹿児島県', isKinki: false },
      '0996': { region: '鹿児島県', isKinki: false },
      '0996': { region: '鹿児島県', isKinki: false },
      '0997': { region: '鹿児島県', isKinki: false },
      '0997': { region: '鹿児島県', isKinki: false },
      '0997': { region: '鹿児島県', isKinki: false },
      '0997': { region: '鹿児島県', isKinki: false },
      '0997': { region: '鹿児島県', isKinki: false },


  // 2桁市外局番パターン: 0[1-6]
  if (['1', '2', '3', '4', '5', '6'].includes(secondChar)) {
    const areaCode = digits.substring(0, 2);
    const twoDigitAreaCodes = {
      '03': { region: '東京都', isKinki: false },
      '04': { region: '埼玉県・千葉県', isKinki: false },
      '06': { region: '大阪府', isKinki: true },
    };
    if (twoDigitAreaCodes[areaCode]) {
      const info = twoDigitAreaCodes[areaCode];
      return { region: info.region, digits: 2, isKinki: info.isKinki };
    }

    return { region: '2桁市外局番地域', digits: 2, isKinki: false };
  }

  //5桁市外局番地域
  if (['1', '2', '3', '4', '5', '6'].includes(secondChar)) {
    const areaCode = digits.substring(0, 5);
    const fiveDigitAreaCodes = {
      '01267': { region: '北海道岩見沢市宝水町、三笠市', isKinki: false },
      '01372': { region: '北海道茅部郡鹿部町', isKinki: false },
      '01374': { region: '北海道茅部郡森町', isKinki: false },
      '01377': { region: '北海道山越郡', isKinki: false },
      '01392': { region: '北海道上磯郡', isKinki: false },
      '01397': { region: '北海道奥尻郡', isKinki: false },
      '01398': {
        region:
          '北海道久遠郡せたな町大成区、二海郡八雲町（熊石相沼町、熊石鮎川町、熊石泉岱町、熊石雲石町、熊石大谷町、熊石折戸町、熊石黒岩町、熊石見日町、熊石関内町、熊石平町、熊石畳岩町、熊石館平町、熊石泊川町、熊石鳴神町、熊石西浜町及び熊石根崎町に限る。）',
        isKinki: false,
      },
      '01456': {
        region:
          '北海道沙流郡日高町（栄町西、栄町東、新町、千栄、富岡、日高、本町西、本町東、松風町、三岩、宮下町、山手町及び若葉町を除く。）、新冠郡新冠町里平',
        isKinki: false,
      },
      '01457': {
        region:
          '北海道沙流郡（平取町及び日高町（栄町西、栄町東、新町、千栄、富岡、日高、本町西、本町東、松風町、三岩、宮下町、山手町及び若葉町に限る。）に限る。）',
        isKinki: false,
      },
      '01466': { region: '北海道幌泉郡', isKinki: false },
      '01547': { region: '北海道釧路市音別町、白糠郡', isKinki: false },
      '01558': {
        region:
          '北海道中川郡幕別町（忠類朝日、忠類共栄、忠類協徳、忠類公親、忠類幸町、忠類栄町、忠類白銀町、忠類新生、忠類東宝、忠類中当、忠類錦町、忠類西当、忠類晩成、忠類日和、忠類古里、忠類幌内、忠類明和、忠類元忠類及び忠類本町に限る。）、広尾郡',
        isKinki: false,
      },
      '01564': {
        region: '北海道河東郡（上士幌町及び士幌町に限る。）',
        isKinki: false,
      },
      '01586': { region: '北海道紋別郡湧別町', isKinki: false },
      '01587': { region: '北海道常呂郡佐呂間町', isKinki: false },
      '01632': {
        region: '北海道天塩郡（遠別町、天塩町及び幌延町に限る。）',
        isKinki: false,
      },
      '01634': {
        region: '北海道枝幸郡（中頓別町及び浜頓別町に限る。）',
        isKinki: false,
      },
      '01635': { region: '北海道宗谷郡', isKinki: false },
      '01648': {
        region:
          '北海道苫前郡羽幌町（天売相影、天売富磯、天売弁天、天売前浜、天売和浦、焼尻白浜、焼尻西浦、焼尻東浜及び焼尻緑ヶ丘に限る。）',
        isKinki: false,
      },
      '01654': { region: '北海道名寄市（風連町を除く。）', isKinki: false },
      '01655': { region: '北海道名寄市風連町、上川郡下川町', isKinki: false },
      '01656': {
        region: '北海道中川郡（音威子府村、中川町及び美深町に限る。）',
        isKinki: false,
      },
      '01658': {
        region: '北海道上川郡（愛別町及び上川町に限る。）',
        isKinki: false,
      },
      '04992': {
        region: '東京都大島町、神津島村、利島村、新島村',
        isKinki: false,
      },
      '04994': { region: '東京都御蔵島村、三宅村', isKinki: false },
      '04996': { region: '東京都青ヶ島村、八丈町', isKinki: false },
      '04998': { region: '東京都小笠原村', isKinki: false },
      '05769': { region: '岐阜県高山市荘川町、大野郡', isKinki: false },
      '05979': { region: '三重県南牟婁郡御浜町', isKinki: true },
      '07468': {
        region: '奈良県吉野郡（上北山村及び下北山村に限る。）',
        isKinki: true,
      },
      '08387': {
        region:
          '山口県萩市（江崎、上小川西分、上小川東分、上田万、下小川、下田万、須佐、鈴野川、中小川、弥富上及び弥富下に限る。）',
        isKinki: false,
      },
      '08388': {
        region:
          '山口県萩市（片俣、吉部上、吉部下、高佐上及び高佐下に限る。）、阿武郡',
        isKinki: false,
      },
      '08396': { region: '山口県美祢市美東町', isKinki: false },
      '08477': { region: '広島県庄原市東城町', isKinki: false },
      '08512': { region: '島根県隠岐郡隠岐の島町', isKinki: false },
      '08514': { region: '島根県隠岐郡（隠岐の島町を除く。）', isKinki: false },
      '09802': {
        region: '沖縄県島尻郡（北大東村及び南大東村に限る。）',
        isKinki: false,
      },
      '09912': { region: '鹿児島県鹿児島郡十島村', isKinki: false },
      '09913': { region: '鹿児島県鹿児島郡三島村', isKinki: false },
      '09969': {
        region: '鹿児島県薩摩川内市（鹿島町、上甑町、里町及び下甑町に限る。）',
        isKinki: false,
      },
    };
    if (fiveDigitAreaCodes[areaCode]) {
      const info = fiveDigitAreaCodes[areaCode];
      return { region: info.region, digits: 5, isKinki: info.isKinki };
    }

    return { region: '5桁市外局番地域', digits: 5, isKinki: false };
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
