/**
 * 修正版：医療費領収証明書 - PDF フィールドマッピング
 * 単位: ポイント (pt) / 原点: 左上 (0,0)
 */

const PDF_FIELD_MAPPINGS = {
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
    x: 170,
    y: 374,
    maxWidth: 24.5,
    fontSize: 13,
    fontName: 'font',
  },
  studentNumber: {
    type: 'digit_boxes',
    digits: 6,
    positions: [
      { digit: 1, x: 200, y: 374 },
      { digit: 2, x: 223, y: 374 },
      { digit: 3, x: 246, y: 374 },
      { digit: 4, x: 269, y: 374 },
      { digit: 5, x: 292, y: 374 },
      { digit: 6, x: 315, y: 374 },
    ],
    fontSize: 14,
    fontName: 'font',
  },
  studentNameKana: {
    type: 'text',
    x: 383,
    y: 340,
    maxWidth: 125,
    fontSize: 10,
    fontName: 'font',
  },
  studentName: {
    type: 'text',
    x: 360,
    y: 378,
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
  addressType: {
    type: 'radio_circle',
    options: [
      { value: '1', label: '自宅', x: 312, y: 388, radius: 6 },
      { value: '2', label: '自宅外', x: 312, y: 403, radius: 6 },
      { value: '3', label: '大学寮', x: 312, y: 418, radius: 6 },
    ],
  },
  diseaseName: {
    type: 'text',
    x: 375,
    y: 420,
    maxWidth: 160,
    fontSize: 13,
    fontName: 'font',
  },

  // ===== 2. 受傷状況セクション =====
  // 【重要修正】「年」「月」の文字と重ならないよう、全体的に右へずらす
  injuryDate: {
    type: 'date_parts',
    parts: [
      { part: 'year', x: 428, y: 445 }, // 415 -> 428 (「年」の右側へ)
      { part: 'month', x: 482, y: 445 }, // 475 -> 482
      { part: 'day', x: 512, y: 445 }, // 508 -> 512
    ],
    fontSize: 13,
    fontName: 'font', // 12->13pt サイズアップ
  },
  injuryContext: {
    type: 'checkbox_mark',
    options: [
      { value: '正課中', x: 86, y: 462 },
      { value: '大学行事中', x: 86, y: 480 },
      { value: '学校施設内', x: 86, y: 498 },
      { value: '課外活動中', x: 86, y: 516 },
      { value: '交通事故', x: 86, y: 534 },
      { value: 'その他', x: 86, y: 552 },
    ],
  },
  injuryLocationX: 215,
  injuryCauseX: 330,

  // ===== 3. 金融機関振込先セクション =====
  bankTransferType: {
    type: 'radio_circle',
    options: [
      { value: 'previous', x: 135, y: 668, radius: 7 },
      { value: 'new', x: 218, y: 668, radius: 7 },
      { value: 'change', x: 255, y: 668, radius: 7 },
    ],
  },
  // フォントサイズを12->13ptへアップ
  bankName: {
    type: 'text',
    x: 130,
    y: 718,
    maxWidth: 100,
    fontSize: 13,
    fontName: 'font',
  },
  branchName: {
    type: 'text',
    x: 245,
    y: 718,
    maxWidth: 80,
    fontSize: 13,
    fontName: 'font',
  },
  accountName: {
    type: 'text',
    x: 130,
    y: 751,
    maxWidth: 200,
    fontSize: 13,
    fontName: 'font',
  },
  accountNumber: {
    type: 'digit_boxes',
    digits: 7,
    positions: [
      { digit: 1, x: 364, y: 751 },
      { digit: 2, x: 386, y: 751 },
      { digit: 3, x: 408, y: 751 },
      { digit: 4, x: 430, y: 751 },
      { digit: 5, x: 452, y: 751 },
      { digit: 6, x: 474, y: 751 },
      { digit: 7, x: 496, y: 751 },
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
