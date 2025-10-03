// DOM要素を取得
const textInput = document.getElementById('textInput');
const byteCountEl = document.getElementById('byteCount');
const codeUnitCountEl = document.getElementById('codeUnitCount');
const codePointCountEl = document.getElementById('codePointCount');
const graphemeCountEl = document.getElementById('graphemeCount');
const previewEl = document.getElementById('preview');

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

// 文字のタイプを検出する関数（レア文字、古代文字、特殊記号など）
function detectCharacterType(char) {
    const result = {
        isRare: false,
        isAncient: false,
        isSymbol: false,
        isPUA: false
    };
    
    for (const ch of char) {
        const cp = ch.codePointAt(0);
        
        // 私用領域 (Private Use Area)
        if ((cp >= 0xE000 && cp <= 0xF8FF) || 
            (cp >= 0xF0000 && cp <= 0xFFFFD) || 
            (cp >= 0x100000 && cp <= 0x10FFFD)) {
            result.isPUA = true;
        }
        
        // 古代文字系（例: リニアB、楔形文字、象形文字など）
        if ((cp >= 0x10000 && cp <= 0x1007F) ||  // Linear B Syllabary
            (cp >= 0x10080 && cp <= 0x100FF) ||  // Linear B Ideograms
            (cp >= 0x10100 && cp <= 0x1013F) ||  // Aegean Numbers
            (cp >= 0x10140 && cp <= 0x1018F) ||  // Ancient Greek Numbers
            (cp >= 0x10190 && cp <= 0x101CF) ||  // Ancient Symbols
            (cp >= 0x101D0 && cp <= 0x101FF) ||  // Phaistos Disc
            (cp >= 0x10280 && cp <= 0x1029F) ||  // Lycian
            (cp >= 0x102A0 && cp <= 0x102DF) ||  // Carian
            (cp >= 0x12000 && cp <= 0x123FF) ||  // Cuneiform
            (cp >= 0x13000 && cp <= 0x1342F) ||  // Egyptian Hieroglyphs
            (cp >= 0x14400 && cp <= 0x1467F)) {  // Anatolian Hieroglyphs
            result.isAncient = true;
        }
        
        // 特殊記号・装飾文字
        if ((cp >= 0x2000 && cp <= 0x206F) ||   // General Punctuation
            (cp >= 0x2070 && cp <= 0x209F) ||   // Superscripts and Subscripts
            (cp >= 0x20A0 && cp <= 0x20CF) ||   // Currency Symbols
            (cp >= 0x20D0 && cp <= 0x20FF) ||   // Combining Diacritical Marks for Symbols
            (cp >= 0x2100 && cp <= 0x214F) ||   // Letterlike Symbols
            (cp >= 0x2150 && cp <= 0x218F) ||   // Number Forms
            (cp >= 0x2190 && cp <= 0x21FF) ||   // Arrows
            (cp >= 0x2200 && cp <= 0x22FF) ||   // Mathematical Operators
            (cp >= 0x2300 && cp <= 0x23FF) ||   // Miscellaneous Technical
            (cp >= 0x2400 && cp <= 0x243F) ||   // Control Pictures
            (cp >= 0x2440 && cp <= 0x245F) ||   // Optical Character Recognition
            (cp >= 0x2460 && cp <= 0x24FF) ||   // Enclosed Alphanumerics
            (cp >= 0x2500 && cp <= 0x257F) ||   // Box Drawing
            (cp >= 0x2580 && cp <= 0x259F) ||   // Block Elements
            (cp >= 0x25A0 && cp <= 0x25FF) ||   // Geometric Shapes
            (cp >= 0x2600 && cp <= 0x26FF) ||   // Miscellaneous Symbols
            (cp >= 0x2700 && cp <= 0x27BF) ||   // Dingbats
            (cp >= 0x27C0 && cp <= 0x27EF) ||   // Miscellaneous Mathematical Symbols-A
            (cp >= 0x27F0 && cp <= 0x27FF) ||   // Supplemental Arrows-A
            (cp >= 0x2800 && cp <= 0x28FF) ||   // Braille Patterns
            (cp >= 0x2900 && cp <= 0x297F) ||   // Supplemental Arrows-B
            (cp >= 0x2980 && cp <= 0x29FF) ||   // Miscellaneous Mathematical Symbols-B
            (cp >= 0x2A00 && cp <= 0x2AFF) ||   // Supplemental Mathematical Operators
            (cp >= 0x2B00 && cp <= 0x2BFF)) {   // Miscellaneous Symbols and Arrows
            result.isSymbol = true;
        }
        
        // レア文字（高いコードポイント、使用頻度の低い文字）
        if (cp > 0x10000 || 
            (cp >= 0xA000 && cp <= 0xA48F) ||   // Yi Syllables
            (cp >= 0xA490 && cp <= 0xA4CF) ||   // Yi Radicals
            (cp >= 0xA700 && cp <= 0xA71F) ||   // Modifier Tone Letters
            (cp >= 0xA720 && cp <= 0xA7FF) ||   // Latin Extended-D
            (cp >= 0xA800 && cp <= 0xA82F) ||   // Syloti Nagri
            (cp >= 0xA830 && cp <= 0xA83F)) {   // Common Indic Number Forms
            result.isRare = true;
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
    // 絵文字の正規表現（簡易版）
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji}\u200D\p{Emoji})+/gu;
    return text.replace(emojiRegex, '<span class="emoji">$&</span>');
}

function updateCounts() {
    const inputText = textInput.value;

    // preview を更新（絵文字を可愛く）
    previewEl.innerHTML = wrapEmojis(inputText);

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
            
            // レアな文字・特殊記号の検出
            const charType = detectCharacterType(u);
            if (charType.isRare) classes.push('rare-chars');
            if (charType.isAncient) classes.push('ancient-scripts');
            if (charType.isSymbol) classes.push('special-symbols');
            if (charType.isPUA) classes.push('unicode-pua');
            
            const titleParts = [];
            if (classes.includes('highlight-nonsjis')) titleParts.push('Shift_JIS未収録の可能性');
            if (classes.includes('highlight-vs')) titleParts.push('異体字セレクタを含む');
            if (charType.isRare) titleParts.push('レア文字');
            if (charType.isAncient) titleParts.push('古代文字');
            if (charType.isSymbol) titleParts.push('特殊記号');
            if (charType.isPUA) titleParts.push('私用領域');
            
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