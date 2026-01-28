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

const PDF_FIELD_MAPPINGS = {
  // ===== 学部・研究科 =====
  // 基準点: テキスト左下
  faculty: {
    type: 'text',
    x: 60.8, // テキスト左下のx座標
    y: 367, // テキスト左下のy座標
    maxWidth: 100,
    fontSize: 11,
    fontName: 'font',
  },

  // ===== 年次 =====
  // 基準点: テキスト左下
  grade: {
    type: 'text',
    x: 19, // テキスト左下のx座標
    y: 367, // テキスト左下のy座標
    maxWidth: 24,
    fontSize: 11,
    fontName: 'font',
  },

  // ===== 氏名 =====
  // 基準点: テキスト左下
  studentName: {
    type: 'text',
    x: 380, // テキスト左下のx座標
    y: 367, // テキスト左下のy座標
    maxWidth: 125,
    fontSize: 11,
    fontName: 'font',
  },

  // ===== フリガナ =====
  // 基準点: テキスト左下
  studentNameKana: {
    type: 'text',
    x: 380, // テキスト左下のx座標
    y: 343, // テキスト左下のy座標
    maxWidth: 125,
    fontSize: 11,
    fontName: 'font',
  },

  // ===== 学生証番号 =====
  // 6桁を1マス1桁で記入 (左から順)
  // 基準点: テキスト左下
  studentNumber: {
    type: 'digit_boxes',
    digits: 6,
    positions: [
      { digit: 1, x: 195, y: 367 }, // 1番目の文字の左下が (125, 81.89)
      { digit: 2, x: 147, y: 367 }, // 2番目
      { digit: 3, x: 169, y: 367 },
      { digit: 4, x: 191, y: 367 },
      { digit: 5, x: 213, y: 367 },
      { digit: 6, x: 235, y: 367 },
    ],
    fontSize: 12,
    fontName: 'font', // 日本語フォント
  },

  // ===== 携帯電話 =====
  // ハイフン区切りで3部分（090-1234-5678）
  // 基準点: テキスト左下
  mobilePhone: {
    type: 'phone_parts',
    parts: [
      { part: 'area', x: 113, y: 392, maxWidth: 30 }, // 090 の左下が (70, 680)
      { part: 'exchange', x: 170, y: 392, maxWidth: 40 }, // 1234 の左下が (110, 680)
      { part: 'subscriber', x: 225, y: 392, maxWidth: 50 }, // 5678 の左下が (160, 680)
    ],
    fontSize: 11,
    fontName: 'font',
  },

  // ===== 固定電話 =====
  // ハイフン区切りで3部分（例: 06-1234-5678 or 075-123-4567）
  // 基準点: テキスト左下
  fixedPhone: {
    type: 'phone_parts',
    parts: [
      { part: 'area', x: 113, y: 414, maxWidth: 35 }, // 市外局番の左下が (70, 665)
      { part: 'exchange', x: 170, y: 414, maxWidth: 40 }, // 市内局番の左下が (120, 665)
      { part: 'subscriber', x: 225, y: 414, maxWidth: 45 }, // 加入者番号の左下が (175, 665)
    ],
    fontSize: 11,
    fontName: 'font',
  },

  // ===== 住所区分 =====
  // ラジオボタン: ① 自宅 / ② 自宅外 / ③ 大学寮
  // 基準点: 円の「中心」が基準座標
  addressType: {
    type: 'radio_circle',
    options: [
      { value: '1', label: '① 自宅', x: 320, y: 384, radius: 5 }, // 円の中心が (85, 640)、半径 5pt
      { value: '2', label: '② 自宅外', x: 320, y: 399, radius: 5 },
      { value: '3', label: '③ 大学寮', x: 320, y: 413, radius: 5 },
    ],
    circleColor: { r: 0, g: 0, b: 0 }, // 黒い圏線
    circleWidth: 1.5,
  },

  // ===== 傷病名 =====
  // 基準点: テキスト左下
  diseaseName: {
    type: 'text',
    x: 380, // テキスト左下のx座標
    y: 420, // テキスト左下のy座標
    maxWidth: 400,
    fontSize: 11,
    fontName: 'font',
  },

  // ===== 負傷状況 =====
  // チェックボックス: 正課中 / 大学行事中 / 学校施設内 / 課外活動中 / 交通事故 / その他
  // 基準点: チェックマーク（✓）テキスト左下
  injuryContext: {
    type: 'checkbox_mark',
    options: [
      { value: '正課中', label: '正課中', x: 86, y: 453.6 }, // ✓の左下が (90, 595)
      { value: '大学行事中', label: '大学行事中', x: 86, y: 468.2 },
      { value: '学校施設内', label: '学校施設内', x: 280, y: 482.4 },
      { value: '課外活動中', label: '課外活動中', x: 385, y: 496.8 },
      { value: '交通事故', label: '交通事故', x: 480, y: 510.6 },
      { value: 'その他', label: 'その他', x: 540, y: 524.9 },
    ],
    markType: 'checkmark', // ✓ マーク
    markColor: { r: 0, g: 0, b: 0 },
  },

  // ===== 科目名（正課中の場合） =====
  subjectName: {
    type: 'text',
    x: 100,
    y: 453.6,
    maxWidth: 300,
    fontSize: 11,
    fontName: 'font',
    conditional: 'injuryContext === "正課中"',
  },

  // ===== 行事名（大学行事中の場合） =====
  eventName: {
    type: 'text',
    x: 100,
    y: 468.2,
    maxWidth: 300,
    fontSize: 11,
    fontName: 'font',
    conditional: 'injuryContext === "大学行事中"',
  },

  // ===== 団体名（課外活動中の場合） =====
  clubName: {
    type: 'text',
    x: 100,
    y: 496.8,
    maxWidth: 300,
    fontSize: 11,
    fontName: 'font',
    conditional: 'injuryContext === "課外活動中"',
  },

  // ===== けがの場所 =====
  // 各受傷状況の行に対応する場所フィールド
  injuryLocation: {
    type: 'text',
    options: [
      { condition: '正課中', x: 210, y: 453.6 },
      { condition: '大学行事中', x: 210, y: 468.2 },
      { condition: '学校施設内', x: 210, y: 482.4 },
      { condition: '課外活動中', x: 210, y: 496.8 },
      { condition: '交通事故', x: 210, y: 510.6 },
      { condition: 'その他', x: 210, y: 524.9 },
    ],
    maxWidth: 150,
    fontSize: 11,
    fontName: 'font',
  },

  // ===== 原因 =====
  // 各受傷状況の行に対応する原因フィールド
  injuryCause: {
    type: 'text',
    options: [
      { condition: '正課中', x: 330, y: 453.6 },
      { condition: '大学行事中', x: 330, y: 468.2 },
      { condition: '学校施設内', x: 330, y: 482.4 },
      { condition: '課外活動中', x: 330, y: 496.8 },
      { condition: '交通事故', x: 330, y: 510.6 },
      { condition: 'その他', x: 330, y: 524.9 },
    ],
    maxWidth: 150,
    fontSize: 11,
    fontName: 'font',
  },

  // ===== 負傷日 =====
  // 年・月・日を分割記入
  // 基準点: テキスト左下
  injuryDate: {
    type: 'date_parts',
    parts: [
      { part: 'year', x: 100, y: 525, width: 30, digits: 4 }, // 年 (左下が x:100)
      { part: 'month', x: 145, y: 525, width: 25, digits: 2 }, // 月
      { part: 'day', x: 185, y: 525, width: 25, digits: 2 }, // 日
    ],
    fontSize: 11,
    fontName: 'font',
  },

  // ===== 交通事故相手有無（交通事故の場合） =====
  // ラジオボタン（○で囲む）: 有り / 無し
  // 基準点: 円の「中心」
  accidentParty: {
    type: 'radio_circle',
    options: [
      { value: '有り', label: '有り', x: 90, y: 510, radius: 5 }, // 円の中心が (90, 510)
      { value: '無し', label: '無し', x: 170, y: 510, radius: 5 }, // 円の中心が (170, 510)
    ],
    circleColor: { r: 0, g: 0, b: 0 },
    circleWidth: 1.5,
    conditional: 'injuryContext === "交通事故"',
  },

  // ===== 金融機関振込先 =====
  // ラジオボタン: 前回と同じ / 新規 / 変更
  // 基準点: 円の「中心」
  bankTransferType: {
    type: 'radio_circle',
    options: [
      { value: 'previous', label: '前回と同じ', x: 85, y: 480, radius: 5 }, // 円の中心が (85, 480)
      { value: 'new', label: '新規', x: 200, y: 480, radius: 5 },
      { value: 'change', label: '変更', x: 270, y: 480, radius: 5 },
    ],
    circleColor: { r: 0, g: 0, b: 0 },
    circleWidth: 1.5,
  },

  // ===== 銀行名 =====
  // 基準点: テキスト左下
  bankName: {
    type: 'text',
    x: 100, // テキスト左下のx座標
    y: 455, // テキスト左下のy座標
    maxWidth: 300,
    fontSize: 11,
    fontName: 'font',
    conditional: 'bankTransferType !== "previous"',
  },

  // ===== 支店名 =====
  // 基準点: テキスト左下
  branchName: {
    type: 'text',
    x: 100,
    y: 440,
    maxWidth: 300,
    fontSize: 11,
    fontName: 'font',
    conditional: 'bankTransferType !== "previous"',
  },

  // ===== 銀行コード =====
  bankCode: {
    type: 'text',
    x: 100,
    y: 425,
    maxWidth: 50,
    fontSize: 11,
    fontName: 'font',
    conditional: 'bankTransferType !== "previous"',
  },

  // ===== 支店コード =====
  branchCode: {
    type: 'text',
    x: 170,
    y: 425,
    maxWidth: 50,
    fontSize: 11,
    fontName: 'font',
    conditional: 'bankTransferType !== "previous"',
  },

  // ===== カタカナ口座名義 =====
  accountName: {
    type: 'text',
    x: 100,
    y: 410,
    maxWidth: 250,
    fontSize: 11,
    fontName: 'font',
    conditional: 'bankTransferType !== "previous"',
  },

  // ===== 口座番号 =====
  // 最大7桁を1マス1桁で記入（右づめ）
  // 基準点: 数字の「左下」
  accountNumber: {
    type: 'digit_boxes',
    digits: 7,
    positions: [
      { digit: 1, x: 310, y: 395 }, // 1番目の数字の左下が (310, 395)
      { digit: 2, x: 332, y: 395 }, // 2番目
      { digit: 3, x: 354, y: 395 }, // 3番目
      { digit: 4, x: 376, y: 395 }, // 4番目
      { digit: 5, x: 398, y: 395 }, // 5番目
      { digit: 6, x: 420, y: 395 }, // 6番目
      { digit: 7, x: 442, y: 395 }, // 7番目
    ],
    fontSize: 12,
    fontName: 'font',
  },

  // ===== 受付番号 =====
  // 複数対応（最大4個を左から並べる）
  // 基準点: テキスト左下（baseX, baseY から spacing間隔で左右に配置）
  receiptNumbers: {
    type: 'receipt_list',
    maxItems: 4,
    baseX: 100, // 最初の受付番号の左下 x座標
    baseY: 370, // すべての受付番号の左下 y座標（共通）
    spacing: 80, // 各受付番号の間隔（pt）
    fontSize: 11,
    fontName: 'font',
  },

  // ===== A4用紙のレイアウト定義 =====
  pageInfo: {
    width: 595.28, // A4 横幅 (pt)
    height: 841.89, // A4 縦幅 (pt)
    margin: {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20,
    },
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
