/**
 * 医療費領収証明書作成ツール - PDF生成スクリプト
 * PDF-LIB を使用して背景画像に文字・○・✓を描画
 */

// PDF-LIB のインポート
const { PDFDocument, rgb, StandardFonts } = PDFLib;

// fontkit のグローバル参照（fontkit.umd.min.js が提供）
const fontkit = window.fontkit;

// フォーム要素の取得
const form = document.getElementById('medicalForm');
const generateBtn = document.getElementById('generateBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const clearBtn = document.getElementById('clearBtn');
const addReceiptBtn = document.getElementById('addReceiptBtn');
const receiptNumbersContainer = document.getElementById(
  'receiptNumbersContainer',
);
const isInjuryCheckbox = document.getElementById('isInjury');
const injurySection = document.getElementById('injurySection');
const bankTransferRadios = document.querySelectorAll(
  'input[name="bankTransferType"]',
);
const bankDetailsSection = document.getElementById('bankDetailsSection');

// LocalStorage キー
const STORAGE_KEY = 'medicalReceiptData';

// 受付番号のカウンター
let receiptNumberCount = 0;

/**
 * 初期化処理
 */
function init() {
  console.log('医療費領収証明書作成ツール 初期化開始');

  // 受付番号を1つ追加
  addReceiptNumber();

  // イベントリスナーの設定
  setupEventListeners();

  // 保存されたデータがあれば読み込み
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      loadFormDataWithoutMessage();
    } catch (error) {
      console.log('前回の入力データはありません');
    }
  }

  // 自動保存機能を有効化
  setupAutoSave();

  console.log('医療費領収証明書作成ツール 初期化完了');
}

/**
 * 受付番号を追加
 */
function addReceiptNumber() {
  receiptNumberCount++;
  const receiptId = `receipt-${receiptNumberCount}`;

  const receiptElement = document.createElement('div');
  receiptElement.className = 'receipt-number-group';
  receiptElement.id = receiptId;
  receiptElement.innerHTML = `
    <div class="form-group">
      <label for="${receiptId}-number">受付番号 ${receiptNumberCount} <span class="required">*</span></label>
      <div class="receipt-input-group">
        <input
          type="text"
          id="${receiptId}-number"
          name="receiptNumber"
          class="receipt-number"
          placeholder="例: 1234"
          maxlength="4"
        />
        ${receiptNumberCount > 1 ? `<button type="button" class="btn btn-danger btn-small" onclick="removeReceiptNumber('${receiptId}')">削除</button>` : ''}
      </div>
    </div>
  `;

  receiptNumbersContainer.appendChild(receiptElement);

  // 新しい入力要素を自動保存イベントに登録
  const input = receiptElement.querySelector(`#${receiptId}-number`);
  input.addEventListener('input', () => saveFormData(true));
  input.addEventListener('change', () => saveFormData(true));
}

/**
 * 受付番号を削除
 */
function removeReceiptNumber(receiptId) {
  const element = document.getElementById(receiptId);
  if (element) {
    element.remove();
    saveFormData(true);
  }
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
  // フォーム送信
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    generatePDF();
  });

  // ボタンイベント
  addReceiptBtn.addEventListener('click', addReceiptNumber);
  saveBtn.addEventListener('click', () => {
    saveFormData(false);
    showMessage('入力内容を保存しました', 'success');
  });
  loadBtn.addEventListener('click', () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      showMessage('保存されたデータがありません', 'error');
      return;
    }
    loadFormDataWithMessage();
    showMessage('入力内容を読み込みました', 'success');
  });
  clearBtn.addEventListener('click', () => {
    if (confirm('本当にクリアしますか？')) {
      form.reset();
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  });

  // テストボタン（開発用）
  const testPDFNormalBtn = document.getElementById('testPDFNormalBtn');
  const testPDFAccidentBtn = document.getElementById('testPDFAccidentBtn');
  const testPDFAllBtn = document.getElementById('testPDFAllBtn');
  const testConsoleBtn = document.getElementById('testConsoleBtn');

  if (testPDFNormalBtn) {
    testPDFNormalBtn.addEventListener('click', () => {
      generateTestPDF('normal');
    });
  }

  if (testPDFAccidentBtn) {
    testPDFAccidentBtn.addEventListener('click', () => {
      generateTestPDF('accident');
    });
  }

  if (testPDFAllBtn) {
    testPDFAllBtn.addEventListener('click', () => {
      generateTestPDF('all');
    });
  }

  if (testConsoleBtn) {
    testConsoleBtn.addEventListener('click', () => {
      console.log('=== テストデータ（通常パターン） ===');
      const testDataNormal = generateTestPDFData();
      console.log(testDataNormal);
      console.log('=== preparePDFData後 ===');
      console.log(preparePDFData(testDataNormal));

      console.log('\n=== テストデータ（交通事故パターン） ===');
      const testDataAccident = generateTestPDFDataAccident();
      console.log(testDataAccident);
      console.log('=== preparePDFData後 ===');
      console.log(preparePDFData(testDataAccident));

      console.log('\n=== テストデータ（全フィールド） ===');
      const testDataAll = generateTestPDFDataAll();
      console.log(testDataAll);
      console.log('=== preparePDFData後 ===');
      console.log(preparePDFData(testDataAll));
    });
  }

  // 電話番号フォーマット
  setupPhoneNumberInputs();

  // 負傷チェックボックス
  isInjuryCheckbox.addEventListener('change', (e) => {
    injurySection.style.display = e.target.checked ? 'block' : 'none';
    saveFormData(true);
  });

  // 負傷状況プルダウン
  const injuryContextSelect = document.getElementById('injuryContext');
  if (injuryContextSelect) {
    injuryContextSelect.addEventListener('change', (e) => {
      updateInjuryContextDetails(e.target.value);
      saveFormData(true);
    });
  }

  // 金融機関振込先ラジオボタン
  bankTransferRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      bankDetailsSection.style.display =
        e.target.value === 'previous' ? 'none' : 'block';
      saveFormData(true);
    });
  });

  // 学生証番号のマス入力
  setupDigitBoxes('.digit-box', '#studentNumber');

  // 口座番号のマス入力（右づめ対応）
  setupAccountNumberBoxes();
}

/**
 * 電話番号入力の設定（A-B-Cフォーマット）
 */
// 電話番号フォーマッタは phone-formatter.js で定義されています

/**
 * 負傷状況に応じた詳細情報の表示制御
 */
function updateInjuryContextDetails(context) {
  // すべての詳細セクションを非表示
  document.querySelectorAll('.injury-context-detail').forEach((el) => {
    el.style.display = 'none';
  });

  // 選択された状況に応じて表示
  const contexts = {
    正課中: 'injuryContextSubjectName',
    大学行事中: 'injuryContextEventName',
    課外活動中: 'injuryContextClubName',
    交通事故: 'injuryContextAccident',
  };

  if (contexts[context]) {
    const element = document.getElementById(contexts[context]);
    if (element) element.style.display = 'block';
  }
}

/**
 * マス入力の設定
 */
