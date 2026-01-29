/**
 * 医療費領収証明書 - PDF フィールドマッピング
 *
 * ===== 座標系の定義 =====
 * マッピングで指定する座標は「デザイン座標系」（左上が原点）で記述
 * 内部的には PDF ネイティブ座標系（左下が原点）に変換される
 *
 * デザイン座標系: 原点は左上 (0,0)、Y軸は上から下へ
 * PDF座標系:      原点は左下 (0,0)、Y軸は下から上へ
 *
 * 変換式: yPDF = pageHeight - yDesign
 *
 * 例）A4ページ高さ 841.89pt の場合：
 *   デザインY=100 → PDFY = 841.89 - 100 = 741.89
 *   デザインY=800 → PDFY = 841.89 - 800 = 41.89
 *
 * ===== チェックマーク・丸印の座標 =====
 * radio_circle (丸印)  : options[].x, options[].y で指定 → drawCircle()
 * checkbox_mark (✓)    : options[].x, options[].y で指定 → drawText('✓')
 *
 * 単位: ポイント (pt)
 */

const PDF_FIELD_MAPPINGS = {
  // ===== 0. 受付番号 =====
  receiptNumber: {
    type: 'text',
    x: 510,
    y: 374,
    maxWidth: 50,
    fontSize: 13,
    fontName: 'font',
    // 最初の受付番号のみ表示（複数の場合は最初の1つ）
    useFirstOnly: true,
  },

  // ===== 1. 本人情報セクション =====

  faculty: {
    type: 'text',
    x: 64,
    y: 374,
    maxWidth: 100,
    fontSize: 13,
    fontName: 'font',
  },
  grade: {
    type: 'text',
    x: 176,
    y: 374,
    maxWidth: 24.5,
    fontSize: 13,
    fontName: 'font',
  },
  studentNumber: {
    type: 'digit_boxes',
    digits: 6,
    positions: [
      { digit: 1, x: 202, y: 374 },
      { digit: 2, x: 225, y: 374 },
      { digit: 3, x: 248, y: 374 },
      { digit: 4, x: 271, y: 374 },
      { digit: 5, x: 294, y: 374 },
      { digit: 6, x: 317, y: 374 },
    ],
    fontSize: 14,
    fontName: 'font',
  },
  studentNameKana: {
    type: 'text',
    x: 383,
    y: 344,
    maxWidth: 125,
    fontSize: 10,
    fontName: 'font',
  },
  studentName: {
    type: 'text',
    x: 383,
    y: 374,
    maxWidth: 125,
    fontSize: 15,
    fontName: 'font', // 14->15pt さらに大きく
  },

  // ===== 1. 本人情報セクション (2段目) =====
  mobilePhone: {
    type: 'phone_parts',
    parts: [
      { part: 'area', x: 110, y: 420 },
      { part: 'exchange', x: 160, y: 420 },
      { part: 'subscriber', x: 210, y: 420 },
    ],
    fontSize: 13,
    fontName: 'font',
  },
  fixedPhone: {
    type: 'phone_parts',
    parts: [
      { part: 'area', x: 290, y: 420 },
      { part: 'exchange', x: 340, y: 420 },
      { part: 'subscriber', x: 390, y: 420 },
    ],
    fontSize: 13,
    fontName: 'font',
  },
  addressType: {
    type: 'radio_circle',
    options: [
      { value: '1', label: '自宅', x: 350, y: 384, radius: 1 },
      { value: '2', label: '自宅外', x: 350, y: 399, radius: 1 },
      { value: '3', label: '大学寮', x: 350, y: 414, radius: 1 },
    ],
  },
  diseaseName: {
    type: 'text',
    x: 383,
    y: 418,
    maxWidth: 160,
    fontSize: 13,
    fontName: 'font',
  },

  // ===== 2. 受傷状況セクション =====
  // 【重要修正】「年」「月」の文字と重ならないよう、全体的に右へずらす
  injuryDate: {
    type: 'date_parts',
    parts: [
      { part: 'year', x: 361, y: 438 }, // 415 -> 428 (「年」の右側へ)
      { part: 'month', x: 428, y: 438 }, // 475 -> 482
      { part: 'day', x: 465, y: 438 }, // 508 -> 512
    ],
    fontSize: 13,
    fontName: 'font', // 12->13pt サイズアップ
  },
  injuryContext: {
    type: 'checkbox_mark',
    options: [
      { value: '正課中', x: 86, y: 447 },
      { value: '大学行事中', x: 86, y: 462 },
      { value: '学校施設内', x: 86, y: 476 },
      { value: '課外活動中', x: 86, y: 491 },
      { value: '交通事故', x: 86, y: 505 },
      { value: 'その他', x: 86, y: 519 },
    ],
  },

  // ===== 2.1 正課中 - 科目名 =====
  subjectName: {
    type: 'text',
    x: 215,
    y: 454,
    maxWidth: 200,
    fontSize: 12,
    fontName: 'font',
  },

  // ===== 2.2 大学行事中 - 行事名 =====
  eventName: {
    type: 'text',
    x: 215,
    y: 468.2,
    maxWidth: 200,
    fontSize: 12,
    fontName: 'font',
  },

  // ===== 2.3 課外活動中 - 団体名 =====
  clubName: {
    type: 'text',
    x: 215,
    y: 496.6,
    maxWidth: 200,
    fontSize: 12,
    fontName: 'font',
  },

  // ===== 2.4 交通事故 - 相手の有無 =====
  accidentParty: {
    type: 'radio_circle',
    options: [
      { value: '有り', x: 229, y: 507, radius: 2 },
      { value: '無し', x: 268, y: 507, radius: 2 },
    ],
  },

  // ===== 2.5 けがの場所（受傷状況ごとに異なる座標） =====
  injuryLocation: {
    type: 'text',
    options: [
      { condition: '正課中', x: 215, y: 454, maxWidth: 280, fontSize: 12 },
      {
        condition: '大学行事中',
        x: 215,
        y: 468.2,
        maxWidth: 280,
        fontSize: 12,
      },
      {
        condition: '学校施設内',
        x: 215,
        y: 482.4,
        maxWidth: 280,
        fontSize: 12,
      },
      {
        condition: '課外活動中',
        x: 215,
        y: 496.6,
        maxWidth: 280,
        fontSize: 12,
      },
      { condition: '交通事故', x: 215, y: 510.7, maxWidth: 280, fontSize: 12 },
      { condition: 'その他', x: 215, y: 524.9, maxWidth: 280, fontSize: 12 },
    ],
    fontName: 'font',
  },

  // ===== 2.6 原因（受傷状況ごとに異なる座標） =====
  injuryCause: {
    type: 'text',
    options: [
      { condition: '正課中', x: 345, y: 454, maxWidth: 280, fontSize: 12 },
      {
        condition: '大学行事中',
        x: 345,
        y: 468.2,
        maxWidth: 280,
        fontSize: 12,
      },
      {
        condition: '学校施設内',
        x: 345,
        y: 482.4,
        maxWidth: 280,
        fontSize: 12,
      },
      {
        condition: '課外活動中',
        x: 345,
        y: 496.6,
        maxWidth: 280,
        fontSize: 12,
      },
      { condition: '交通事故', x: 345, y: 510.7, maxWidth: 280, fontSize: 12 },
      { condition: 'その他', x: 345, y: 524.9, maxWidth: 280, fontSize: 12 },
    ],
    fontName: 'font',
  },

  injuryLocationX: 345,
  injuryCauseX: 345,

  // ===== 3. 金融機関振込先セクション =====
  bankTransferType: {
    type: 'radio_circle',
    options: [
      { value: 'previous', x: 110, y: 470, radius: 7 },
      { value: 'new', x: 140, y: 470, radius: 7 },
      { value: 'change', x: 200, y: 470, radius: 7 },
    ],
  },
  // フォントサイズを12->13ptへアップ
  bankName: {
    type: 'text',
    x: 93,
    y: 585,
    maxWidth: 100,
    fontSize: 13,
    fontName: 'font',
  },
  branchName: {
    type: 'text',
    x: 277,
    y: 585,
    maxWidth: 80,
    fontSize: 13,
    fontName: 'font',
  },

  // ===== 3.1 銀行コード（4桁） =====
  bankCode: {
    type: 'text',
    x: 421,
    y: 585,
    maxWidth: 60,
    fontSize: 13,
    fontName: 'font',
  },

  // ===== 3.2 支店コード（3桁） =====
  branchCode: {
    type: 'text',
    x: 487,
    y: 585,
    maxWidth: 60,
    fontSize: 13,
    fontName: 'font',
  },

  accountName: {
    type: 'text',
    x: 171,
    y: 610,
    maxWidth: 144,
    fontSize: 13,
    fontName: 'font',
  },
  accountNumber: {
    type: 'digit_boxes',
    digits: 7,
    positions: [
      { digit: 1, x: 400, y: 609 },
      { digit: 2, x: 421.8, y: 609 },
      { digit: 3, x: 443.6, y: 609 },
      { digit: 4, x: 465.4, y: 609 },
      { digit: 5, x: 487.2, y: 609 },
      { digit: 6, x: 509, y: 609 },
      { digit: 7, x: 530.8, y: 609 },
    ],
    fontSize: 14,
    fontName: 'font',
  },
};

