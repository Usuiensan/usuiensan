/**
 * 修正版：医療費領収証明書 - PDF フィールドマッピング
 * 単位: ポイント (pt) / 原点: 左上 (0,0)
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
      { value: '1', label: '自宅', x: 320, y: 384, radius: 4 },
      { value: '2', label: '自宅外', x: 320, y: 399, radius: 4 },
      { value: '3', label: '大学寮', x: 320, y: 414, radius: 4 },
    ],
  },
  diseaseName: {
    type: 'text',
    x: 383,
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
      { value: '正課中', x: 86, y: 454 },
      { value: '大学行事中', x: 86, y: 468.2 },
      { value: '学校施設内', x: 86, y: 482.4 },
      { value: '課外活動中', x: 86, y: 496.6 },
      { value: '交通事故', x: 86, y: 510.7 },
      { value: 'その他', x: 86, y: 524.9 },
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
      { value: '有り', x: 229, y: 507, radius: 4 },
      { value: '無し', x: 268, y: 507, radius: 4 },
    ],
  },

  // ===== 2.5 けがの場所 =====
  injuryLocation: {
    type: 'text',
    x: 215,
    y: 580,
    maxWidth: 280,
    fontSize: 12,
    fontName: 'font',
  },

  // ===== 2.6 原因 =====
  injuryCause: {
    type: 'text',
    x: 215,
    y: 600,
    maxWidth: 280,
    fontSize: 12,
    fontName: 'font',
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

  // ===== 3.1 銀行コード（4桁） =====
  bankCode: {
    type: 'digit_boxes',
    digits: 4,
    positions: [
      { digit: 1, x: 340, y: 718 },
      { digit: 2, x: 360, y: 718 },
      { digit: 3, x: 380, y: 718 },
      { digit: 4, x: 400, y: 718 },
    ],
    fontSize: 13,
    fontName: 'font',
  },

  // ===== 3.2 支店コード（3桁） =====
  branchCode: {
    type: 'digit_boxes',
    digits: 3,
    positions: [
      { digit: 1, x: 430, y: 718 },
      { digit: 2, x: 450, y: 718 },
      { digit: 3, x: 470, y: 718 },
    ],
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