function setupDigitBoxes(boxSelector, hiddenInputSelector) {
  const boxes = document.querySelectorAll(boxSelector);
  const hiddenInput = document.querySelector(hiddenInputSelector);

  boxes.forEach((box, index) => {
    box.addEventListener('input', (e) => {
      // 数字のみに制限
      e.target.value = e.target.value.replace(/[^0-9]/g, '');

      // 次のボックスにフォーカス移動
      if (e.target.value && index < boxes.length - 1) {
        boxes[index + 1].focus();
      }

      // 隠し入力を更新
      updateDigitInput(boxes, hiddenInput);
      saveFormData(true);
    });

    box.addEventListener('keydown', (e) => {
      // バックスペースで前のボックスに移動
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        boxes[index - 1].focus();
      }
    });
  });
}

/**
 * 口座番号マス入力の設定（右づめ対応）
 */
function setupAccountNumberBoxes() {
  const boxes = document.querySelectorAll('.account-box');
  const hiddenInput = document.querySelector('#accountNumber');

  boxes.forEach((box, index) => {
    box.addEventListener('input', (e) => {
      // 数字のみに制限
      e.target.value = e.target.value.replace(/[^0-9]/g, '');

      // 次のボックスにフォーカス移動
      if (e.target.value && index < boxes.length - 1) {
        boxes[index + 1].focus();
      }

      // 隠し入力を更新（右づめ）
      updateAccountNumberInput(boxes, hiddenInput);
      saveFormData(true);
    });

    box.addEventListener('keydown', (e) => {
      // バックスペースで前のボックスに移動
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        boxes[index - 1].focus();
      }
    });
  });
}

/**
 * デジット入力を結合
 */
function updateDigitInput(boxes, hiddenInput) {
  const value = Array.from(boxes)
    .map((box) => box.value)
    .join('');
  hiddenInput.value = value;
}

/**
 * 口座番号を結合（右づめ対応）
 */
function updateAccountNumberInput(boxes, hiddenInput) {
  const values = Array.from(boxes).map((box) => box.value);
  // 空のボックスは無視して結合
  const value = values.join('');
  hiddenInput.value = value;
}

/**
 * フォームデータの収集
 */
function getFormData() {
  const data = {};

  // 基本フォーム要素の取得
  const formData = new FormData(form);

  for (let [key, value] of formData.entries()) {
    if (key === 'receiptNumber') {
      // 受付番号は配列として保存
      if (!data[key]) data[key] = [];
      if (value) data[key].push(value);
    } else if (key === 'accidentParty') {
      // ラジオボタンも処理（複数の同じ名前）
      data[key] = value;
    } else {
      data[key] = value;
    }
  }

  return data;
}

/**
 * フォームデータの保存（LocalStorage）
 */
function saveFormData(isAutoSave = false) {
  const data = getFormData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (!isAutoSave) {
    // メッセージは手動で表示
  }
}

/**
 * フォームデータの読み込み（メッセージなし）
 */
function loadFormDataWithoutMessage() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (!savedData) {
    return;
  }

  try {
    const data = JSON.parse(savedData);
    applyFormData(data);
  } catch (error) {
    console.error('データ読み込みエラー:', error);
  }
}

/**
 * フォームデータの読み込み（メッセージあり）
 */
function loadFormDataWithMessage() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (!savedData) {
    showMessage('保存されたデータがありません', 'error');
    return;
  }

  try {
    const data = JSON.parse(savedData);
    applyFormData(data);
  } catch (error) {
    console.error('データ読み込みエラー:', error);
    showMessage('データの読み込みに失敗しました', 'error');
  }
}

/**
 * フォームにデータを適用
 */
function applyFormData(data) {
  // 既存の受付番号を削除（最初の1つを残す）
  const receipts = receiptNumbersContainer.querySelectorAll(
    '.receipt-number-group',
  );
  receipts.forEach((receipt) => {
    if (receipt.id !== `receipt-1`) {
      receipt.remove();
    }
  });
  receiptNumberCount = 1;

  // 各フォーム要素に値を設定
  Object.keys(data).forEach((key) => {
    if (key === 'receiptNumber') {
      // 受付番号の処理
      const receiptNumbers = Array.isArray(data[key]) ? data[key] : [data[key]];
      receiptNumbers.forEach((num, index) => {
        if (index === 0) {
          // 最初の要素は既存のボックスに設定
          const firstInput =
            receiptNumbersContainer.querySelector('.receipt-number');
          if (firstInput) firstInput.value = num;
        } else {
          // 追加の要素は新しいボックスを作成
          addReceiptNumber();
          const inputs =
            receiptNumbersContainer.querySelectorAll('.receipt-number');
          inputs[inputs.length - 1].value = num;
        }
      });
    } else if (key === 'studentNumber') {
      // 学生証番号の処理（マス入力）
      const boxes = document.querySelectorAll('.digit-box');
      const digits = String(data[key]).split('');
      digits.forEach((digit, index) => {
        if (boxes[index]) boxes[index].value = digit;
      });
    } else if (key === 'accountNumber') {
      // 口座番号の処理（マス入力・右づめ）
      const boxes = document.querySelectorAll('.account-box');
      const digits = String(data[key]).split('');
      // 右づめに配置
      const startIndex = Math.max(0, boxes.length - digits.length);
      digits.forEach((digit, index) => {
        if (boxes[startIndex + index]) {
          boxes[startIndex + index].value = digit;
        }
      });
    } else if (key === 'mobilePhone' || key === 'fixedPhone') {
      // 電話番号の処理（既にフォーマット済みの値）
      const element = document.getElementById(key);
      if (element) {
        element.value = data[key];
      }
    } else if (key === 'injuryContext') {
      // 負傷状況の処理
      const contextSelect = document.getElementById('injuryContext');
      if (contextSelect) {
        contextSelect.value = data[key];
        updateInjuryContextDetails(data[key]);
      }
    } else {
      const element = form.elements[key];
      if (!element) return;

      if (element.type === 'checkbox') {
        // チェックボックス
        if (key === 'isInjury') {
          element.checked = data[key];
          injurySection.style.display = data[key] ? 'block' : 'none';
        }
      } else if (element[0] && element[0].type === 'radio') {
        // ラジオボタン
        const radio = form.querySelector(
          `[name="${key}"][value="${data[key]}"]`,
        );
        if (radio) {
          radio.checked = true;
          if (key === 'bankTransferType') {
            bankDetailsSection.style.display =
              data[key] === 'previous' ? 'none' : 'block';
          }
        }
      } else if (element.length) {
        // 複数の要素を持つ場合
        element[0].value = data[key];
      } else {
        // 単一の入力要素
        element.value = data[key];
      }
    }
  });
}

/**
 * メッセージ表示
 */
