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
const previewBtn = document.getElementById('previewBtn');

// LocalStorage キー
const STORAGE_KEY = 'medicalReceiptData';

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
function saveFormData() {
    const data = getFormData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    showMessage('入力内容を保存しました', 'success');
}

/**
 * フォームデータの読み込み（LocalStorage）
 */
function loadFormData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
        showMessage('保存されたデータがありません', 'error');
        return;
    }
    
    try {
        const data = JSON.parse(savedData);
        
        // フォームフィールドに値を設定
        Object.keys(data).forEach(key => {
            const element = form.elements[key];
            if (!element) return;
            
            if (element.type === 'checkbox') {
                // チェックボックスの場合
                const checkboxes = form.querySelectorAll(`[name="${key}"]`);
                checkboxes.forEach(cb => {
                    cb.checked = data[key].includes(cb.value);
                });
            } else if (element.type === 'radio') {
                // ラジオボタンの場合
                const radio = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
                if (radio) radio.checked = true;
            } else {
                // その他の入力フィールド
                element.value = data[key];
            }
        });
        
        showMessage('入力内容を読み込みました', 'success');
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        showMessage('データの読み込みに失敗しました', 'error');
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
        const fontUrl = 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEi75vY0rw-oME.ttf';
        const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
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
            const imageUrl = 'assets/img/medical-receipt-bg.jpg';
            const imageBytes = await fetch(imageUrl).then(res => res.arrayBuffer());
            const backgroundImage = await pdfDoc.embedJpg(imageBytes);
            
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
            hospitalLines.forEach(line => {
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
            options.forEach(option => {
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
            page.drawText(`負傷日: ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`, {
                x: 100,
                y: yPos,
                size: 10,
                font: font,
                color: rgb(0, 0, 0),
            });
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
            
            const transportOptions = ['大学行き帰り', '学校施設内', '課外活動中', '交通事故', 'その他'];
            let tYPos = yPos - 20;
            transportOptions.forEach(option => {
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
                y: y + Math.sin(angle1) * radius 
            },
            end: { 
                x: x + Math.cos(angle2) * radius, 
                y: y + Math.sin(angle2) * radius 
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

saveBtn.addEventListener('click', saveFormData);
loadBtn.addEventListener('click', loadFormData);
previewBtn.addEventListener('click', previewForm);

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
    console.log('医療費領収証明書作成ツール 初期化完了');
});
