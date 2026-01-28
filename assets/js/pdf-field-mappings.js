/**
 * 医療費領収証明書 - PDF フィールドマッピング定義
 * テンプレート上の各フィールドの座標とフォーマット情報を定義
 *
 * ===== 座標系について =====
 * 単位: ポイント (pt) ※ A4 = 595.28×841.89pt
 * 原点: 左下 (0,0)
 * X軸: 左から右へ増加（0 = 左端、595.28 = 右端）
 * Y軸: 下から上へ増加（0 = 下端、841.89 = 上端）
 *
 * ===== 座標基準点（要素ごと）=====
 * テキスト（drawText）: 文字列の「左下」が基準点
 *   例）x:100, y:700 → 文字の左端x=100、下端y=700から上へ伸びる
 *
 * 円/矩形（drawCircle, drawRectangle）: 「中心」が基準点
 *   例）x:85, y:640, radius:5 → 中心が(85, 640)で半径5の円
 *
 * チェックマーク/記号（drawText）: 文字列の「左下」が基準点
 *   例）x:90, y:595 → ✓ の左下が(90, 595)
 */

/**
 * 修正版：医療費領収証明書 - PDF フィールドマッピング
 * 座標系: 左上原点 (0,0), Y軸は下方向へ増加
 * 単位: ポイント (pt)
 */

const PDF_FIELD_MAPPINGS = {
  // ===== 1. 本人情報セクション (y=340-430付近) =====

  faculty: {
    // 学部・研究科
    type: 'text',
    x: 55,
    y: 372,
    maxWidth: 80,
    fontSize: 11,
    fontName: 'font',
  },
  grade: {
    // 年次
    type: 'text',
    x: 142,
    y: 372,
    maxWidth: 20,
    fontSize: 11,
    fontName: 'font',
  },
  studentNumber: {
    // 学生証番号 (6桁)
    type: 'digit_boxes',
    digits: 6,
    positions: [
      { digit: 1, x: 198, y: 372 },
      { digit: 2, x: 220, y: 372 },
      { digit: 3, x: 242, y: 372 },
      { digit: 4, x: 264, y: 372 },
      { digit: 5, x: 286, y: 372 },
      { digit: 6, x: 308, y: 372 },
    ],
    fontSize: 12,
    fontName: 'font',
  },
  studentNameKana: {
    // フリガナ
    type: 'text',
    x: 355,
    y: 348,
    maxWidth: 125,
    fontSize: 9,
    fontName: 'font',
  },
  studentName: {
    // 氏名
    type: 'text',
    x: 355,
    y: 372,
    maxWidth: 125,
    fontSize: 12,
    fontName: 'font',
  },

  // 2行目：電話・住所区分
  mobilePhone: {
    type: 'phone_parts',
    parts: [
      { part: 'area', x: 105, y: 396 },
      { part: 'exchange', x: 160, y: 396 },
      { part: 'subscriber', x: 215, y: 396 },
    ],
    fontSize: 11,
    fontName: 'font',
  },
  addressType: {
    // 自宅・自宅外・大学寮 (垂直に並ぶラジオボタン)
    type: 'radio_circle',
    options: [
      { value: '1', label: '自宅', x: 312, y: 384, radius: 5 },
      { value: '2', label: '自宅外', x: 312, y: 399, radius: 5 },
      { value: '3', label: '大学寮', x: 312, y: 414, radius: 5 },
    ],
  },
  diseaseName: {
    // 傷病名
    type: 'text',
    x: 375,
    y: 415,
    maxWidth: 150,
    fontSize: 11,
    fontName: 'font',
  },

  // ===== 2. 受傷状況セクション (y=440-540付近) =====

  injuryDate: {
    // 負傷日
    type: 'date_parts',
    parts: [
      { part: 'year', x: 420, y: 442 },
      { part: 'month', x: 475, y: 442 },
      { part: 'day', x: 505, y: 442 },
    ],
    fontSize: 11,
    fontName: 'font',
  },
  injuryContext: {
    // チェックボックス (垂直)
    type: 'checkbox_mark',
    options: [
      { value: '正課中', x: 86, y: 457 },
      { value: '大学行事中', x: 86, y: 471 },
      { value: '学校施設内', x: 86, y: 485 },
      { value: '課外活動中', x: 86, y: 499 },
      { value: '交通事故', x: 86, y: 513 },
      { value: 'その他', x: 86, y: 527 },
    ],
  },
  // 場所・原因は選択された行のY座標に合わせて描画する想定
  injuryLocationX: 215,
  injuryCauseX: 330,

  // ===== 3. 金融機関振込先セクション (y=660-760付近) =====

  bankTransferType: {
    // 前回・新規・変更 (水平に並ぶ)
    type: 'radio_circle',
    options: [
      { value: 'previous', x: 135, y: 665, radius: 6 },
      { value: 'new', x: 218, y: 665, radius: 6 },
      { value: 'change', x: 255, y: 665, radius: 6 },
    ],
  },
  bankName: { x: 130, y: 715 },
  branchName: { x: 240, y: 715 },
  accountName: { x: 130, y: 748 },
  accountNumber: {
    // 口座番号 (右詰め7桁)
    type: 'digit_boxes',
    digits: 7,
    positions: [
      { digit: 1, x: 364, y: 748 },
      { digit: 2, x: 386, y: 748 },
      { digit: 3, x: 408, y: 748 },
      { digit: 4, x: 430, y: 748 },
      { digit: 5, x: 452, y: 748 },
      { digit: 6, x: 474, y: 748 },
      { digit: 7, x: 496, y: 748 },
    ],
  },
};