function showMessage(message, type = 'success') {
  // 既存のメッセージを削除
  const existingMessage = document.querySelector('.message-box');
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageBox = document.createElement('div');
  messageBox.className = `message-box ${type}-message`;
  messageBox.textContent = message;
  messageBox.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 15px 25px;
    border-radius: 8px;
    background: ${type === 'success' ? '#51cf66' : '#ff6b6b'};
    color: white;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: fadeIn 0.3s ease-out;
  `;

  document.body.appendChild(messageBox);

  setTimeout(() => {
    messageBox.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => messageBox.remove(), 300);
  }, 3000);
}

/**
 * フォームデータを PDF 書き込み用にマッピング・変換
 * getFormData() の出力を PDF_FIELD_MAPPINGS の形式に合わせる
 *
 * @param {object} formData - getFormData() の戻り値
 * @returns {object} PDF書き込み用のデータ構造
 */
function preparePDFData(formData) {
  if (!window.PDF_VALUE_FORMATTERS) {
    console.error('PDF_VALUE_FORMATTERS が読み込まれていません');
    return null;
  }

  const pdfData = {};

  // ===== 学部・研究科（テキスト） =====
  pdfData.faculty = formData.faculty || '';

  // ===== 年次（テキスト） =====
  pdfData.grade = formData.grade || '';

  // ===== 氏名（テキスト） =====
  pdfData.studentName = formData.studentName || '';

  // ===== フリガナ（テキスト） =====
  pdfData.studentNameKana = formData.studentNameKana || '';

  // ===== 学生証番号（6桁を分割） =====
  if (formData.studentNumber) {
    // テストデータは配列、フォームデータは文字列の可能性
    if (typeof formData.studentNumber === 'string') {
      // フォームデータ：文字列の場合
      pdfData.studentNumber = window.PDF_VALUE_FORMATTERS.formatStudentNumber(
        formData.studentNumber,
      );
    } else {
      // テストデータ：配列の場合
      pdfData.studentNumber = formData.studentNumber;
    }
  }

  // ===== 携帯電話（ハイフン区切り3部分） =====
  if (formData.mobilePhone) {
    // テストデータはオブジェクト、フォームデータは文字列の可能性
    if (typeof formData.mobilePhone === 'string') {
      // フォームデータ：文字列の場合
      const mobileRaw = formData.mobilePhone.replace(/-/g, '');
      pdfData.mobilePhone =
        window.PDF_VALUE_FORMATTERS.formatMobilePhone(mobileRaw);
    } else {
      // テストデータ：オブジェクトの場合
      pdfData.mobilePhone = formData.mobilePhone;
    }
  }

  // ===== 固定電話（ハイフン区切り3部分） =====
  if (formData.fixedPhone) {
    // テストデータはオブジェクト、フォームデータは文字列の可能性
    if (typeof formData.fixedPhone === 'string') {
      // フォームデータ：文字列の場合
      pdfData.fixedPhone = window.PDF_VALUE_FORMATTERS.formatFixedPhone(
        formData.fixedPhone,
      );
    } else {
      // テストデータ：オブジェクトの場合
      pdfData.fixedPhone = formData.fixedPhone;
    }
  }

  // ===== 住所区分（ラジオボタン値） =====
  if (formData.addressType) {
    const options = window.PDF_FIELD_MAPPINGS.addressType.options;
    if (Array.isArray(formData.addressType)) {
      // テスト全てモード: 複数値を全て処理
      pdfData.addressType = formData.addressType.map((val) =>
        window.PDF_VALUE_FORMATTERS.getSelectedOption(val, options),
      );
    } else {
      // 通常モード: 単一値
      pdfData.addressType = window.PDF_VALUE_FORMATTERS.getSelectedOption(
        formData.addressType,
        options,
      );
    }
  }

  // ===== 傷病名（テキスト） =====
  pdfData.diseaseName = formData.diseaseName || '';

  // ===== 負傷状況（チェックボックス） =====
  if (formData.injuryContext) {
    const options = window.PDF_FIELD_MAPPINGS.injuryContext.options;
    if (Array.isArray(formData.injuryContext)) {
      // テスト全てモード: 複数値を全て処理
      pdfData.injuryContext = formData.injuryContext.map((val) =>
        window.PDF_VALUE_FORMATTERS.getSelectedOption(val, options),
      );
    } else {
      // 通常モード: 単一値
      pdfData.injuryContext = window.PDF_VALUE_FORMATTERS.getSelectedOption(
        formData.injuryContext,
        options,
      );
    }
  }

  // ===== 負傷に関連するフィールド =====
  if (formData.isInjury === 'on' || formData.isInjury === true) {
    pdfData.injuryLocation = formData.injuryLocation || '';
    pdfData.injuryCause = formData.injuryCause || '';

    if (formData.injuryDate) {
      pdfData.injuryDate = window.PDF_VALUE_FORMATTERS.formatDate(
        formData.injuryDate,
      );
    }

    // 負傷状況に応じた条件付きフィールド
    if (formData.injuryContext === '正課中') {
      pdfData.subjectName = formData.subjectName || '';
    } else if (formData.injuryContext === '大学行事中') {
      pdfData.eventName = formData.eventName || '';
    } else if (formData.injuryContext === '課外活動中') {
      pdfData.clubName = formData.clubName || '';
    } else if (formData.injuryContext === '交通事故') {
      // 交通事故の場合、相手有無（○を描画）
      if (formData.accidentParty) {
        const options = window.PDF_FIELD_MAPPINGS.accidentParty.options;
        if (Array.isArray(formData.accidentParty)) {
          // テスト全てモード
          pdfData.accidentParty = formData.accidentParty.map((val) =>
            window.PDF_VALUE_FORMATTERS.getSelectedOption(val, options),
          );
        } else {
          // 通常モード
          pdfData.accidentParty = window.PDF_VALUE_FORMATTERS.getSelectedOption(
            formData.accidentParty,
            options,
          );
        }
      }
    }
  }

  // ===== 金融機関振込先 =====
  if (formData.bankTransferType) {
    const options = window.PDF_FIELD_MAPPINGS.bankTransferType.options;
    if (Array.isArray(formData.bankTransferType)) {
      // テスト全てモード: 複数値を全て処理
      pdfData.bankTransferType = formData.bankTransferType.map((val) =>
        window.PDF_VALUE_FORMATTERS.getSelectedOption(val, options),
      );
    } else {
      // 通常モード: 単一値
      pdfData.bankTransferType = window.PDF_VALUE_FORMATTERS.getSelectedOption(
        formData.bankTransferType,
        options,
      );
    }
  }

  // ===== 銀行情報（「新規」「変更」の場合） =====
  if (
    formData.bankTransferType !== 'previous' &&
    !Array.isArray(formData.bankTransferType)
  ) {
    pdfData.bankName = formData.bankName || '';
    pdfData.branchName = formData.branchName || '';

    // ===== 銀行コード（4桁） =====
    if (formData.bankCode) {
      pdfData.bankCode = window.PDF_VALUE_FORMATTERS.formatBankCode(
        formData.bankCode,
      );
    }

    // ===== 支店コード（3桁） =====
    if (formData.branchCode) {
      pdfData.branchCode = window.PDF_VALUE_FORMATTERS.formatBranchCode(
        formData.branchCode,
      );
    }

    pdfData.accountName = formData.accountName || '';

    if (formData.accountNumber) {
      pdfData.accountNumber = window.PDF_VALUE_FORMATTERS.formatAccountNumber(
        formData.accountNumber,
      );
    }
  }

  // ===== 受付番号リスト =====
  if (formData.receiptNumber) {
    pdfData.receiptNumber = Array.isArray(formData.receiptNumber)
      ? formData.receiptNumber
      : [formData.receiptNumber];
  }

  return pdfData;
}

/**
 * PDF フィールド書き込み関数（マッピングベース）
 * PDF_FIELD_MAPPINGS と pdfData に基づいて、すべてのフィールドをPDFに書き込む
 *
 * @param {PDFPage} page - PDF-LIB の Page オブジェクト
 * @param {Font} font - 日本語フォント
 * @param {object} pdfData - preparePDFData() の戻り値
 */
function writePDFFieldsFromMappings(page, font, pdfData) {
  if (!window.PDF_FIELD_MAPPINGS) {
    console.error('PDF_FIELD_MAPPINGS が定義されていません');
    return;
  }

  const mappings = window.PDF_FIELD_MAPPINGS;
  const { height } = page.getSize();

  // 各フィールドマッピングを処理
  Object.keys(mappings).forEach((fieldName) => {
    if (fieldName === 'pageInfo') return; // ページ情報はスキップ

    const mapping = mappings[fieldName];
    const value = pdfData[fieldName];

    if (!value && fieldName !== 'isInjury') return; // 値がない場合はスキップ

    try {
      switch (mapping.type) {
        case 'text':
          // テキスト単一フィールド
          writeTextField(page, font, mapping, value, height, pdfData);
          break;

        case 'digit_boxes':
          // マス入力（複数の数字）
          writeDigitBoxes(page, font, mapping, value, height);
          break;

        case 'phone_parts':
          // 電話番号（3部分）
          writePhoneParts(page, font, mapping, value, height);
          break;

        case 'date_parts':
          // 日付（年月日分割）
          writeDateParts(page, font, mapping, value, height);
          break;

        case 'radio_circle':
          // ラジオボタン（○で囲む）
          console.log(`[DEBUG] radio_circle: ${fieldName}`, value);
          writeRadioCircle(page, mapping, value, height);
          break;

        case 'checkbox_mark':
          // チェックボックス（✓マーク）
          console.log(`[DEBUG] checkbox_mark: ${fieldName}`, value);
          writeCheckboxMark(page, font, mapping, value, height);
          break;

        case 'receipt_list':
          // 受付番号リスト
          writeReceiptList(page, font, mapping, value, height);
          break;

        default:
          console.warn(`未対応の型: ${mapping.type}`);
      }
    } catch (error) {
      console.warn(`フィールド${fieldName}の書き込みエラー:`, error);
    }
  });
}

/**
 * テキストフィールドの書き込み
 */
function writeTextField(page, font, mapping, value, pageHeight, pdfData = {}) {
  // 配列の場合で useFirstOnly が true なら最初の要素のみ使用
  let actualValue = value;
  if (Array.isArray(value) && mapping.useFirstOnly) {
    actualValue = value[0];
  }

  if (!actualValue) return;

  // options 配列を持つ場合（条件付きフィールド）
  if (mapping.options && Array.isArray(mapping.options)) {
    // injuryContext から現在の条件を取得
    // pdfData.injuryContext は {value, label, x, y} オブジェクトなので、.value を取得
    const injuryContextValue =
      pdfData.injuryContext?.value || pdfData.injuryContext;
    const currentCondition = injuryContextValue;

    // 現在の条件に対応するオプションを探す
    const selectedOption = mapping.options.find(
      (opt) => opt.condition === currentCondition,
    );

    if (selectedOption) {
      const yInPDF = pageHeight - selectedOption.y; // PDF座標系に変換
      page.drawText(String(actualValue).substring(0, 50), {
        x: selectedOption.x,
        y: yInPDF,
        size: mapping.fontSize || 11,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
  } else {
    // 通常のテキストフィールド
    const yInPDF = pageHeight - mapping.y; // PDF座標系に変換
    page.drawText(String(actualValue).substring(0, 50), {
      x: mapping.x,
      y: yInPDF,
      size: mapping.fontSize || 11,
      font: font,
      color: rgb(0, 0, 0),
    });
  }
}

/**
 * マス入力（6桁学生証、7桁口座番号）の書き込み
 */
function writeDigitBoxes(page, font, mapping, digits, pageHeight) {
  if (!Array.isArray(digits)) {
    console.warn('digit_boxes: digits は配列である必要があります');
    return;
  }

  digits.forEach((digit, index) => {
    if (index >= mapping.positions.length) return;
    if (!digit) return; // 空の場合はスキップ

    const pos = mapping.positions[index];
    const yInPDF = pageHeight - pos.y;

    page.drawText(String(digit), {
      x: pos.x,
      y: yInPDF,
      size: mapping.fontSize || 12,
      font: font,
      color: rgb(0, 0, 0),
    });
  });
}

/**
 * 電話番号3部分の書き込み（090-1234-5678形式）
 */
function writePhoneParts(page, font, mapping, phoneParts, pageHeight) {
  if (!phoneParts || typeof phoneParts !== 'object') {
    console.warn('phone_parts: 電話番号オブジェクトが必要');
    return;
  }

  const parts = ['area', 'exchange', 'subscriber'];
  parts.forEach((part) => {
    const mapPart = mapping.parts.find((p) => p.part === part);
    if (!mapPart || !phoneParts[part]) return;

    const yInPDF = pageHeight - mapPart.y;

    page.drawText(String(phoneParts[part]), {
      x: mapPart.x,
      y: yInPDF,
      size: mapping.fontSize || 11,
      font: font,
      color: rgb(0, 0, 0),
    });
  });
}

/**
 * 日付3部分の書き込み（年月日分割）
 */
function writeDateParts(page, font, mapping, dateParts, pageHeight) {
  if (!dateParts || typeof dateParts !== 'object') {
    console.warn('date_parts: 日付オブジェクトが必要');
    return;
  }

  const parts = ['year', 'month', 'day'];
  parts.forEach((part) => {
    const mapPart = mapping.parts.find((p) => p.part === part);
    if (!mapPart || !dateParts[part]) return;

    const yInPDF = pageHeight - mapPart.y;

    // 月日の0埋めを削除（「01」→「1」）
    let displayValue = String(dateParts[part]);
    if ((part === 'month' || part === 'day') && displayValue.startsWith('0')) {
      displayValue = displayValue.substring(1);
    }

    page.drawText(displayValue, {
      x: mapPart.x,
      y: yInPDF,
      size: mapping.fontSize || 11,
      font: font,
      color: rgb(0, 0, 0),
    });
  });
}

/**
 * ラジオボタン（○で囲む）の書き込み
 *
 * ===== 座標系について =====
 * マッピングの y 値: デザイン座標系（左上が原点）
 * PDF描画時: ページ高さから引き算して PDF座標系（左下が原点）に変換
 * 変換式: yPDF = pageHeight - option.y
 */
function writeRadioCircle(page, mapping, selectedOption, pageHeight) {
  console.log('[DEBUG] writeRadioCircle called', {
    isArray: Array.isArray(selectedOption),
    selectedOption,
  });

  // 配列形式（複数選択）に対応
  if (Array.isArray(selectedOption)) {
    console.log('[DEBUG] Array mode, count:', selectedOption.length);
    // 全ての選択肢に○を描画
    selectedOption.forEach((option, idx) => {
      console.log(`[DEBUG] Processing option ${idx}:`, option);
      if (!option || !option.x || !option.y) {
        console.log(`[DEBUG] Skipping option ${idx}: missing x/y`);
        return;
      }

      const yInPDF = pageHeight - option.y;
      console.log(`[DEBUG] Drawing circle at (${option.x}, ${yInPDF})`);

      page.drawCircle({
        x: option.x,
        y: yInPDF,
        size: (option.radius || 5) * 2, // 直径 = radius * 2
        borderColor: rgb(
          mapping.circleColor?.r || 0,
          mapping.circleColor?.g || 0,
          mapping.circleColor?.b || 0,
        ),
        borderWidth: mapping.circleWidth || 1.5,
      });
    });
  } else if (selectedOption && selectedOption.x && selectedOption.y) {
    console.log('[DEBUG] Single mode');
    // 単一選択形式
    const yInPDF = pageHeight - selectedOption.y;

    page.drawCircle({
      x: selectedOption.x,
      y: yInPDF,
      size: (selectedOption.radius || 5) * 2, // 直径
      borderColor: rgb(
        mapping.circleColor?.r || 0,
        mapping.circleColor?.g || 0,
        mapping.circleColor?.b || 0,
      ),
      borderWidth: mapping.circleWidth || 1.5,
    });
  } else {
    console.warn('radio_circle: 選択された座標が見つかりません');
  }
}

/**
 * チェックボックス（✓マーク）の書き込み
 *
 * ===== 座標系について =====
 * マッピングの y 値: デザイン座標系（左上が原点）
 * PDF描画時: ページ高さから引き算して PDF座標系（左下が原点）に変換
 * 変換式: yPDF = pageHeight - option.y
 *
 * ✓マークは drawText() で描画するため、
 * y 座標はテキストベースライン（下側）を基準として動作
 */
function writeCheckboxMark(page, font, mapping, selectedOption, pageHeight) {
  console.log('[DEBUG] writeCheckboxMark called', {
    isArray: Array.isArray(selectedOption),
    selectedOption,
  });

  // 配列形式（複数選択）に対応
  if (Array.isArray(selectedOption)) {
    console.log('[DEBUG] Array mode, count:', selectedOption.length);
    // 全ての選択肢に「レ」を描画
    selectedOption.forEach((option, idx) => {
      console.log(`[DEBUG] Processing option ${idx}:`, option);
      if (!option || !option.x || !option.y) {
        console.log(`[DEBUG] Skipping option ${idx}: missing x/y`);
        return;
      }

      const yInPDF = pageHeight - option.y;
      console.log(`[DEBUG] Drawing mark at (${option.x}, ${yInPDF})`);

      page.drawText('レ', {
        x: option.x,
        y: yInPDF,
        size: 14,
        font: font,
        color: rgb(
          mapping.markColor?.r || 0,
          mapping.markColor?.g || 0,
          mapping.markColor?.b || 0,
        ),
      });
    });
  } else if (selectedOption && selectedOption.x && selectedOption.y) {
    // 単一選択形式
    const yInPDF = pageHeight - selectedOption.y;

    page.drawText('レ', {
      x: selectedOption.x,
      y: yInPDF,
      size: 14,
      font: font,
      color: rgb(
        mapping.markColor?.r || 0,
        mapping.markColor?.g || 0,
        mapping.markColor?.b || 0,
      ),
    });
  } else {
    console.warn('checkbox_mark: 選択された座標が見つかりません');
  }
}

/**
 * 受付番号リストの書き込み
 */
function writeReceiptList(page, font, mapping, receiptNumbers, pageHeight) {
  if (!Array.isArray(receiptNumbers)) {
    console.warn('receipt_list: receiptNumbers は配列である必要があります');
    return;
  }

  receiptNumbers.forEach((num, index) => {
    if (index >= mapping.maxItems) return;
    if (!num) return;

    const x = mapping.baseX + index * mapping.spacing;
    const yInPDF = pageHeight - mapping.baseY;

    page.drawText(String(num), {
      x: x,
      y: yInPDF,
      size: mapping.fontSize || 11,
      font: font,
      color: rgb(0, 0, 0),
    });
  });
}

/**
 * ===== テスト用関数群 =====
 * 座標がずれていないか確認するためのダミーデータ生成
 */

/**
 * テスト用ダミーデータを生成（すべてのフィールドに値を入れる）
 */
function generateTestPDFData() {
  return {
    faculty: '経済学部',
    grade: '3',
    studentName: '山田太郎',
    studentNameKana: 'ヤマダタロウ',
    studentNumber: ['1', '2', '3', '4', '5', '6'],
    mobilePhone: {
      area: '090',
      exchange: '1234',
      subscriber: '5678',
    },
    fixedPhone: {
      area: '06',
      exchange: '1234',
      subscriber: '5678',
    },
    addressType: '1',
    receiptNumbers: ['0001', '0002', '0003'],
    diseaseName: '急性胃腸炎',
    injuryContext: '正課中',
    subjectName: '体育実技',
    injuryLocation: '体育館',
    injuryCause: 'バスケットボール中にねん挫',
    injuryDate: {
      year: '2026',
      month: '01',
      day: '28',
    },
    accidentParty: null, // 交通事故ではないのでnull
    bankTransferType: 'new',
    bankName: '三菱UFJ銀行',
    branchName: '京都支店',
    bankCode: '0005',
    branchCode: '055',
    accountName: 'ヤマダタロウ',
    accountNumber: ['', '', '', '1', '2', '3', '4'],
  };
}

/**
 * テスト用ダミーデータを生成（交通事故パターン）
 */
function generateTestPDFDataAccident() {
  return {
    faculty: '理学部',
    grade: '2',
    studentName: '鈴木花子',
    studentNameKana: 'スズキハナコ',
    studentNumber: ['0', '2', '2', '0', '0', '1'],
    mobilePhone: {
      area: '080',
      exchange: '9876',
      subscriber: '5432',
    },
    fixedPhone: {
      area: '075',
      exchange: '123',
      subscriber: '4567',
    },
    addressType: '2',
    receiptNumbers: ['0004', '0005'],
    diseaseName: '交通事故によるけが',
    injuryContext: '交通事故',
    subjectName: null,
    injuryLocation: '横断歩道',
    injuryCause: '自動車に接触',
    injuryDate: {
      year: '2026',
      month: '01',
      day: '15',
    },
    accidentParty: '有り',
    bankTransferType: 'change',
    bankName: 'みずほ銀行',
    branchName: '京都中央支店',
    bankCode: '0001',
    branchCode: '110',
    accountName: 'スズキハナコ',
    accountNumber: ['', '', '', '', '5', '6', '7'],
  };
}

/**
 * テスト用ダミーデータを生成（全フィールド充填版 - 全ての選択肢を○/✔）
 * 本来なら両立しない組み合わせでも全部入れるテスト
 */
function generateTestPDFDataAll() {
  return {
    faculty: 'テスト学部',
    grade: '4',
    studentName: 'テスト太郎',
    studentNameKana: 'テストタロウ',
    studentNumber: ['9', '9', '9', '9', '9', '9'],
    mobilePhone: {
      area: '090',
      exchange: '9999',
      subscriber: '9999',
    },
    fixedPhone: {
      area: '120',
      exchange: '999',
      subscriber: '9999',
    },

    // 住所区分：全て選択（本来は1つだけ）
    addressType: ['1', '2', '3'],

    receiptNumbers: ['0001', '0002', '0003', '0004'],
    diseaseName: '総合テスト疾患',

    // 負傷状況：全て選択
    injuryContext: [
      '正課中',
      '大学行事中',
      '学校施設内',
      '課外活動中',
      '交通事故',
      'その他',
    ],

    // 各受傷状況に対応するフィールド（全部記入）
    subjectName: '全科目テスト',
    eventName: 'テスト行事全て',
    clubName: 'テスト部活',

    // 場所と原因も各受傷状況ごとに全部記入
    injuryLocation: '全てのテスト場所',
    injuryCause: '全てのテスト原因',

    injuryDate: {
      year: '2026',
      month: '01',
      day: '28',
    },

    // 交通事故相手：全て選択
    accidentParty: ['有り', '無し'],

    // 金融機関振込先：全て選択
    bankTransferType: ['previous', 'new', 'change'],

    bankName: 'テスト銀行全て',
    branchName: 'テスト支店全部',
    bankCode: '9999',
    branchCode: '999',
    accountName: 'テストタロウ',
    accountNumber: ['9', '9', '9', '9', '9', '9', '9'],
  };
}

/**
 * PDFテスト生成（コンソールから呼び出し可能）
 * 使用例: generateTestPDF('normal') または generateTestPDF('accident')
 */
async function generateTestPDF(pattern = 'normal') {
  try {
    console.log(`🧪 テストPDF生成開始: ${pattern}`);
    console.log('PDFDocument:', typeof PDFDocument);
    console.log('fontkit:', typeof fontkit);
    console.log('rgb:', typeof rgb);

    const pdfDoc = await PDFDocument.create();
    console.log('✓ PDFDocument created');

    if (fontkit) {
      pdfDoc.registerFontkit(fontkit);
      console.log('✓ fontkit registered');
    } else {
      console.warn('⚠️ fontkit not available, using standard fonts');
    }

    let font;
    const fontBytes = await loadJapaneseFont();
    if (fontBytes) {
      font = await pdfDoc.embedFont(fontBytes);
      console.log('✓ Japanese font embedded');
    } else {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      console.log('⚠️ Using Helvetica font');
    }

    // テストデータの選択
    let testData;
    if (pattern === 'accident') {
      testData = generateTestPDFDataAccident();
    } else if (pattern === 'all') {
      testData = generateTestPDFDataAll();
    } else {
      testData = generateTestPDFData();
    }
    console.log('✓ Test data generated:', testData);

    // ページを作成
    const page = pdfDoc.addPage([595.28, 841.89]); // A4サイズ
    const { width, height } = page.getSize();
    console.log('✓ Page created');

    // 背景画像の埋め込み（あれば）
    try {
      const imageUrl = 'assets/img/medical-receipt-bg.png';
      const imageBytes = await fetch(imageUrl).then((res) => res.arrayBuffer());
      const backgroundImage = await pdfDoc.embedPng(imageBytes);

      page.drawImage(backgroundImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });

      // テスト用：背景を薄くするために半透明の白レイヤーを追加
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        color: rgb(1, 1, 1),
        opacity: 0.5, // 50%の透明度で背景を薄くする
      });
      console.log('✓ Background image loaded with opacity');
    } catch (error) {
      console.log('背景画像なし。白紙で生成します。');
      // 背景を白で塗りつぶし
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        color: rgb(1, 1, 1),
      });
      console.log('✓ Background filled');
    }

    // フィールド値を書き込み
    const pdfData = preparePDFData(testData);
    writePDFFieldsFromMappings(page, font, pdfData);
    console.log('✓ Fields written');

    // PDF保存
    const pdfBytes = await pdfDoc.save();
    console.log('✓ PDF saved to bytes');

    // ダウンロード
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TEST_医療費領収証_${pattern}_${new Date().getTime()}.pdf`;
    link.click();

    URL.revokeObjectURL(url);
    console.log(`✅ テストPDF(${pattern}) を生成しました`);
    console.log('生成データ:', testData);
  } catch (error) {
    console.error('テストPDF生成エラー:', error);
    console.error('スタックトレース:', error.stack);
  }
}

