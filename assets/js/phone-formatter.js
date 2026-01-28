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

(function loadPhoneAreaCodes() {
  // Node 環境やブラウザで PHONE_AREA_CODES が無ければフォールバックで読込
  if (typeof window === 'undefined' && typeof global !== 'undefined') {
    global.window = global; // テスト用に window をエイリアス
  }
  if (!window.PHONE_AREA_CODES) {
    try {
      if (typeof require === 'function') {
        // assets/js から見た相対パス ../json/phone-area-codes.json
        window.PHONE_AREA_CODES = require('../json/phone-area-codes.json');
      } else {
        window.PHONE_AREA_CODES = {};
      }
    } catch (e) {
      window.PHONE_AREA_CODES = {};
      if (typeof console !== 'undefined') console.error('PHONE_AREA_CODES load failed', e);
    }
  }
})();

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
      reason: `桁数が不足しています（${digits.length}桁 / 最小10桁）`,
    };
  }

  if (digits.length > 11) {
    return {
      isValid: false,
      isGeneral: false,
      type: 'unknown',
      region: null,
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
  // まず JSON ロード版で照合し、無ければ従来ロジックにフォールバックする
  let fixedPhoneInfo = null;
  if (typeof window !== 'undefined' && window.PHONE_AREA_CODES) {
    if (typeof identifyFixedPhoneRegionUsingJson === 'function') {
      fixedPhoneInfo = identifyFixedPhoneRegionUsingJson(digits);
    }
  }
  if (!fixedPhoneInfo) {
    fixedPhoneInfo = identifyFixedPhoneRegion(digits);
  }
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
  const secondChar = digits[1];
  const thirdChar = digits[2];

  // 携帯電話の可能性をまずチェック
  // 携帯電話は 0[6789]0 で始まり11桁
  if (
    digits.length === 11 &&
    '6789'.includes(secondChar) &&
    digits[2] === '0'
  ) {
    return null; // 携帯電話なので固定電話ではない
  }
  // 2桁市外局番パターン: 0[1-6]
  if (['1', '2', '3', '4', '5', '6'].includes(secondChar)) {
    const areaCode = digits.substring(0, 2);
    const twoDigitAreaCodes = {
      '03': { region: '東京都', isKinki: false },
      '04': { region: '埼玉県・千葉県 ', isKinki: false },
      '06': { region: '大阪府・兵庫県尼崎市 ', isKinki: true },
    };
    if (twoDigitAreaCodes[areaCode]) {
      const info = twoDigitAreaCodes[areaCode];
      return { region: info.region, digits: 2, isKinki: info.isKinki };
    }

    return { region: '2桁市外局番地域', digits: 2, isKinki: false };
  }

  // 3桁市外局番パターン: 0[67][1-9]
  if (['1', '2', '5', '7', '8', '9'].includes(secondChar)) {
    const areaCode = digits.substring(0, 3);
    const threeDigitAreaCodesDigitAreaCodes = {
      '011': { region: '北海道', isKinki: false },
      '015': { region: '北海道', isKinki: false },
      '017': { region: '青森県', isKinki: false },
      '018': { region: '秋田県', isKinki: false },
      '019': { region: '岩手県', isKinki: false },
      '022': { region: '宮城県', isKinki: false },
      '023': { region: '山形県', isKinki: false },
      '024': { region: '福島県', isKinki: false },
      '025': { region: '新潟県', isKinki: false },
      '026': { region: '長野県', isKinki: false },
      '027': { region: '群馬県', isKinki: false },
      '028': { region: '栃木県', isKinki: false },
      '029': { region: '茨城県', isKinki: false },
      '042': { region: '東京都・埼玉県', isKinki: false },
      '043': { region: '千葉県', isKinki: false },
      '044': { region: '神奈川県・東京都', isKinki: false },
      '045': { region: '神奈川県', isKinki: false },
      '046': { region: '神奈川県', isKinki: false },
      '047': { region: '千葉県', isKinki: false },
      '048': { region: '埼玉県', isKinki: false },
      '049': { region: '埼玉県', isKinki: false },
      '052': { region: '愛知県', isKinki: false },
      '053': { region: '静岡県', isKinki: false },
      '054': { region: '静岡県', isKinki: false },
      '055': { region: '山梨県・静岡県', isKinki: false },
      '058': { region: '岐阜県', isKinki: false },
      '059': { region: '三重県', isKinki: false },
      '072': { region: '大阪府・兵庫県', isKinki: true },
      '073': { region: '和歌山県', isKinki: true },
      '075': { region: '京都府', isKinki: true },
      '076': { region: '石川県・富山県', isKinki: false },
      '077': { region: '滋賀県・京都府', isKinki: true },
      '078': { region: '兵庫県', isKinki: true },
      '079': { region: '兵庫県', isKinki: true },
      '082': { region: '広島県', isKinki: false },
      '083': { region: '山口県', isKinki: false },
      '084': { region: '広島県', isKinki: false },
      '086': { region: '岡山県', isKinki: false },
      '087': { region: '香川県', isKinki: false },
      '088': { region: '徳島県・高知県', isKinki: false },
      '089': { region: '愛媛県', isKinki: false },
      '092': { region: '福岡県', isKinki: false },
      '093': { region: '福岡県', isKinki: false },
      '095': { region: '長崎県', isKinki: false },
      '096': { region: '熊本県', isKinki: false },
      '097': { region: '大分県', isKinki: false },
      '098': { region: '沖縄県', isKinki: false },
      '099': { region: '鹿児島県', isKinki: false },
    };
    if (threeDigitAreaCodesDigitAreaCodes[areaCode]) {
      const info = threeDigitAreaCodesDigitAreaCodes[areaCode];
      return { region: info.region, digits: 3, isKinki: info.isKinki };
    }

    return { region: '3桁市外局番地域', digits: 3, isKinki: false };
  }
  // 4桁市外局番パターン:
  if (['1', '2', '5', '7', '8', '9'].includes(secondChar)) {
    const areaCode = digits.substring(0, 4);
    const fourDigitAreaCodesDigitAreaCodes = {
      '0123': { region: '北海道', isKinki: false },
      '0123': { region: '北海道', isKinki: false },
      '0123': { region: '北海道', isKinki: false },
      '0124': { region: '北海道', isKinki: false },
      '0125': { region: '北海道', isKinki: false },
      '0126': { region: '北海道', isKinki: false },
      '0133': { region: '北海道', isKinki: false },
      '0133': { region: '北海道', isKinki: false },
      '0134': { region: '北海道', isKinki: false },
      '0135': { region: '北海道', isKinki: false },
      '0135': { region: '北海道', isKinki: false },
      '0136': { region: '北海道', isKinki: false },
      '0136': { region: '北海道', isKinki: false },
      '0137': { region: '北海道', isKinki: false },
      '0137': { region: '北海道', isKinki: false },
      '0138': { region: '北海道', isKinki: false },
      '0139': { region: '北海道', isKinki: false },
      '0139': { region: '北海道', isKinki: false },
      '0142': { region: '北海道', isKinki: false },
      '0143': { region: '北海道', isKinki: false },
      '0144': { region: '北海道', isKinki: false },
      '0145': { region: '北海道', isKinki: false },
      '0145': { region: '北海道', isKinki: false },
      '0146': { region: '北海道', isKinki: false },
      '0146': { region: '北海道', isKinki: false },
      '0152': { region: '北海道', isKinki: false },
      '0152': { region: '北海道', isKinki: false },
      '0152': { region: '北海道', isKinki: false },
      '0153': { region: '北海道', isKinki: false },
      '0153': { region: '北海道', isKinki: false },
      '0153': { region: '北海道', isKinki: false },
      '0153': { region: '北海道', isKinki: false },
      '0154': { region: '北海道', isKinki: false },
      '0155': { region: '北海道', isKinki: false },
      '0156': { region: '北海道', isKinki: false },
      '0156': { region: '北海道', isKinki: false },
      '0157': { region: '北海道', isKinki: false },
      '0158': { region: '北海道', isKinki: false },
      '0158': { region: '北海道', isKinki: false },
      '0158': { region: '北海道', isKinki: false },
      '0162': { region: '北海道', isKinki: false },
      '0163': { region: '北海道', isKinki: false },
      '0163': { region: '北海道', isKinki: false },
      '0164': { region: '北海道', isKinki: false },
      '0164': { region: '北海道', isKinki: false },
      '0164': { region: '北海道', isKinki: false },
      '0165': { region: '北海道', isKinki: false },
      '0166': { region: '北海道', isKinki: false },
      '0167': { region: '北海道', isKinki: false },
      '0172': { region: '青森県', isKinki: false },
      '0173': { region: '青森県', isKinki: false },
      '0173': { region: '青森県', isKinki: false },
      '0174': { region: '青森県', isKinki: false },
      '0175': { region: '青森県', isKinki: false },
      '0175': { region: '青森県', isKinki: false },
      '0176': { region: '青森県', isKinki: false },
      '0178': { region: '青森県', isKinki: false },
      '0179': { region: '青森県', isKinki: false },
      '0182': { region: '秋田県', isKinki: false },
      '0183': { region: '秋田県', isKinki: false },
      '0184': { region: '秋田県', isKinki: false },
      '0185': { region: '秋田県', isKinki: false },
      '0185': { region: '秋田県', isKinki: false },
      '0186': { region: '秋田県', isKinki: false },
      '0186': { region: '秋田県', isKinki: false },
      '0186': { region: '秋田県', isKinki: false },
      '0187': { region: '秋田県', isKinki: false },
      '0187': { region: '秋田県', isKinki: false },
      '0191': { region: '岩手県', isKinki: false },
      '0192': { region: '岩手県', isKinki: false },
      '0193': { region: '岩手県', isKinki: false },
      '0193': { region: '岩手県', isKinki: false },
      '0194': { region: '岩手県', isKinki: false },
      '0194': { region: '岩手県', isKinki: false },
      '0195': { region: '岩手県', isKinki: false },
      '0195': { region: '岩手県', isKinki: false },
      '0197': { region: '岩手県', isKinki: false },
      '0197': { region: '岩手県', isKinki: false },
      '0198': { region: '岩手県', isKinki: false },
      '0198': { region: '岩手県', isKinki: false },
      '0220': { region: '宮城県', isKinki: false },
      '0223': { region: '宮城県', isKinki: false },
      '0224': { region: '宮城県', isKinki: false },
      '0224': { region: '宮城県', isKinki: false },
      '0225': { region: '宮城県', isKinki: false },
      '0226': { region: '宮城県', isKinki: false },
      '0228': { region: '宮城県', isKinki: false },
      '0229': { region: '宮城県', isKinki: false },
      '0233': { region: '山形県', isKinki: false },
      '0234': { region: '山形県', isKinki: false },
      '0235': { region: '山形県', isKinki: false },
      '0237': { region: '山形県', isKinki: false },
      '0237': { region: '山形県', isKinki: false },
      '0238': { region: '山形県', isKinki: false },
      '0238': { region: '山形県', isKinki: false },
      '0240': { region: '福島県', isKinki: false },
      '0241': { region: '福島県', isKinki: false },
      '0241': { region: '福島県', isKinki: false },
      '0241': { region: '福島県', isKinki: false },
      '0241': { region: '福島県', isKinki: false },
      '0242': { region: '福島県', isKinki: false },
      '0243': { region: '福島県', isKinki: false },
      '0244': { region: '福島県', isKinki: false },
      '0246': { region: '福島県', isKinki: false },
      '0247': { region: '福島県', isKinki: false },
      '0247': { region: '福島県', isKinki: false },
      '0248': { region: '福島県', isKinki: false },
      '0248': { region: '福島県', isKinki: false },
      '0250': { region: '新潟県', isKinki: false },
      '0254': { region: '新潟県', isKinki: false },
      '0254': { region: '新潟県', isKinki: false },
      '0254': { region: '新潟県', isKinki: false },
      '0255': { region: '新潟県', isKinki: false },
      '0256': { region: '新潟県', isKinki: false },
      '0256': { region: '新潟県', isKinki: false },
      '0257': { region: '新潟県', isKinki: false },
      '0258': { region: '新潟県', isKinki: false },
      '0259': { region: '新潟県', isKinki: false },
      '0260': { region: '長野県', isKinki: false },
      '0261': { region: '長野県', isKinki: false },
      '0263': { region: '長野県', isKinki: false },
      '0264': { region: '長野県', isKinki: false },
      '0265': { region: '長野県', isKinki: false },
      '0265': { region: '長野県', isKinki: false },
      '0266': { region: '長野県', isKinki: false },
      '0267': { region: '長野県', isKinki: false },
      '0267': { region: '長野県', isKinki: false },
      '0268': { region: '長野県', isKinki: false },
      '0269': { region: '長野県', isKinki: false },
      '0269': { region: '長野県', isKinki: false },
      '0270': { region: '群馬県', isKinki: false },
      '0274': { region: '群馬県', isKinki: false },
      '0274': { region: '群馬県・埼玉県', isKinki: false },
      '0276': { region: '群馬県・埼玉県', isKinki: false },
      '0277': { region: '群馬県', isKinki: false },
      '0278': { region: '群馬県', isKinki: false },
      '0279': { region: '群馬県', isKinki: false },
      '0279': { region: '群馬県', isKinki: false },
      '0280': { region: '茨城県・埼玉県・栃木県', isKinki: false },
      '0282': { region: '栃木県', isKinki: false },
      '0283': { region: '栃木県', isKinki: false },
      '0284': { region: '群馬県・栃木県', isKinki: false },
      '0285': { region: '栃木県', isKinki: false },
      '0285': { region: '栃木県', isKinki: false },
      '0287': { region: '栃木県', isKinki: false },
      '0287': { region: '栃木県', isKinki: false },
      '0287': { region: '栃木県', isKinki: false },
      '0288': { region: '栃木県', isKinki: false },
      '0289': { region: '栃木県', isKinki: false },
      '0291': { region: '茨城県', isKinki: false },
      '0293': { region: '茨城県', isKinki: false },
      '0294': { region: '茨城県', isKinki: false },
      '0295': { region: '茨城県', isKinki: false },
      '0295': { region: '茨城県', isKinki: false },
      '0296': { region: '茨城県', isKinki: false },
      '0296': { region: '茨城県・栃木県', isKinki: false },
      '0297': { region: '茨城県', isKinki: false },
      '0297': { region: '茨城県', isKinki: false },
      '0299': { region: '茨城県', isKinki: false },
      '0299': { region: '茨城県', isKinki: false },
      '0422': { region: '東京都', isKinki: false },
      '0428': { region: '東京都・山梨県', isKinki: false },
      '0436': { region: '千葉県', isKinki: false },
      '0438': { region: '千葉県', isKinki: false },
      '0439': { region: '千葉県', isKinki: false },
      '0460': { region: '神奈川県・静岡県', isKinki: false },
      '0463': { region: '神奈川県', isKinki: false },
      '0465': { region: '神奈川県・静岡県', isKinki: false },
      '0466': { region: '神奈川県', isKinki: false },
      '0467': { region: '神奈川県', isKinki: false },
      '0470': { region: '千葉県', isKinki: false },
      '0470': { region: '千葉県', isKinki: false },
      '0475': { region: '千葉県', isKinki: false },
      '0475': { region: '千葉県', isKinki: false },
      '0476': { region: '千葉県', isKinki: false },
      '0478': { region: '千葉県', isKinki: false },
      '0479': { region: '茨城県・千葉県', isKinki: false },
      '0479': { region: '千葉県', isKinki: false },
      '0480': { region: '埼玉県', isKinki: false },
      '0493': { region: '埼玉県', isKinki: false },
      '0494': { region: '埼玉県', isKinki: false },
      '0495': { region: '埼玉県', isKinki: false },
      '0531': { region: '愛知県', isKinki: false },
      '0532': { region: '愛知県', isKinki: false },
      '0533': { region: '愛知県', isKinki: false },
      '0536': { region: '愛知県', isKinki: false },
      '0536': { region: '愛知県', isKinki: false },
      '0537': { region: '静岡県', isKinki: false },
      '0538': { region: '静岡県', isKinki: false },
      '0539': { region: '静岡県', isKinki: false },
      '0544': { region: '静岡県', isKinki: false },
      '0545': { region: '静岡県', isKinki: false },
      '0547': { region: '静岡県', isKinki: false },
      '0548': { region: '静岡県', isKinki: false },
      '0550': { region: '静岡県', isKinki: false },
      '0551': { region: '山梨県', isKinki: false },
      '0553': { region: '山梨県', isKinki: false },
      '0554': { region: '山梨県', isKinki: false },
      '0555': { region: '山梨県', isKinki: false },
      '0556': { region: '山梨県', isKinki: false },
      '0556': { region: '山梨県', isKinki: false },
      '0557': { region: '静岡県', isKinki: false },
      '0558': { region: '静岡県', isKinki: false },
      '0558': { region: '静岡県', isKinki: false },
      '0561': { region: '愛知県', isKinki: false },
      '0562': { region: '愛知県', isKinki: false },
      '0563': { region: '愛知県', isKinki: false },
      '0564': { region: '愛知県', isKinki: false },
      '0565': { region: '愛知県', isKinki: false },
      '0566': { region: '愛知県', isKinki: false },
      '0567': { region: '愛知県・三重県', isKinki: false },
      '0568': { region: '愛知県', isKinki: false },
      '0569': { region: '愛知県', isKinki: false },
      '0572': { region: '岐阜県', isKinki: false },
      '0573': { region: '岐阜県', isKinki: false },
      '0573': { region: '岐阜県・長野県', isKinki: false },
      '0574': { region: '岐阜県', isKinki: false },
      '0574': { region: '岐阜県', isKinki: false },
      '0575': { region: '岐阜県', isKinki: false },
      '0575': { region: '岐阜県', isKinki: false },
      '0576': { region: '岐阜県', isKinki: false },
      '0577': { region: '岐阜県', isKinki: false },
      '0578': { region: '岐阜県', isKinki: false },
      '0581': { region: '岐阜県', isKinki: false },
      '0584': { region: '岐阜県', isKinki: false },
      '0585': { region: '岐阜県', isKinki: false },
      '0586': { region: '愛知県・岐阜県', isKinki: false },
      '0587': { region: '愛知県', isKinki: false },
      '0594': { region: '三重県', isKinki: true },
      '0595': { region: '三重県', isKinki: true },
      '0595': { region: '三重県', isKinki: true },
      '0596': { region: '三重県', isKinki: true },
      '0597': { region: '三重県', isKinki: true },
      '0597': { region: '三重県', isKinki: true },
      '0598': { region: '三重県', isKinki: true },
      '0598': { region: '三重県', isKinki: true },
      '0599': { region: '三重県', isKinki: true },
      '0599': { region: '三重県', isKinki: true },
      '0721': { region: '大阪府', isKinki: true },
      '0725': { region: '大阪府', isKinki: true },
      '0735': { region: '三重県・和歌山県', isKinki: false },
      '0735': { region: '和歌山県', isKinki: true },
      '0736': { region: '和歌山県', isKinki: true },
      '0736': { region: '和歌山県', isKinki: true },
      '0737': { region: '和歌山県', isKinki: true },
      '0738': { region: '和歌山県', isKinki: true },
      '0739': { region: '和歌山県', isKinki: true },
      '0740': { region: '滋賀県', isKinki: true },
      '0742': { region: '奈良県', isKinki: true },
      '0743': { region: '大阪府・京都府・奈良県', isKinki: false },
      '0744': { region: '奈良県', isKinki: true },
      '0745': { region: '奈良県', isKinki: true },
      '0745': { region: '奈良県', isKinki: true },
      '0746': { region: '奈良県', isKinki: true },
      '0746': { region: '奈良県', isKinki: true },
      '0747': { region: '奈良県', isKinki: true },
      '0747': { region: '奈良県', isKinki: true },
      '0748': { region: '滋賀県', isKinki: true },
      '0748': { region: '滋賀県', isKinki: true },
      '0749': { region: '滋賀県', isKinki: true },
      '0749': { region: '滋賀県', isKinki: true },
      '0761': { region: '石川県', isKinki: false },
      '0761': { region: '石川県', isKinki: false },
      '0763': { region: '富山県', isKinki: false },
      '0765': { region: '富山県', isKinki: false },
      '0766': { region: '富山県', isKinki: false },
      '0767': { region: '石川県', isKinki: false },
      '0767': { region: '石川県', isKinki: false },
      '0768': { region: '石川県', isKinki: false },
      '0768': { region: '石川県', isKinki: false },
      '0770': { region: '福井県', isKinki: false },
      '0770': { region: '福井県', isKinki: false },
      '0771': { region: '京都府', isKinki: true },
      '0771': { region: '京都府', isKinki: true },
      '0772': { region: '京都府', isKinki: true },
      '0772': { region: '京都府', isKinki: true },
      '0773': { region: '京都府', isKinki: true },
      '0773': { region: '京都府', isKinki: true },
      '0774': { region: '京都府', isKinki: true },
      '0776': { region: '福井県', isKinki: false },
      '0778': { region: '福井県', isKinki: false },
      '0779': { region: '福井県', isKinki: false },
      '0790': { region: '兵庫県', isKinki: true },
      '0790': { region: '兵庫県', isKinki: true },
      '0791': { region: '兵庫県', isKinki: true },
      '0791': { region: '兵庫県', isKinki: true },
      '0794': { region: '兵庫県', isKinki: true },
      '0795': { region: '兵庫県', isKinki: true },
      '0795': { region: '兵庫県', isKinki: true },
      '0796': { region: '兵庫県', isKinki: true },
      '0796': { region: '兵庫県', isKinki: true },
      '0797': { region: '兵庫県', isKinki: true },
      '0798': { region: '兵庫県', isKinki: true },
      '0799': { region: '兵庫県', isKinki: true },
      '0799': { region: '兵庫県', isKinki: true },
      '0820': { region: '山口県', isKinki: false },
      '0820': { region: '山口県', isKinki: false },
      '0823': { region: '広島県', isKinki: false },
      '0824': { region: '広島県', isKinki: false },
      '0824': { region: '広島県', isKinki: false },
      '0826': { region: '広島県', isKinki: false },
      '0826': { region: '広島県', isKinki: false },
      '0826': { region: '広島県', isKinki: false },
      '0827': { region: '広島県・山口県', isKinki: false },
      '0829': { region: '広島県', isKinki: false },
      '0833': { region: '山口県', isKinki: false },
      '0834': { region: '山口県', isKinki: false },
      '0835': { region: '山口県', isKinki: false },
      '0836': { region: '山口県', isKinki: false },
      '0837': { region: '山口県', isKinki: false },
      '0837': { region: '山口県', isKinki: false },
      '0838': { region: '山口県', isKinki: false },
      '0845': { region: '広島県', isKinki: false },
      '0846': { region: '広島県', isKinki: false },
      '0846': { region: '広島県', isKinki: false },
      '0847': { region: '広島県', isKinki: false },
      '0847': { region: '広島県', isKinki: false },
      '0847': { region: '広島県', isKinki: false },
      '0848': { region: '広島県', isKinki: false },
      '0852': { region: '島根県', isKinki: false },
      '0853': { region: '島根県', isKinki: false },
      '0854': { region: '島根県', isKinki: false },
      '0854': { region: '島根県', isKinki: false },
      '0854': { region: '島根県', isKinki: false },
      '0854': { region: '島根県', isKinki: false },
      '0855': { region: '島根県', isKinki: false },
      '0855': { region: '島根県', isKinki: false },
      '0855': { region: '島根県', isKinki: false },
      '0856': { region: '島根県', isKinki: false },
      '0856': { region: '島根県', isKinki: false },
      '0857': { region: '鳥取県', isKinki: false },
      '0858': { region: '鳥取県', isKinki: false },
      '0858': { region: '鳥取県', isKinki: false },
      '0859': { region: '鳥取県', isKinki: false },
      '0859': { region: '鳥取県', isKinki: false },
      '0863': { region: '岡山県', isKinki: false },
      '0865': { region: '岡山県', isKinki: false },
      '0865': { region: '岡山県', isKinki: false },
      '0866': { region: '岡山県', isKinki: false },
      '0866': { region: '岡山県', isKinki: false },
      '0866': { region: '岡山県', isKinki: false },
      '0867': { region: '岡山県', isKinki: false },
      '0867': { region: '岡山県', isKinki: false },
      '0867': { region: '岡山県', isKinki: false },
      '0868': { region: '岡山県', isKinki: false },
      '0868': { region: '岡山県', isKinki: false },
      '0869': { region: '岡山県', isKinki: false },
      '0869': { region: '岡山県', isKinki: false },
      '0875': { region: '香川県', isKinki: false },
      '0877': { region: '香川県', isKinki: false },
      '0879': { region: '香川県', isKinki: false },
      '0879': { region: '香川県', isKinki: false },
      '0880': { region: '高知県', isKinki: false },
      '0880': { region: '高知県', isKinki: false },
      '0880': { region: '高知県', isKinki: false },
      '0880': { region: '高知県', isKinki: false },
      '0883': { region: '徳島県', isKinki: false },
      '0883': { region: '徳島県', isKinki: false },
      '0883': { region: '徳島県', isKinki: false },
      '0884': { region: '徳島県', isKinki: false },
      '0884': { region: '徳島県', isKinki: false },
      '0884': { region: '徳島県', isKinki: false },
      '0885': { region: '徳島県', isKinki: false },
      '0887': { region: '高知県', isKinki: false },
      '0887': { region: '高知県', isKinki: false },
      '0887': { region: '高知県', isKinki: false },
      '0887': { region: '高知県', isKinki: false },
      '0889': { region: '高知県', isKinki: false },
      '0889': { region: '高知県', isKinki: false },
      '0892': { region: '愛媛県', isKinki: false },
      '0893': { region: '愛媛県', isKinki: false },
      '0894': { region: '愛媛県', isKinki: false },
      '0894': { region: '愛媛県', isKinki: false },
      '0895': { region: '愛媛県', isKinki: false },
      '0895': { region: '愛媛県', isKinki: false },
      '0896': { region: '愛媛県・香川県', isKinki: false },
      '0897': { region: '愛媛県', isKinki: false },
      '0897': { region: '愛媛県', isKinki: false },
      '0898': { region: '愛媛県', isKinki: false },
      '0920': { region: '長崎県', isKinki: false },
      '0920': { region: '長崎県', isKinki: false },
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
    };
    if (fourDigitAreaCodesDigitAreaCodes[areaCode]) {
      const info = fourDigitAreaCodesDigitAreaCodes[areaCode];
      return { region: info.region, digits: 4, isKinki: info.isKinki };
    }

    return { region: '4桁市外局番地域', digits: 4, isKinki: false };
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

function identifyFixedPhoneRegionUsingJson(digits) {
  // JSON を使った市外局番判定（優先）
  // 携帯を除外
  if (digits.length === 11 && '6789'.includes(digits[1]) && digits[2] === '0') {
    return null;
  }
  var codes = window.PHONE_AREA_CODES || {};
  for (var len = 5; len >= 2; len--) {
    if (digits.length >= len) {
      var code = digits.substring(0, len);
      if (codes[code]) {
        var info = codes[code];
        return { region: info.region, digits: len, isKinki: !!info.isKinki };
      }
    }
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
