// DOMContentLoaded後にDOM要素を取得・初期化
let textInput, byteCountEl, codeUnitCountEl, codePointCountEl, graphemeCountEl;
let vsIndicatorEl, shiftJisStatusEl;
let segmenter;
document.addEventListener('DOMContentLoaded', function() {
    textInput = document.getElementById('textInput');
    byteCountEl = document.getElementById('byteCount');
    codeUnitCountEl = document.getElementById('codeUnitCount');
    codePointCountEl = document.getElementById('codePointCount');
    graphemeCountEl = document.getElementById('graphemeCount');
    // previewElは関数内で取得するため、ここでは取得しない
    vsIndicatorEl = document.getElementById('vsIndicator');
    shiftJisStatusEl = document.getElementById('shiftJisStatus');

    // Segmenter初期化
    try {
        segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
    } catch (e) {
        console.error('Intl.Segmenter is not supported in this browser.');
    }

    // イベントリスナー登録
    if (textInput) {
        textInput.addEventListener('input', updateCounts);
        updateCounts(); // 初回実行
    }
});

// 異体字セレクタを含むかを調べる（U+FE00..FE0F および U+E0100..E01EF）
// SVS（FE00～FE0F）とIVS（E0100～E01EF）を個別にカウント
function countVariationSelectors(str) {
    let svs = 0, ivs = 0;
    for (let i = 0; i < str.length; ) {
        const cp = str.codePointAt(i);
        if (cp >= 0xFE00 && cp <= 0xFE0F) svs++;
        else if (cp >= 0xE0100 && cp <= 0xE01EF) ivs++;
        i += cp > 0xFFFF ? 2 : 1;
    }
    return { svs, ivs };
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

// Shift_JISに収録されていない文字を調べる（encoding-japanese を利用）
function findNonShiftJISChars(str) {
    const nonShiftJISChars = new Set(); // 重複を避けるためSetを使用

    // encoding-japanese のグローバル変数をチェック（CDN版では Encoding が使用される）
    const enc = (typeof Encoding !== 'undefined') ? Encoding : null;

    if (!enc || typeof enc.convert !== 'function' || typeof enc.stringToCode !== 'function') {
        // フォールバック: NFC 正規化してから簡易判定（クラスタ単位で判定）
        console.warn('encoding-japanese ライブラリが利用できません。簡易判定にフォールバックします。');
        const normalized = (typeof str.normalize === 'function') ? str.normalize('NFC') : str;
        const units = splitIntoUnits(normalized);
        for (const ch of units) {
            const cp = ch.codePointAt(0);
            // より厳密な判定：Shift-JIS範囲外の文字を特定
            // ASCII、JIS X 0201のカタカナ、JIS X 0208の範囲外をチェック
            if (cp > 0x7F && !isLikelyShiftJISChar(cp)) {
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
            // 1文字（クラスタ）を文字コード配列に変換
            const unicodeArray = enc.stringToCode(char);
            
            // UnicodeからSJISに変換
            const sjisArray = enc.convert(unicodeArray, {
                to: 'SJIS',
                from: 'UNICODE'
            });

            // SJISに変換できない場合
            if (!sjisArray || sjisArray.length === 0) {
                nonShiftJISChars.add(char);
                continue;
            }

            // SJISにマッピングできない文字は '?' (0x3F) になることがある
            const isConvertedToQuestionMark = (char !== '?' && sjisArray.length === 1 && sjisArray[0] === 0x3F);

            if (isConvertedToQuestionMark) {
                nonShiftJISChars.add(char);
                continue;
            }

            // 復元して比較する
            const restoredArray = enc.convert(sjisArray, {
                to: 'UNICODE',
                from: 'SJIS'
            });
            
            const restored = enc.codeToString(restoredArray);
            
            // 復元された文字列と元の文字を比較
            if (restored !== char) {
                nonShiftJISChars.add(char);
            }
        } catch (e) {
            // 変換に失敗したら非収録と見なす
            console.debug('Shift-JIS変換エラー:', char, e.message);
            nonShiftJISChars.add(char);
        }
    }

    return Array.from(nonShiftJISChars); // Setを配列に変換して返す
}

// Shift-JISに収録されている可能性が高い文字かどうかの簡易判定
function isLikelyShiftJISChar(codePoint) {
    // ひらがな (U+3041-U+3096)
    if (codePoint >= 0x3041 && codePoint <= 0x3096) return true;
    // カタカナ (U+30A1-U+30F6)
    if (codePoint >= 0x30A1 && codePoint <= 0x30F6) return true;
    // CJK統合漢字の一部 (U+4E00-U+9FAF) - ただし全てがShift-JISに含まれるわけではない
    if (codePoint >= 0x4E00 && codePoint <= 0x9FAF) return true;
    // その他の一般的な記号
    if (codePoint >= 0xFF01 && codePoint <= 0xFF5E) return true; // 全角英数記号
    
    return false;
}

function detectCharacterType(char) {
    const result = {
        isPUA: false,
    };
    
    for (const ch of char) {
        const cp = ch.codePointAt(0);
        
        // 私用領域 (Private Use Area)
        if ((cp >= 0xE000 && cp <= 0xF8FF) || //第0面
            (cp >= 0xF0000 && cp <= 0xFFFFD) || //第15面
            (cp >= 0x100000 && cp <= 0x10FFFD)) //第16面
            {
            result.isPUA = true;
        }
        }
        return result;
    }
    
    
    


// HTMLエスケープのヘルパー
function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;');
}

// 文字数を計算して表示を更新する関数
// 絵文字を span.emoji で囲む関数
function wrapEmojis(text) {
    // 絵文字の範囲を指定した正規表現（Unicodeブロック）
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    return text.replace(emojiRegex, '<span class="emoji">$&</span>');
}

function updateCounts() {
    const previewEl = document.getElementById('preview');
    if (!previewEl) return;
    const inputText = textInput ? textInput.value : '';
    previewEl.innerHTML = wrapEmojis(inputText);
    // 1. バイト数 (UTF-8)
    const byteLength = new TextEncoder().encode(inputText).length;
    byteCountEl.textContent = byteLength;
    // 2. コードユニット数 (JavaScriptの .length)
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

    // 5. 異体字セレクタの検出（SVS/IVS個別表示）
    if (vsIndicatorEl) {
        const vs = countVariationSelectors(inputText);
        if (vs.svs === 0 && vs.ivs === 0) {
            vsIndicatorEl.textContent = '異体字セレクタは含まれていません';
        } else {
            let msg = [];
            if (vs.svs > 0) msg.push(`SVS（${vs.svs}個）`);
            if (vs.ivs > 0) msg.push(`IVS（${vs.ivs}個）`);
            vsIndicatorEl.textContent = `異体字セレクタを含みます：${msg.join(' / ')}`;
        }
    }

    // 6. Shift_JIS未収録の文字チェック
    if (shiftJisStatusEl) {
        const notInShiftJIS = findNonShiftJISChars(inputText);
        const enc = (typeof Encoding !== 'undefined') ? Encoding : null;
        
        // デバッグ情報をコンソールに出力
        console.debug('encoding-japanese ライブラリ状況:', {
            available: !!enc,
            hasConvert: enc && typeof enc.convert === 'function',
            hasStringToCode: enc && typeof enc.stringToCode === 'function',
            hasCodesToString: enc && typeof enc.codeToString === 'function',
            inputLength: inputText.length,
            nonShiftJISCount: notInShiftJIS.length
        });
        
        if (notInShiftJIS.length === 0) {
            const statusText = enc ? 
                'すべての文字がShift_JISに変換可能です ✓' : 
                'Shift_JISに収録されている可能性があります（簡易判定）';
            shiftJisStatusEl.textContent = statusText;
            shiftJisStatusEl.className = 'sjis-compatible';
        } else {
            // 表示は最大8文字までに抑える
            const sample = notInShiftJIS.slice(0, 8).join(' ');
            const hasMore = notInShiftJIS.length > 8;
            const libraryStatus = enc ? '' : '（簡易判定）';
            shiftJisStatusEl.textContent = `Shift_JIS非対応文字${libraryStatus}：${sample}${hasMore ? ` 他${notInShiftJIS.length - 8}文字` : ''}`;
            shiftJisStatusEl.className = 'sjis-incompatible';
        }
    }

    // 7. ハイライトプレビュー（#preview があれば、クラスタ単位で異体字セレクタ・非Shift_JISをハイライト表示）
    if (previewEl) {
        const normalized = (typeof inputText.normalize === 'function') ? inputText.normalize('NFC') : inputText;
        const units = splitIntoUnits(normalized);
        const nonSJIS = new Set(findNonShiftJISChars(inputText));
        let html = '';
        for (const u of units) {
            const classes = [];
            if (nonSJIS.has(u)) classes.push('highlight-nonsjis');
            const vs = countVariationSelectors(u);
            if (vs.svs > 0 || vs.ivs > 0) classes.push('highlight-vs');
            // レアな文字・特殊記号の検出
            const charType = detectCharacterType(u);

            const titleParts = [];
            if (classes.includes('highlight-nonsjis')) titleParts.push('Shift_JIS非対応');
            if (vs.svs > 0) titleParts.push(`異体字セレクタ（SVS）`);
            if (vs.ivs > 0) titleParts.push(`異体字セレクタ（IVS）`);
            if (charType.isPUA) titleParts.push('私用領域の文字（外字）');

            const title = titleParts.length ? titleParts.join(' / ') : '';
            html += `<span class="${classes.join(' ')}"${title ? ` title="${escapeHtml(title)}"` : ''}>${escapeHtml(u)}</span>`;
        }
        previewEl.innerHTML = html || '<span class="muted">(プレビューなし)</span>';
    }
}

// テキストエリアに入力があるたびに計算を実行
if (textInput) {
    textInput.addEventListener('input', updateCounts);
}

// ページ読み込み時にも一度計算を実行
// JekyllではDOMContentLoadedの方が安定することがあります
// → updateCountsはDOMContentLoadedで既に呼ばれているので不要