/**
 * PDF座標ガイド描画（デバッグ用）
 * グリッドと座標ラベルを描画してずれを確認
 */
function drawCoordinateGuide(page) {
  const { width, height } = page.getSize();
  const gridSize = 100;
  const guideLightGray = rgb(0.95, 0.95, 0.95);
  const guideDarkGray = rgb(0.8, 0.8, 0.8);

  // 縦線（X軸グリッド）
  for (let x = 0; x <= width; x += gridSize) {
    const color = x % 500 === 0 ? guideDarkGray : guideLightGray;
    const width_line = x % 500 === 0 ? 0.5 : 0.2;

    page.drawLine({
      start: { x: x, y: 0 },
      end: { x: x, y: height },
      color: color,
      width: width_line,
    });
  }

  // 横線（Y軸グリッド）
  for (let y = 0; y <= height; y += gridSize) {
    const color = y % 500 === 0 ? guideDarkGray : guideLightGray;
    const width_line = y % 500 === 0 ? 0.5 : 0.2;

    page.drawLine({
      start: { x: 0, y: y },
      end: { x: width, y: y },
      color: color,
      width: width_line,
    });
  }

  console.log('✅ 座標ガイド (グリッド) を描画しました');
}

/**
 * グローバルに公開（コンソールから呼び出し可能）
 */
