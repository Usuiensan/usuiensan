// DOM要素を取得
const textInput = document.getElementById('textInput');
const byteCountEl = document.getElementById('byteCount');
const codeUnitCountEl = document.getElementById('codeUnitCount');
const codePointCountEl = document.getElementById('codePointCount');
const graphemeCountEl = document.getElementById('graphemeCount');

// 新たに追加: 異体字セレクタとShift_JIS互換性の表示要素
const vsIndicatorEl = document.getElementById('vsIndicator');
const shiftJisStatusEl = document.getElementById('shiftJisStatus');

// 書記素クラスタを数えるためのSegmenterを準備
// 対応していないブラウザの場合はエラーになる可能性があるため、try-catchで囲む
let segmenter;
try {
    segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
} catch (e) {
    console.error('Intl.Segmenter is not supported in this browser.');
}

// 異体字セレクタを含むかを調べる（U+FE00..FE0F および U+E0100..E01EF）
function countVariationSelectors(str) {
    let count = 0;
    for (const ch of str) {
        const cp = ch.codePointAt(0);
        if ((cp >= 0xFE00 && cp <= 0xFE0F) || (cp >= 0xE0100 && cp <= 0xE01EF)) {
            count++;
        }
    }
    return count;
}

// 書記素クラスタ分割ユーティリティ（Segmenterがあればそれを使用、なければ結合文字でクラスタ化）
function splitIntoUnits(normalized) {
    const units = [];
    if (typeof segmenter !== 'undefined' && segmenter) {
        for (const seg of segmenter.segment(normalized)) {
            units.push(seg.segment);
        }
        return units;
    }
    // フォールバック: 結合文字 (Mark) を直前の文字に付加してクラスタ化
    const arr = [...normalized];
    const markRegex = /\p{M}/u;
    for (const ch of arr) {
        if (units.length > 0 && markRegex.test(ch)) {
            units[units.length - 1] += ch;
        } else {
            units.push(ch);
        }
    }
    return units;
}

// Shift_JISに収録されていない文字を調べる（encoding.js を利用）
function findNonShiftJISChars(str) {
    const nonShiftJISChars = new Set(); // 重複を避けるためSetを使用

    // encoding.js のグローバル名はいくつかあるため、両方をチェック
    const enc = (typeof encoding !== 'undefined') ? encoding : (typeof Encoding !== 'undefined' ? Encoding : null);

    if (!enc || typeof enc.convert !== 'function') {
        // フォールバック: NFC 正規化してから簡易判定（クラスタ単位で判定）
        const normalized = (typeof str.normalize === 'function') ? str.normalize('NFC') : str;
        const units = splitIntoUnits(normalized);
        for (const ch of units) {
            const cp = ch.codePointAt(0);
            if (cp > 0xFF) {
                nonShiftJISChars.add(ch);
            }
        }
        return Array.from(nonShiftJISChars);
    }

    // NFC 正規化して、書記素クラスタ単位で評価する
    const normalized = (typeof str.normalize === 'function') ? str.normalize('NFC') : str;
    const units = splitIntoUnits(normalized);

    for (const char of units) {
        try {
            // 1文字（クラスタ）をSJISに変換（配列で受け取る）
            let sjisBytes;
            try {
                sjisBytes = enc.convert(char, { to: 'SJIS', from: 'UNICODE', type: 'array' });
            } catch (e) {
                sjisBytes = enc.convert(char, 'SJIS');
            }

            // SJISにマッピングできない文字は '?' (0x3F) になることがある
            const isConvertedToQuestionMark = (char !== '?' && Array.isArray(sjisBytes) && sjisBytes.length === 1 && sjisBytes[0] === 0x3F);

            if (isConvertedToQuestionMark) {
                nonShiftJISChars.add(char);
                continue;
            }

            // 復元して比較する
            let restored;
            try {
                restored = enc.convert(sjisBytes, { to: 'UNICODE', from: 'SJIS' });
            } catch (e) {
                restored = enc.convert(sjisBytes, 'UNICODE');
            }

            let restoredChar;
            if (Array.isArray(restored)) {
                if (typeof enc.codeToString === 'function') {
                    restoredChar = enc.codeToString(restored);
                } else {
                    restoredChar = String.fromCharCode.apply(null, restored);
                }
            } else {
                restoredChar = restored;
            }

            if (restoredChar !== char) {
                nonShiftJISChars.add(char);
            }
        } catch (e) {
            // 変換に失敗したら非収録と見なす
            nonShiftJISChars.add(char);
        }
    }

    return Array.from(nonShiftJISChars); // Setを配列に変換して返す
}