/**
 * フォーム値をPDF用にフォーマットするユーティリティ
 */
const PDF_VALUE_FORMATTERS = {
  formatMobilePhone: (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length !== 11) return null;
    return {
      area: phoneNumber.substring(0, 3),
      exchange: phoneNumber.substring(3, 7),
      subscriber: phoneNumber.substring(7, 11),
    };
  },
  formatFixedPhone: (phoneNumber) => {
    if (!phoneNumber) return null;
    const parts = phoneNumber.split('-');
    if (parts.length !== 3) return null;
    return {
      area: parts[0],
      exchange: parts[1],
      subscriber: parts[2],
    };
  },
  formatDate: (dateString) => {
    if (!dateString || dateString.length < 10) return null;
    return {
      year: dateString.substring(0, 4),
      month: dateString.substring(5, 7),
      day: dateString.substring(8, 10),
    };
  },
  formatStudentNumber: (studentNumber) => {
    if (!studentNumber || studentNumber.length !== 6) return null;
    return studentNumber.split('');
  },
  formatBankCode: (bankCode) => {
    if (!bankCode || bankCode.length > 4) return null;
    const digits = bankCode.split('');
    while (digits.length < 4) {
      digits.unshift('');
    }
    return digits;
  },
  formatBranchCode: (branchCode) => {
    if (!branchCode || branchCode.length > 3) return null;
    const digits = branchCode.split('');
    while (digits.length < 3) {
      digits.unshift('');
    }
    return digits;
  },
  formatAccountNumber: (accountNumber) => {
    if (!accountNumber || accountNumber.length > 7) return null;
    const digits = accountNumber.split('');
    while (digits.length < 7) {
      digits.unshift('');
    }
    return digits;
  },
  getSelectedOption: (selectedValue, options) => {
    if (!selectedValue || !options) return null;
    return options.find((opt) => opt.value === selectedValue);
  },
};

// グローバルに公開
if (typeof window !== 'undefined') {
  window.PDF_FIELD_MAPPINGS = PDF_FIELD_MAPPINGS;
  window.PDF_VALUE_FORMATTERS = PDF_VALUE_FORMATTERS;
}