if (typeof window !== 'undefined') {
  window.generateTestPDF = generateTestPDF;
  window.generateTestPDFData = generateTestPDFData;
  window.generateTestPDFDataAccident = generateTestPDFDataAccident;
  window.generateTestPDFDataAll = generateTestPDFDataAll;
  window.writePDFFieldsFromMappings = writePDFFieldsFromMappings;
}

/**
 * 日本語フォントの読み込み
 */
async function loadJapaneseFont() {
  try {
    const fontUrl =
      'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEi75vY0rw-oME.ttf';
    const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
    return fontBytes;
  } catch (error) {
    console.error('フォント読み込みエラー:', error);
    return null;
  }
}

/**
 * PDF生成メイン関数
 */
async function generatePDF() {
  try {
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';

    const data = getFormData();

    // 入力チェック
    const requiredFields = [
      'grade',
      'studentNumber',
      'studentName',
      'studentNameKana',
      'mobilePhone',
      'addressType',
      'diseaseName',
      'bankTransferType',
    ];

    for (let field of requiredFields) {
      if (!data[field]) {
        showMessage(`${field}は必須項目です`, 'error');
        generateBtn.disabled = false;
        generateBtn.textContent = '📄 PDF生成';
        return;
      }
    }

    // ===== フォームデータを PDF 形式に変換 =====
    const pdfData = preparePDFData(data);
    console.log('PDF書き込み用データ:', pdfData);

    // PDF書き込み用データの検証
    if (!pdfData) {
      showMessage('PDF データの準備に失敗しました', 'error');
      generateBtn.disabled = false;
      generateBtn.textContent = '📄 PDF生成';
      return;
    }

    // PDFドキュメントの作成
    const pdfDoc = await PDFDocument.create();

    // フォントの登録
    pdfDoc.registerFontkit(fontkit);

    // 日本語フォントの読み込み
    let font;
    const fontBytes = await loadJapaneseFont();
    if (fontBytes) {
      font = await pdfDoc.embedFont(fontBytes);
    } else {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    // 各受付番号ごとにPDFページを作成
    const receiptNumbers = data.receiptNumber || [];
    if (receiptNumbers.length === 0) {
      showMessage('受付番号が入力されていません', 'error');
      generateBtn.disabled = false;
      generateBtn.textContent = '📄 PDF生成';
      return;
    }

    receiptNumbers.forEach((receiptNum, pageIndex) => {
      const page = pdfDoc.addPage([595.28, 841.89]); // A4サイズ
      const { width, height } = page.getSize();

      // 背景を白で塗りつぶし
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        color: rgb(255, 255, 255),
      });

      // ===== PDF書き込み =====
      // フォームデータを PDF 形式に変換
      const pdfData = preparePDFData(data);

      // このページの受付番号を追加
      pdfData.receiptNumber = receiptNum;

      // PDF_FIELD_MAPPINGS に基づいて全フィールドを書き込み
      writePDFFieldsFromMappings(page, font, pdfData);
    });

    // PDF保存
    const pdfBytes = await pdfDoc.save();

    // ダウンロード
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `医療費領収申請書_${data.studentName || '未記入'}_${new Date().getTime()}.pdf`;
    link.click();

    URL.revokeObjectURL(url);

    showMessage('PDFを生成しました', 'success');
  } catch (error) {
    console.error('PDF生成エラー:', error);
    showMessage('PDF生成に失敗しました: ' + error.message, 'error');
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = '📄 PDF生成';
  }
}

