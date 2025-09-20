const __pwgen_init = () => {
    // 初期値セット: URLパラメータ > cookie > HTML
    // 必要なDOM要素を安全に初期化
    let lastGeneratedScore = null;
    const modeSelect = document.getElementById('mode');
    const hyphenateSelect = document.getElementById('hyphenateSelect');
    const hyphenLengthInput = document.getElementById('hyphenLength');
    const characterInfo = document.getElementById('character-info');
    const lengthInput = document.getElementById('length');
    const countInput = document.getElementById('count');
    const resultDiv = document.getElementById('result');
    const generateButton = document.getElementById('generate');
    // Cookie操作関数
    function setCookie(name, value, days = 365) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
    }
    function getCookie(name) {
        return document.cookie.split('; ').reduce((r, v) => {
            const parts = v.split('=');
            return parts[0] === name ? decodeURIComponent(parts[1]) : r;
        }, '');
    }
    // updateUlidHyphenWarning が定義されていない場合に備え、簡易実装を用意
    const updateUlidHyphenWarning = () => {
        const hyphenWarning = document.getElementById('hyphen-warning');
        if (!modeSelect || !hyphenLengthInput) return;
        if (modeSelect.value === 'uuid' || modeSelect.value === 'ulid') {
            hyphenLengthInput.disabled = true;
            if (hyphenWarning) hyphenWarning.style.display = '';
        } else {
            hyphenLengthInput.disabled = false;
            if (hyphenWarning) hyphenWarning.style.display = 'none';
        }
    };

    if (modeSelect) modeSelect.addEventListener('change', updateUlidHyphenWarning);
    if (hyphenateSelect) hyphenateSelect.addEventListener('change', updateUlidHyphenWarning);
    updateUlidHyphenWarning();

    // 保存済み Cookie から hyphenate の設定を復元する
    try {
        const savedHyphen = getCookie('pwgen_hyphenate');
        if (hyphenateSelect && (savedHyphen === 'true' || savedHyphen === 'false')) {
            hyphenateSelect.value = savedHyphen;
        }
    } catch (e) {
        // noop - cookie 読み込みに失敗しても初期表示はそのままにする
    }

    // UI の反映は script 後半で行う（updateStrengthDisplay はその後に定義され呼ばれます）


    // ランダム文字列を生成する関数
    const generateRandomString = (length, characters) => {
        let randomString = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            randomString += characters.charAt(randomIndex);
        }
        return randomString;
    };

    // 文字列を指定文字数ごとにハイフンで区切る関数（ULIDモードは5-5-4-4-4-4区切り）
    const hyphenate = (str) => {
        // ULIDモードは26文字固定: 5-5-4-4-4-4
        if (modeSelect.value === 'ulid' && str.length === 26) {
            return str.slice(0,5) + '-' +
                   str.slice(5,10) + '-' +
                   str.slice(10,14) + '-' +
                   str.slice(14,18) + '-' +
                   str.slice(18,22) + '-' +
                   str.slice(22,26);
        }
        // 通常は指定文字数ごと
        let len = 5;
        if (hyphenLengthInput && hyphenLengthInput.value) {
            len = Math.max(1, parseInt(hyphenLengthInput.value));
        }
        const regex = new RegExp(`.{1,${len}}`, 'g');
        return str.match(regex)?.join('-');
    };

    // モードに応じた説明を更新する関数
    const updateDescription = () => {
        const selectedMode = modeSelect.value;
        let characterSetDescription = "";

        switch (selectedMode) {
            case 'url':
                characterSetDescription = "使用文字: 0-9 a-z A-Z - _";
                break;
            case 'noConfuse':
                characterSetDescription = "使用文字: 0-9 ACFHKLMPXY";
                break;
            case 'numberOnly':
                characterSetDescription = "使用文字: 0-9";
                break;
            case 'numberAndLower':
                characterSetDescription = "使用文字: 0-9 a-z";
                break;
            case 'numberAndUpper':
                characterSetDescription = "使用文字: 0-9 A-Z";
                break;
            case 'numberAndAlphabet':
                characterSetDescription = "使用文字: 0-9 A-Z a-z(I,O,lを除く)";
                break;
            case 'numberAndAlphabetAndSymbols':
                characterSetDescription = "使用文字: 0-9 A-Z a-z(I,O,lを除く) -!?@#$%&=";
                break;
            case 'ulid':
                characterSetDescription = "使用文字: A-Z 2-7 (長さは26文字固定)";
                break;
            case 'uuid':
                characterSetDescription = "使用文字: 0-9 a-f (長さは36文字固定、8-4-4-4-12のハイフン区切り)";
                break;
            default:
                characterSetDescription = "";
        }

        // characterInfo が存在しない場合でも安全に動作するようにガード
        if (characterInfo) characterInfo.textContent = characterSetDescription;
    };

    // モード変更時のイベントリスナー
    modeSelect.addEventListener('change', updateDescription);
    updateDescription(); // 初期表示
    // 強度表示エリア
    const strengthInfo = document.getElementById('strength-info');
    let lastGeneratedSample = null;

    const estimateStrength = (sample) => {
        if (typeof zxcvbn === 'function') {
            try {
                const result = zxcvbn(sample);
                // score: 0-4
                const score = result.score;
                const crackTime = result.crack_times_display.offline_slow_hashing_1e4_per_second || result.crack_times_display.offline_fast_hashing_1e10_per_second || 'unknown';
                return { score, crackTime, feedback: result.feedback };
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    const updateStrengthDisplay = () => {
        if (!strengthInfo) return;
        // only show strength after an actual password was generated
        if (!lastGeneratedSample) {
            strengthInfo.textContent = 'パスワードを生成すると推定強度（zxcvbn）を表示します。';
            return;
        }

        // prefer the actual generated sample if available
        const sample = lastGeneratedSample;
        const est = estimateStrength(sample);
        if (!est) {
            strengthInfo.textContent = '強度を推定できません（zxcvbn が利用できません）。';
            return;
        }

        // display raw score
        const displayScore = est.score;
        lastGeneratedScore = est.score;

        const scoreDescriptions = {
            0: '非常に危険!!',
            1: '解読されやすく危険',
            2: 'やや解読されやすい',
            3: '良好',
            4: '非常に安全'
        };

        // render badge
        strengthInfo.innerHTML = '';
        const badge = document.createElement('div');
        badge.className = `strength-badge strength-${displayScore}`;
        const icon = document.createElement('span');
        icon.className = 'strength-icon';
        const text = document.createElement('span');
        text.textContent = `${scoreDescriptions[displayScore]}`;
        const small = document.createElement('small');
        small.style.marginLeft = '0.5rem';
        small.style.fontWeight = '400';
        small.style.fontSize = '0.85em';
        // 英語のクラッキング時間表現を日本語化
        const translateCrackTime = (ct) => {
            if (!ct || typeof ct !== 'string') return ct;
            // 英語の表現を日本語に変換
            // 特定のフレーズを先に置き換え
            ct = ct.replace(/less than a second/g, '1秒未満');
            ct = ct.replace(/less than a minute/g, '1分未満');
            ct = ct.replace(/less than an hour/g, '1時間未満');
            ct = ct.replace(/less than/g, '未満');
            ct = ct.replace(/about a second/g, '約1秒');
            ct = ct.replace(/about a minute/g, '約1分');
            ct = ct.replace(/about an hour/g, '約1時間');
            ct = ct.replace(/about/g, '約');
            ct = ct.replace(/(\d+) seconds?/g, '$1秒');
            ct = ct.replace(/(\d+) minutes?/g, '$1分');
            ct = ct.replace(/(\d+) hours?/g, '$1時間');
            ct = ct.replace(/(\d+) days?/g, '$1日');
            ct = ct.replace(/(\d+) weeks?/g, '$1週間');
            ct = ct.replace(/(\d+) months?/g, '$1ヶ月');
            ct = ct.replace(/(\d+) years?/g, '$1年');
            ct = ct.replace(/(\d+ )?centuries?/g, '数世紀');
            // "a second" -> "1秒"
            ct = ct.replace(/a second/g, '1秒');
            ct = ct.replace(/a minute/g, '1分');
            ct = ct.replace(/an hour/g, '1時間');
            ct = ct.replace(/a day/g, '1日');
            ct = ct.replace(/a week/g, '1週間');
            ct = ct.replace(/a month/g, '1ヶ月');
            ct = ct.replace(/a year/g, '1年');
            ct = ct.replace(/a century/g, '1世紀');
            return ct;
        };
        small.textContent = `解読にかかる時間: ${translateCrackTime(est.crackTime)}`;
        badge.appendChild(icon);
        badge.appendChild(text);
        badge.appendChild(small);
        strengthInfo.appendChild(badge);

        // translate feedback to Japanese (best-effort)
        const translateFeedback = (fb) => {
            if (!fb) return null;
            const mapWarning = {
                'This is a top-10 common password': 'トップ10に入るような一般的なパスワードです。避けてください。',
                'This is similar to a commonly used password': 'よく使われるパスワードと似ています。',
                'Dates are often easy to guess': '日付は推測されやすいです。',
                'Names and surnames are common': '人名は一般的で推測されやすいです。'
            };
            const mapSuggestions = [
                { en: 'Add another word or two. ', ja: 'もう一語か二語追加してください。' },
                { en: 'Use a longer passphrase', ja: '長いパスフレーズを使用してください。' },
                { en: 'Avoid repeated characters', ja: '繰り返し文字は避けてください。' },
                { en: 'Avoid sequences', ja: '連続した文字列は避けてください。' },
                { en: 'Uncommon words are better.', ja: '一般的でない単語を使うと良いです。' }
            ];
            const out = {};
            if (fb.warning) {
                let w = fb.warning;
                Object.keys(mapWarning).forEach(k => { if (w.indexOf(k) !== -1) w = w.replace(k, mapWarning[k]); });
                out.warning = w;
            }
            if (fb.suggestions && fb.suggestions.length) {
                out.suggestions = ["もっと文字数を長くしましょう。", "他のモードに切り替えて数字やアルファベットを組み合わせることも効果的です。"];
            }
            return out;
        };

        const translated = translateFeedback(est.feedback);
        if (translated && (translated.warning || (translated.suggestions && translated.suggestions.length))) {
            const fb = document.createElement('div');
            fb.style.marginTop = '6px';
            fb.style.color = '#444';
            if (translated.warning) {
                const w = document.createElement('div');
                w.textContent = translated.warning;
                fb.appendChild(w);
            }
            if (translated.suggestions && translated.suggestions.length) {
                const ul = document.createElement('ul');
                ul.style.margin = '6px 0 0 1rem';
                translated.suggestions.forEach(s => {
                    const li = document.createElement('li');
                    li.textContent = s;
                    ul.appendChild(li);
                });
                fb.appendChild(ul);
            }
            strengthInfo.appendChild(fb);
        }
    };
    // update strength when relevant inputs change
    [lengthInput, modeSelect, hyphenateSelect].forEach(el => {
        if (!el) return;
        el.addEventListener('change', updateStrengthDisplay);
        el.addEventListener('input', updateStrengthDisplay);
    });
    updateStrengthDisplay();
    // 初期表示後に自動生成＆コピー判定
    const autoGenerateAndCopyIfNeeded = () => {
        try {
            const params = new URLSearchParams(window.location.search);
            // ?auto=1 で自動生成をトリガー
            if (params.get('auto') === '1' && generateButton) {
                generateButton.click();
                // optionally copy first generated result after a short delay
                setTimeout(() => {
                    const firstCode = resultDiv?.querySelector('code')?.textContent;
                    if (firstCode) copyTextToClipboard(firstCode.replace(/-/g, ''));
                }, 200);
            }
        } catch (e) {
            // noop
        }
    };
    autoGenerateAndCopyIfNeeded();

    const createToast = (text) => {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = text;
        toast.classList.add('show');
        clearTimeout(createToast._timeout);
        createToast._timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2200);
    };

    // Crockford Base32 encoding for ULID timestamp (48-bit ms, 10 chars)
    const crockfordBase32Encode = (num, length = 10) => {
        const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
        let encoded = '';
        let value = num;
        for (let i = 0; i < length; i++) {
            encoded = alphabet[value % 32] + encoded;
            value = Math.floor(value / 32);
        }
        return encoded;
    };

    const updateTimestampDisplay = () => {
        const timestampDisplay = document.getElementById('timestamp-display');
        const currentTimestamp = new Date().toLocaleString();
        const ulidTimestamp = crockfordBase32Encode(Math.floor(Date.now()), 10);
        const unixTimestamp = Math.floor(Date.now() / 1000);

        // clear and build semantic structure
        timestampDisplay.innerHTML = '';

        const row1 = document.createElement('div');
        row1.className = 'ts-row';
        const labelNow = document.createElement('span');
        labelNow.className = 'ts-label';
        labelNow.textContent = '現在時刻:';
        const valNow = document.createElement('span');
        valNow.className = 'ts-value';
        valNow.id = 'current-timestamp';
        valNow.setAttribute('role', 'button');
        valNow.setAttribute('tabindex', '0');
        valNow.title = 'クリックで現在時刻をコピー';
        valNow.textContent = currentTimestamp;
        row1.appendChild(labelNow);
        row1.appendChild(valNow);

        const row2 = document.createElement('div');
        row2.className = 'ts-row';
        const labelUlid = document.createElement('span');
        labelUlid.className = 'ts-label';
        labelUlid.textContent = 'ULID上10桁:';
        const valUlid = document.createElement('span');
        valUlid.className = 'ts-value';
        valUlid.id = 'ulid-timestamp';
        valUlid.setAttribute('role', 'button');
        valUlid.setAttribute('tabindex', '0');
        valUlid.title = 'クリックでULID形式の時刻をコピー';
        valUlid.textContent = ulidTimestamp;

        const labelUnix = document.createElement('span');
        labelUnix.className = 'ts-label';
        labelUnix.textContent = 'UNIXタイム:';
        const valUnix = document.createElement('span');
        valUnix.className = 'ts-value';
        valUnix.id = 'unix-timestamp';
        valUnix.setAttribute('role', 'button');
        valUnix.setAttribute('tabindex', '0');
        valUnix.title = 'クリックでUNIXタイムスタンプをコピー';
        valUnix.textContent = unixTimestamp;

        row2.appendChild(labelUlid);
        row2.appendChild(valUlid);
        row2.appendChild(labelUnix);
        row2.appendChild(valUnix);

        const hint = document.createElement('div');
        hint.className = 'copy-hint';
        hint.textContent = '時刻をクリックするとコピーできます';

        timestampDisplay.appendChild(row1);
        timestampDisplay.appendChild(row2);
        timestampDisplay.appendChild(hint);

        const copyHandler = (value, textForToast) => {
            return () => {
                navigator.clipboard.writeText(String(value)).then(() => {
                    createToast(textForToast);
                }).catch(err => {
                    console.error('コピーに失敗しました: ', err);
                    createToast('コピーに失敗しました');
                });
            };
        };

        valUlid.addEventListener('click', copyHandler(ulidTimestamp, 'ULID形式の時刻をコピーしました'));
        valUnix.addEventListener('click', copyHandler(unixTimestamp, 'UNIXタイムスタンプをコピーしました'));
        valNow.addEventListener('click', copyHandler(currentTimestamp, '現在時刻をコピーしました'));

        // keyboard support
        valUlid.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); valUlid.click(); } });
        valUnix.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); valUnix.click(); } });
        valNow.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); valNow.click(); } });
    };

    setInterval(updateTimestampDisplay, 1000);

    // 生成ボタンのクリックイベント
    generateButton.addEventListener('click', () => {
        const length = parseInt(lengthInput.value);
        const count = parseInt(countInput.value);

        // 入力値をcookie保存
        setCookie('pwgen_length', lengthInput.value);
        setCookie('pwgen_count', countInput.value);
        setCookie('pwgen_mode', modeSelect.value);
        setCookie('pwgen_hyphenate', (hyphenateSelect && (hyphenateSelect.value === 'true')) ? 'true' : 'false');

        if (isNaN(length) || length <= 0) {
            alert('1以上の値を入力してください。');
            return;
        }
        if (isNaN(count) || count <= 0) {
            alert('1以上の値を入力してください。');
            return;
        }
        const selectedMode = modeSelect.value;
        let characters = '';
        resultDiv.innerHTML = '';
        for (let i = 0; i < count; i++) {

                let randomString;
                if (selectedMode === 'ulid') {
                    const timestamp = Math.floor(Date.now()).toString(32).toUpperCase().padStart(10, '0');
                    const randomPart = Array.from({ length: 16 }, () => {
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
                        return chars[Math.floor(Math.random() * chars.length)];
                    }).join('');
                    randomString = `${timestamp}${randomPart}`;
                    if (hyphenateSelect && hyphenateSelect.value === 'true') {
                        randomString = hyphenate(randomString);
                    }
                } else if (selectedMode === 'uuid') {
                    if (window.crypto && window.crypto.randomUUID) {
                        randomString = window.crypto.randomUUID();
                    } else {
                        // crypto.randomUUID が使えない場合の簡易実装
                        alert('このブラウザはUUIDv4の生成に完全には対応していません。生成されるUUIDは厳密には規格に準拠しない場合があります。');
                        randomString = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                            return v.toString(16);
                        });
                    }
                } else {
                    switch (selectedMode) {
                        case 'url':
                            characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
                            break;
                        case 'noConfuse':
                            characters = '0123456789ACFHKLMPXY';
                            break;
                        case 'numberOnly':
                            characters = '0123456789';
                            break;
                        case 'numberAndLower':
                            characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
                            break;
                        case 'numberAndUpper':
                            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                            break;
                        case 'numberAndAlphabet':
                            characters = '0123456789ACFHKLMPXYBDEJNQRSTUVWZabcdefghkmnpqrstuvwxyz';
                            break;
                        case 'numberAndAlphabetAndSymbols':
                            characters = '0123456789ACFHKLMPXYBDEJNQRSTUVWZabcdefghkmnpqrstuvwxyz-!?@#$%&=';
                            break;
                        default:
                            alert('モードを選択してください。');
                            return;
                    }
                    randomString = generateRandomString(length, characters);
                    if (hyphenateSelect && hyphenateSelect.value === 'true') {
                        randomString = hyphenate(randomString);
                    }
                }

            const codeBlockContainer = document.createElement('div');
            codeBlockContainer.classList.add('code-block-container');

            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = randomString;
            pre.appendChild(code);
            pre.setAttribute('title', 'クリックしてコピー');
            pre.addEventListener('click', () => {
                copyTextToClipboard(randomString);
            });
            codeBlockContainer.appendChild(pre);

            resultDiv.appendChild(codeBlockContainer);
        }
        // remember one generated sample for strength estimation
        if (resultDiv.querySelector('code')) {
            lastGeneratedSample = resultDiv.querySelector('code').textContent.replace(/-/g, '');
        }
        updateStrengthDisplay();
    });

    // クリップボードにテキストをコピーする関数
    const copyTextToClipboard = (text) => {
        if (lastGeneratedScore === 0 || lastGeneratedScore === 1) {
            // カスタムモーダルを表示
            showDangerModal(lastGeneratedScore, text);
            return; // モーダルで処理を継続
        }
        performCopy(text);
    };

    // コピー実行関数
    const performCopy = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    createToast('クリップボードにコピーしました！');
                })
                .catch(err => {
                    console.error('クリップボード APIでのコピーに失敗しました: ', err);
                    fallbackCopyTextToClipboard(text);
                });
        } else {
            fallbackCopyTextToClipboard(text);
        }
    };

    // 危険モーダルを表示
    const showDangerModal = (score, text) => {
        const modal = document.getElementById('danger-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const regenerateBtn = document.getElementById('modal-regenerate');
        const proceedBtn = document.getElementById('modal-proceed');

        if (score === 0) {
            message.innerHTML = 'このパスワードは非常に短く、推測されやすい文字列です。<br>ハッカーはこのようなパスワードを<b>瞬時に解読します。</b><br>本当にこのパスワードを使用しますか？';
        } else if (score === 1) {
            message.innerHTML = 'このパスワードは短く、わずかな時間でハッカーに解読されるおそれがあります。<br>本当にこのパスワードを使用しますか？';
        }

        // ボタンイベント
        const handleRegenerate = () => {
            hideDangerModal();
            generateButton.click(); // 新しいパスワードを生成
        };

        const handleProceed = () => {
            hideDangerModal();
            performCopy(text);
        };

        const handleOverlayClick = (e) => {
            if (e.target === modal) {
                hideDangerModal();
                createToast('コピーをキャンセルしました。');
            }
        };

        regenerateBtn.onclick = handleRegenerate;
        proceedBtn.onclick = handleProceed;
        modal.onclick = handleOverlayClick;

        modal.style.display = 'flex';
    };

    // 危険モーダルを非表示
    const hideDangerModal = () => {
        const modal = document.getElementById('danger-modal');
        modal.style.display = 'none';
    };

    // 古いブラウザ用のコピー関数
    const fallbackCopyTextToClipboard = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.width = "2em";
        textArea.style.height = "2em";
        textArea.style.padding = "0";
        textArea.style.border = "none";
        textArea.style.outline = "none";
        textArea.style.boxShadow = "none";
        textArea.style.background = "transparent";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            createToast('クリップボードにコピーしました（互換モード）');
        } catch (err) {
            console.error('コピーに失敗しました: ', err);
            createToast('コピーに失敗しました。');
        }

        document.body.removeChild(textArea);
    };
};

// If the script is loaded after DOMContentLoaded fired, run immediately.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', __pwgen_init);
} else {
    __pwgen_init();
}