/**
 * フォーム値をPDF用にフォーマットするユーティリティ関数
 */
const PDF_VALUE_FORMATTERS = {
  /**
   * 携帯電話をハイフン区切りで3部分に分割
   * @param {string} phoneNumber - 例: "09012345678"
   * @returns {object} { area: "090", exchange: "1234", subscriber: "5678" }
   */
  formatMobilePhone: (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length !== 11) return null;
    return {
      area: phoneNumber.substring(0, 3), // 090
      exchange: phoneNumber.substring(3, 7), // 1234
      subscriber: phoneNumber.substring(7, 11), // 5678
    };
  },

  /**
   * 固定電話をハイフン区切りで3部分に分割
   * formatFixedPhone() の出力形式（既に市外局番判定済みハイフン付き）から抽出
   * @param {string} phoneNumber - 例: "06-1234-5678" や "075-123-4567"
   * @returns {object} { area: "06", exchange: "1234", subscriber: "5678" } 等
   */
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

  /**
   * 日付を年・月・日に分割
   * @param {string} dateString - ISO形式 "YYYY-MM-DD"
   * @returns {object} { year: "2026", month: "01", day: "28" }
   */
  formatDate: (dateString) => {
    if (!dateString || dateString.length < 10) return null;
    return {
      year: dateString.substring(0, 4),
      month: dateString.substring(5, 7),
      day: dateString.substring(8, 10),
    };
  },

  /**
   * 学生証番号を6桁の配列に分割
   * @param {string} studentNumber - 例: "123456"
   * @returns {array} ["1", "2", "3", "4", "5", "6"]
   */
  formatStudentNumber: (studentNumber) => {
    if (!studentNumber || studentNumber.length !== 6) return null;
    return studentNumber.split('');
  },

  /**
   * 口座番号を7桁の配列に分割（右づめ）
   * @param {string} accountNumber - 例: "1234567" または "123456"
   * @returns {array} 7要素の配列（左側に空き）
   */
  formatAccountNumber: (accountNumber) => {
    if (!accountNumber || accountNumber.length > 7) return null;
    const digits = accountNumber.split('');
    // 右づめにするため、左側に空の要素を埋める
    while (digits.length < 7) {
      digits.unshift('');
    }
    return digits;
  },

  /**
   * ラジオボタン選択値を取得（○を描画する位置を特定）
   * @param {string} selectedValue - 選択値（例: "1" or "自宅"）
   * @param {array} options - オプション配列
   * @returns {object} 選択されたオプション情報
   */
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