/**
 * 自動保存の設定
 */
function setupAutoSave() {
  const inputElements = form.querySelectorAll('input, select, textarea');

  inputElements.forEach((element) => {
    if (element.id === 'studentNumber' || element.id === 'accountNumber') {
      // 隠し入力はスキップ
      return;
    }

    element.addEventListener('input', () => {
      saveFormData(true);
    });

    element.addEventListener('change', () => {
      saveFormData(true);
    });
  });

  console.log('自動保存機能が有効です');
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', init);

/**
 * フォームデータの収集
 */
function getFormData() {
  const formData = new FormData(form);
  const data = {};

  // 通常の入力フィールド
  for (let [key, value] of formData.entries()) {
    if (key === 'transportation') {
      // チェックボックスは配列として保存
      if (!data[key]) data[key] = [];
      data[key].push(value);
    } else {
      data[key] = value;
    }
  }

  return data;
}

/**
 * フォームデータの保存（LocalStorage）
 */
function saveFormData(isAutoSave = false) {
  const data = getFormData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (!isAutoSave) {
    showMessage('入力内容を保存しました', 'success');
  }
}

/**
 * フォームデータの読み込み（LocalStorage）
 */
function loadFormData() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (!savedData) {
    return;
  }

  try {
    const data = JSON.parse(savedData);

    // フォームフィールドに値を設定
    Object.keys(data).forEach((key) => {
      const element = form.elements[key];
      if (!element) return;

      if (element.type === 'checkbox') {
        // チェックボックスの場合
        const checkboxes = form.querySelectorAll(`[name="${key}"]`);
        checkboxes.forEach((cb) => {
          cb.checked = data[key].includes(cb.value);
        });
      } else if (element.type === 'radio') {
        // ラジオボタンの場合
        const radio = form.querySelector(
          `[name="${key}"][value="${data[key]}"]`,
        );
        if (radio) radio.checked = true;
      } else {
        // その他の入力フィールド
        element.value = data[key];
      }
    });
  } catch (error) {
    console.error('データ読み込みエラー:', error);
  }
}

