/**
 * 医療費領収証明書 - PDF フィールドマッピング定義
 * テンプレート上の各フィールドの座標とフォーマット情報を定義
 */

const PDF_FIELD_MAPPINGS = {
  // ===== 1. 本人情報セクション (1段目) =====
  faculty: {
    type: 'text',
    x: 48,
    y: 367,
    maxWidth: 80,
    fontSize: 11,
    fontName: 'font',
  },
  grade: {
    type: 'text',
    x: 140,
    y: 367,
    maxWidth: 20,
    fontSize: 11,
    fontName: 'font',
  },
  studentNumber: {
    type: 'digit_boxes',
    digits: 6,
    positions: [
      { digit: 1, x: 180, y: 367 },
      { digit: 2, x: 207, y: 367 },
      { digit: 3, x: 234, y: 367 },
      { digit: 4, x: 261, y: 367 },
      { digit: 5, x: 288, y: 367 },
      { digit: 6, x: 315, y: 367 },
    ],
    fontSize: 12,
    fontName: 'font',
  },
  studentNameKana: {
    type: 'text',
    x: 375,
    y: 347,
    maxWidth: 125,
    fontSize: 9,
    fontName: 'font',
  },
  studentName: {
    type: 'text',
    x: 375,
    y: 367,
    maxWidth: 125,
    fontSize: 12,
    fontName: 'font',
  },

  // ===== 1. 本人情報セクション (2段目) =====
  mobilePhone: {
    type: 'phone_parts',
    parts: [
      { part: 'area', x: 105, y: 413 },
      { part: 'exchange', x: 155, y: 413 },
      { part: 'subscriber', x: 205, y: 413 },
    ],
    fontSize: 11,
    fontName: 'font',
  },
  addressType: {
    type: 'radio_circle',
    options: [
      { value: '1', label: '自宅', x: 312, y: 386, radius: 5 },
      { value: '2', label: '自宅外', x: 312, y: 401, radius: 5 },
      { value: '3', label: '大学寮', x: 312, y: 416, radius: 5 },
    ],
  },
  diseaseName: {
    type: 'text',
    x: 375,
    y: 413,
    maxWidth: 160,
    fontSize: 11,
    fontName: 'font',
  },

  // ===== 2. 受傷状況セクション =====
  injuryDate: {
    type: 'date_parts',
    parts: [
      { part: 'year', x: 400, y: 442 },
      { part: 'month', x: 462, y: 442 },
      { part: 'day', x: 495, y: 442 },
    ],
    fontSize: 10,
    fontName: 'font',
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
      { value: 'previous', x: 135, y: 610, radius: 6 },
      { value: 'new', x: 218, y: 610, radius: 6 },
      { value: 'change', x: 255, y: 610, radius: 6 },
    ],
  },
  bankName: { x: 130, y: 655, type: 'text', maxWidth: 100 },
  branchName: { x: 250, y: 655, type: 'text', maxWidth: 80 },
  accountName: { x: 130, y: 745, type: 'text', maxWidth: 200 },
  accountNumber: {
    type: 'digit_boxes',
    digits: 7,
    positions: [
      { digit: 1, x: 353, y: 745 },
      { digit: 2, x: 380, y: 745 },
      { digit: 3, x: 407, y: 745 },
      { digit: 4, x: 434, y: 745 },
      { digit: 5, x: 461, y: 745 },
      { digit: 6, x: 488, y: 745 },
      { digit: 7, x: 515, y: 745 },
    ],
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