// HTMLエスケープのヘルパー
function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;');
}

// 文字数を計算して表示を更新する関数
function updateCounts() {
    const inputText = textInput.value;

    // 1. バイト数 (UTF-8)
    // TextEncoderを使って文字列をUTF-8のバイト列に変換し、その長さを取得
    const byteLength = new TextEncoder().encode(inputText).length;
    byteCountEl.textContent = byteLength;

    // 2. コードユニット数 (JavaScriptの .length)
    // 文字列の .length プロパティはUTF-16のコードユニット数を返す
    const codeUnitLength = inputText.length;
    codeUnitCountEl.textContent = codeUnitLength;

    // 3. コードポイント数
    // スプレッド構文(...)で文字列を配列に変換すると、サロゲートペアが1つの要素になる
    const codePointLength = [...inputText].length;
    codePointCountEl.textContent = codePointLength;

    // 4. 書記素クラスタ数
    // Intl.Segmenterが利用可能な場合のみ計算
    if (segmenter) {
        // segment()メソッドで文字列を書記素クラスタごとに分割し、その数を数える
        const segments = segmenter.segment(inputText);
        const graphemeLength = [...segments].length;
        graphemeCountEl.textContent = graphemeLength;
    } else {
        graphemeCountEl.textContent = 'N/A';
    }

    // 5. 異体字セレクタの検出
    if (vsIndicatorEl) {
        const vsCount = countVariationSelectors(inputText);
        vsIndicatorEl.textContent = vsCount > 0 ? `異体字セレクタを含みます（${vsCount}個）` : '異体字セレクタは含まれていません';
    }

    // 6. Shift_JIS未収録の文字チェック
    if (shiftJisStatusEl) {
        const notInShiftJIS = findNonShiftJISChars(inputText);
        if (notInShiftJIS.length === 0) {
            shiftJisStatusEl.textContent = 'Shift_JISに収録されている可能性があります（簡易判定）';
        } else {
            // 表示は最大10文字までに抑える
            const sample = notInShiftJIS.slice(0, 10).join(' ');
            shiftJisStatusEl.textContent = `Shift_JISに収録されていない可能性のある文字：${sample}${notInShiftJIS.length > 10 ? ' …' : ''}`;
        }
    }

    // 7. ハイライトプレビュー（#preview があれば、クラスタ単位で異体字セレクタ・非Shift_JISをハイライト表示）
    const previewEl = document.getElementById('preview');
    if (previewEl) {
        const normalized = (typeof inputText.normalize === 'function') ? inputText.normalize('NFC') : inputText;
        const units = splitIntoUnits(normalized);
        const nonSJIS = new Set(findNonShiftJISChars(inputText));
        let html = '';
        for (const u of units) {
            const classes = [];
            if (nonSJIS.has(u)) classes.push('highlight-nonsjis');
            if (countVariationSelectors(u) > 0) classes.push('highlight-vs');
            const titleParts = [];
            if (classes.includes('highlight-nonsjis')) titleParts.push('Shift_JIS未収録の可能性');
            if (classes.includes('highlight-vs')) titleParts.push('異体字セレクタを含む');
            const title = titleParts.length ? titleParts.join(' / ') : '';
            html += `<span class="${classes.join(' ')}"${title ? ` title="${escapeHtml(title)}"` : ''}>${escapeHtml(u)}</span>`;
        }
        previewEl.innerHTML = html || '<span class="muted">(プレビューなし)</span>';
    }
}

// テキストエリアに入力があるたびに計算を実行
textInput.addEventListener('input', updateCounts);

// ページ読み込み時にも一度計算を実行
// JekyllではDOMContentLoadedの方が安定することがあります
document.addEventListener('DOMContentLoaded', updateCounts);