/**
 * メッセージ表示
 */
function showMessage(message, type = 'success') {
  // 既存のメッセージを削除
  const existingMessage = document.querySelector('.message-box');
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageBox = document.createElement('div');
  messageBox.className = `message-box ${type}-message`;
  messageBox.textContent = message;
  messageBox.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 25px;
        border-radius: 8px;
        background: ${type === 'success' ? '#51cf66' : '#ff6b6b'};
        color: white;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: fadeIn 0.3s ease-out;
    `;

  document.body.appendChild(messageBox);

  setTimeout(() => {
    messageBox.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => messageBox.remove(), 300);
  }, 3000);
}

/**
 * 日本語フォントの読み込み（Noto Sans JPをCDNから取得）
 */
async function loadJapaneseFont() {
  try {
    // Google Fonts から Noto Sans JP を取得
    const fontUrl =
      'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEi75vY0rw-oME.ttf';
    const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
    return fontBytes;
  } catch (error) {
    console.error('フォント読み込みエラー:', error);
    return null;
  }
}

/**
 * 画像をBase64に変換
 */
async function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * PDF生成メイン関数
 */
async function generatePDF() {
  try {
    // ボタンを無効化
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';

    const data = getFormData();

    // PDFドキュメントの作成
    const pdfDoc = await PDFDocument.create();

    // フォントの登録
    pdfDoc.registerFontkit(fontkit);

    // 日本語フォントの読み込み
    let font;
    const fontBytes = await loadJapaneseFont();
    if (fontBytes) {
      font = await pdfDoc.embedFont(fontBytes);
    } else {
      // フォールバック：標準フォント
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    // ページの追加（A4サイズ）
    const page = pdfDoc.addPage([595.28, 841.89]); // A4サイズ (pt)
    const { width, height } = page.getSize();

    // 背景画像の埋め込み（もし assets/img/medical-receipt-bg.jpg が存在する場合）
    try {
      const imageUrl = 'assets/img/medical-receipt-bg.png';
      const imageBytes = await fetch(imageUrl).then((res) => res.arrayBuffer());
      const backgroundImage = await pdfDoc.embedPng(imageBytes);

      page.drawImage(backgroundImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
    } catch (error) {
      console.log('背景画像なし。白紙で生成します。');
      // 背景を白で塗りつぶし
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        color: rgb(1, 1, 1),
      });
    }

    // タイトル描画
    page.drawText('医療費領収証明書', {
      x: 220,
      y: height - 80,
      size: 18,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('(以下記入は学生が健康保険 申請用)', {
      x: 180,
      y: height - 105,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    // 認定証番号
    if (data.certNumber) {
      drawCircle(page, 520, height - 95, 30);
      page.drawText(data.certNumber, {
        x: 500,
        y: height - 100,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // 医療機関情報
    let yPos = height - 160;

    if (data.treatmentYear && data.treatmentMonth) {
      page.drawText(`${data.treatmentYear}年 ${data.treatmentMonth}月診療分`, {
        x: 100,
        y: yPos,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    if (data.hospitalName) {
      yPos -= 25;
      const hospitalLines = data.hospitalName.split('\n');
      hospitalLines.forEach((line) => {
        page.drawText(line, {
          x: 100,
          y: yPos,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPos -= 18;
      });
    }

    // 診療実日数
    if (data.visitCount) {
      yPos -= 10;
      page.drawText(`当月診療実日数: ${data.visitCount}日`, {
        x: 100,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // 金額情報
    yPos -= 40;
    page.drawText('診療報酬', {
      x: 120,
      y: yPos,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });

    if (data.medicalFee) {
      page.drawText(`${parseInt(data.medicalFee).toLocaleString()}円`, {
        x: 350,
        y: yPos,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    yPos -= 25;
    page.drawText('一部負担金', {
      x: 120,
      y: yPos,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });

    if (data.copayment) {
      page.drawText(`${parseInt(data.copayment).toLocaleString()}円`, {
        x: 350,
        y: yPos,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // 学生情報
    yPos -= 50;
    page.drawText('【学生情報】', {
      x: 80,
      y: yPos,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    yPos -= 25;
    if (data.studentNumber) {
      page.drawText(`学籍番号: ${data.studentNumber}`, {
        x: 100,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    yPos -= 20;
    if (data.faculty) {
      page.drawText(`学部・研究科: ${data.faculty}`, {
        x: 100,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    if (data.grade) {
      page.drawText(`学年: ${data.grade}`, {
        x: 350,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    yPos -= 20;
    if (data.studentName) {
      page.drawText(`氏名: ${data.studentName}`, {
        x: 100,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // 負傷情報
    yPos -= 40;
    page.drawText('【負傷情報】', {
      x: 80,
      y: yPos,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    yPos -= 25;
    if (data.injuryPlace) {
      page.drawText(`負傷の場所:`, {
        x: 100,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });

      // ラジオボタンのチェックマーク表示
      const options = ['正課', '課外', '通学'];
      let xPos = 200;
      options.forEach((option) => {
        if (data.injuryPlace === option) {
          drawCheckMark(page, xPos, yPos + 3);
        } else {
          drawSquare(page, xPos - 5, yPos - 2, 10);
        }
        page.drawText(option, {
          x: xPos + 15,
          y: yPos,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
        xPos += 80;
      });
    }

    yPos -= 25;
    if (data.injuryDate) {
      const date = new Date(data.injuryDate);
      page.drawText(
        `負傷日: ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`,
        {
          x: 100,
          y: yPos,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        },
      );
    }

    // 通院方法
    yPos -= 30;
    if (data.transportation && data.transportation.length > 0) {
      page.drawText('通院方法:', {
        x: 100,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });

      const transportOptions = [
        '大学行き帰り',
        '学校施設内',
        '課外活動中',
        '交通事故',
        'その他',
      ];
      let tYPos = yPos - 20;
      transportOptions.forEach((option) => {
        if (data.transportation.includes(option)) {
          drawCheckMark(page, 120, tYPos + 3);
        } else {
          drawSquare(page, 115, tYPos - 2, 10);
        }
        page.drawText(option, {
          x: 135,
          y: tYPos,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
        tYPos -= 18;
      });
    }

    // PDF保存
    const pdfBytes = await pdfDoc.save();

    // ダウンロード
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `医療費領収証明書_${data.studentName || '未記入'}_${new Date().getTime()}.pdf`;
    link.click();

    URL.revokeObjectURL(url);

    showMessage('PDFを生成しました', 'success');
  } catch (error) {
    console.error('PDF生成エラー:', error);
    showMessage('PDF生成に失敗しました: ' + error.message, 'error');
  } finally {
    // ボタンを有効化
    generateBtn.disabled = false;
    generateBtn.textContent = '📄 PDF生成';
  }
}

/**
 * 丸印を描画
 */
function drawCircle(page, x, y, radius) {
  const segments = 60;
  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * 2 * Math.PI;
    const angle2 = ((i + 1) / segments) * 2 * Math.PI;

    page.drawLine({
      start: {
        x: x + Math.cos(angle1) * radius,
        y: y + Math.sin(angle1) * radius,
      },
      end: {
        x: x + Math.cos(angle2) * radius,
        y: y + Math.sin(angle2) * radius,
      },
      thickness: 1.5,
      color: rgb(0, 0, 0),
    });
  }
}

/**
 * 四角を描画
 */
function drawSquare(page, x, y, size) {
  page.drawRectangle({
    x: x,
    y: y,
    width: size,
    height: size,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.5,
  });
}

/**
 * チェックマーク（✓）を描画
 */
function drawCheckMark(page, x, y) {
  // ✓マークを2本の線で描画
  page.drawLine({
    start: { x: x, y: y },
    end: { x: x + 3, y: y - 4 },
    thickness: 2,
    color: rgb(0, 0, 0),
  });

  page.drawLine({
    start: { x: x + 3, y: y - 4 },
    end: { x: x + 8, y: y + 4 },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
}

/**
 * プレビュー機能（将来的に実装）
 */
function previewForm() {
  const data = getFormData();
  console.log('フォームデータプレビュー:', data);
  showMessage('プレビュー機能は開発中です', 'success');
}

// イベントリスナーの設定
form.addEventListener('submit', (e) => {
  e.preventDefault();
  generatePDF();
});

saveBtn.addEventListener('click', () => {
  saveFormData(false); // 手動保存（メッセージ表示）
  showMessage('入力内容を保存しました', 'success');
});

loadBtn.addEventListener('click', () => {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (!savedData) {
    showMessage('保存されたデータがありません', 'error');
    return;
  }
  loadFormData();
  showMessage('入力内容を読み込みました', 'success');
});

/**
 * 自動保存の設定
 */
function setupAutoSave() {
  // すべてのフォーム入力要素を監視
  const inputElements = form.querySelectorAll('input, select, textarea');

  inputElements.forEach((element) => {
    // 入力または変更イベントで自動保存
    element.addEventListener('input', () => {
      saveFormData(true); // true = 自動保存（メッセージなし）
    });

    element.addEventListener('change', () => {
      saveFormData(true);
    });
  });

  console.log('自動保存機能が有効です');
}

/**
 * 電話番号の入力に応じてバリデーション結果を表示する
 * @param {string} inputId - 入力フィールドのID
 * @param {string} validationElementId - 結果表示要素のID
 */
function setupPhoneValidationDisplay(inputId, validationElementId) {
  const inputElement = document.getElementById(inputId);
  const validationElement = document.getElementById(validationElementId);

  if (!inputElement || !validationElement) return;

  inputElement.addEventListener('input', (e) => {
    const value = e.target.value;

    // 空の場合は非表示
    if (!value) {
      validationElement.classList.remove('show');
      return;
    }

    // バリデーション実行
    const result = validatePhoneNumber(value);

    // 表示要素のクリア
    validationElement.classList.remove(
      'valid-kinki',
      'valid-non-kinki',
      'invalid',
      'incomplete',
    );

    if (result.type === 'incomplete') {
      // 入力途中
      validationElement.textContent = result.reason;
      validationElement.classList.add('incomplete', 'show');
    } else if (!result.isValid) {
      // 無効
      validationElement.textContent = result.reason;
      validationElement.classList.add('invalid', 'show');
    } else if (result.type === 'mobile') {
      // 携帯電話（近畿圏判定は不要）
      validationElement.textContent = result.reason;
      validationElement.classList.add('valid-kinki', 'show');
    } else if (result.type === 'fixed') {
      // 固定電話
      if (result.isKinki) {
        // 近畿圏
        validationElement.textContent = `✓ 有効な番号です（${result.region}）`;
        validationElement.classList.add('valid-kinki', 'show');
      } else {
        // 近畿圏外 - 警告メッセージ
        validationElement.innerHTML = `<strong>${result.region}の番号ですが間違いないですか？</strong><br>入力内容：${value}`;
        validationElement.classList.add('valid-non-kinki', 'show');
      }
    } else {
      // その他
      validationElement.textContent = result.reason;
      validationElement.classList.add('invalid', 'show');
    }
  });
}

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
  console.log('医療費領収証明書作成ツール 初期化完了');

  // 保存されたデータがあれば自動読み込み
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      loadFormData();
    } catch (error) {
      console.log('前回の入力データはありません');
    }
  }

  // 自動保存機能を有効化
  setupAutoSave();

  // 電話番号バリデーション表示を設定
  setupPhoneValidationDisplay('mobilePhone', 'mobilePhoneValidation');
  setupPhoneValidationDisplay('fixedPhone', 'fixedPhoneValidation');
});
