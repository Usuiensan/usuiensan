/**
 * 医療費領収証明書作成ツール - PDF生成スクリプト
 * PDF-LIB を使用して背景画像に文字・○・✓を描画
 */

// PDF-LIB のインポート
const { PDFDocument, rgb, StandardFonts } = PDFLib;

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
        color: rgb(1, 1, 1),
      });

      // テンプレート描画
      drawPDFTemplate(page, font, data, receiptNum);
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
 * PDFテンプレートの描画
 */
function drawPDFTemplate(page, font, data, receiptNum) {
  const { height } = page.getSize();
  let yPos = height - 60;

  // ヘッダー
  page.drawText('医療費領収証明書申請', {
    x: 200,
    y: yPos,
    size: 16,
    font: font,
    color: rgb(0, 0, 0),
  });

  yPos -= 40;

  // 受付番号
  page.drawText(`受付番号: ${receiptNum}`, {
    x: 50,
    y: yPos,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  });

  yPos -= 30;

  // 共通情報
  page.drawText('【申請者情報】', {
    x: 50,
    y: yPos,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  yPos -= 25;

  page.drawText(
    `氏名: ${data.studentName || ''} (${data.studentNameKana || ''})`,
    {
      x: 70,
      y: yPos,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    },
  );

  yPos -= 20;

  page.drawText(`学部・研究科: ${data.faculty || ''} ${data.grade || ''}年次`, {
    x: 70,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });

  yPos -= 20;

  page.drawText(`学生証番号: ${data.studentNumber || ''}`, {
    x: 70,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });

  yPos -= 20;

  page.drawText(`携帯電話: ${data.mobilePhone || ''}`, {
    x: 70,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });

  if (data.fixedPhone) {
    yPos -= 20;
    page.drawText(`固定電話: ${data.fixedPhone}`, {
      x: 70,
      y: yPos,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  yPos -= 30;

  // 住所区分
  const addressLabels = { 1: '自宅', 2: '自宅外', 3: '大学寮' };
  page.drawText(`住所区分: ${addressLabels[data.addressType] || ''}`, {
    x: 70,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });

  yPos -= 35;

  // 傷病情報
  page.drawText('【傷病情報】', {
    x: 50,
    y: yPos,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  yPos -= 25;

  page.drawText(`傷病名: ${data.diseaseName || ''}`, {
    x: 70,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });

  if (data.isInjury) {
    yPos -= 20;
    if (data.injuryDate) {
      const date = new Date(data.injuryDate);
      page.drawText(
        `負傷日: ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`,
        {
          x: 70,
          y: yPos,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        },
      );
    }

    if (data.injurySituation) {
      yPos -= 20;
      page.drawText(`受傷状況: ${data.injurySituation}`, {
        x: 70,
        y: yPos,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
  }

  yPos -= 35;

  // 金融機関情報
  page.drawText('【金融機関情報】', {
    x: 50,
    y: yPos,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  yPos -= 25;

  const bankTypeLabel = {
    previous: '前回と同じ',
    new: '新規',
    change: '変更',
  };
  page.drawText(`振込先: ${bankTypeLabel[data.bankTransferType] || ''}`, {
    x: 70,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });

  if (data.bankTransferType !== 'previous') {
    yPos -= 20;
    page.drawText(
      `金融機関: ${data.bankName || ''} ${data.branchName || ''}支店`,
      {
        x: 70,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      },
    );

    yPos -= 20;
    page.drawText(
      `口座名義: ${data.accountName || ''} 口座番号: ${data.accountNumber || ''}`,
      {
        x: 70,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      },
    );
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

previewBtn.addEventListener('click', previewForm);

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
});
