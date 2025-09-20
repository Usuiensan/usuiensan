document.addEventListener('DOMContentLoaded', () => {
    // 初期値セット: URLパラメータ > cookie > HTML
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

    // 初期値セット: URLパラメータ > cookie > HTML
    const urlParams = new URLSearchParams(window.location.search);
    const paramLength = urlParams.get('length');
    const paramCount = urlParams.get('count');
    const paramMode = urlParams.get('mode');
    const paramHyphenate = urlParams.get('hyphenate');
    const cookieLength = getCookie('pwgen_length');
    const cookieCount = getCookie('pwgen_count');
    const cookieMode = getCookie('pwgen_mode');
    const cookieHyphenate = getCookie('pwgen_hyphenate');

    // URLパラメータが存在する場合は自動生成＆コピー
    const hasUrlParams = paramLength !== null || paramCount !== null || paramMode !== null || paramHyphenate !== null;
    function autoGenerateAndCopyIfNeeded() {
        if (hasUrlParams) {
            generateButton.click();
            // 生成結果が1件なら自動コピー
            setTimeout(() => {
                const codeBlocks = document.querySelectorAll('.code-block-container code');
                if (codeBlocks.length === 1) {
                    copyTextToClipboard(codeBlocks[0].textContent);
                }
            }, 100); // DOM更新待ち
        }
    }

    const lengthInput = document.getElementById('length');
    const countInput = document.getElementById('count');
    const modeSelect = document.getElementById('mode');
    const hyphenateCheckbox = document.getElementById('hyphenate');
    const hyphenLengthInput = document.getElementById('hyphenLength');

    if (paramLength !== null) {
        lengthInput.value = paramLength;
    } else if (cookieLength) {
        lengthInput.value = cookieLength;
    }
    if (paramCount !== null) {
        countInput.value = paramCount;
    } else if (cookieCount) {
        countInput.value = cookieCount;
    }
    if (paramMode !== null) {
        modeSelect.value = paramMode;
    } else if (cookieMode) {
        modeSelect.value = cookieMode;
    }
    if (paramHyphenate !== null) {
        hyphenateCheckbox.checked = paramHyphenate === 'true' || paramHyphenate === '1';
    } else if (cookieHyphenate) {
        hyphenateCheckbox.checked = cookieHyphenate === 'true';
    }
    const generateButton = document.getElementById('generate');
    const resultDiv = document.getElementById('result');
    const characterInfo = document.getElementById('character-info');
    const hyphenWarning = document.getElementById('hyphen-warning');

    function updateUlidHyphenWarning() {
        if (modeSelect.value === 'ulid' && hyphenateCheckbox.checked) {
            hyphenWarning.innerHTML = 'ハイフン区切りはULIDの規格に定められていません。<br>単なるランダムな文字列としてご利用ください。';
            hyphenWarning.style.display = '';
            } else if (modeSelect.value === 'uuid' && hyphenateCheckbox.checked) {
                hyphenWarning.innerHTML = '※ UUIDモードでは区切り文字数は指定できません'; // 本文と同じ色で表示
                hyphenWarning.style.display = '';
        } else {
            hyphenWarning.style.display = 'none';
        }
    }
    modeSelect.addEventListener('change', updateUlidHyphenWarning);
    hyphenateCheckbox.addEventListener('change', updateUlidHyphenWarning);
    updateUlidHyphenWarning();

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

        characterInfo.textContent = characterSetDescription;
    };

    // モード変更時のイベントリスナー
    modeSelect.addEventListener('change', updateDescription);
    updateDescription(); // 初期表示
    // 初期表示後に自動生成＆コピー判定
    autoGenerateAndCopyIfNeeded();

    const updateTimestampDisplay = () => {
        const timestampDisplay = document.getElementById('timestamp-display');
        const currentTimestamp = new Date().toLocaleString();
        const ulidTimestamp = Math.floor(Date.now()).toString(32).toUpperCase().padStart(10, '0');
        const unixTimestamp = Math.floor(Date.now() / 1000);

        timestampDisplay.innerHTML = `現在時刻: ${currentTimestamp}<br>ULID上10桁: <span id='ulid-timestamp' style='font-family: "OCR B", monospace; cursor: pointer;'>${ulidTimestamp}</span><br>UNIXタイムスタンプ: <span id='unix-timestamp' style='font-family: monospace; cursor: pointer;'>${unixTimestamp}</span>`;

        const ulidTimestampElement = document.getElementById('ulid-timestamp');
        ulidTimestampElement.addEventListener('click', () => {
            navigator.clipboard.writeText(ulidTimestamp).then(() => {
                alert('ULID形式の時刻をコピーしました！');
            }).catch(err => {
                console.error('コピーに失敗しました: ', err);
            });
        });
// UNIXタイムスタンプのクリックでコピー
        const unixTimestampElement = document.getElementById('unix-timestamp');
        unixTimestampElement.addEventListener('click', () => {
            navigator.clipboard.writeText(unixTimestamp.toString()).then(() => {
                alert('UNIXタイムスタンプをコピーしました！');
            }).catch(err => {
                console.error('コピーに失敗しました: ', err);
            });
        });
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
        setCookie('pwgen_hyphenate', hyphenateCheckbox.checked);

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
                    if (hyphenateCheckbox.checked) {
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
                    if (hyphenateCheckbox.checked) {
                        randomString = hyphenate(randomString);
                    }
                }

            const codeBlockContainer = document.createElement('div');
            codeBlockContainer.classList.add('code-block-container');

            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = randomString;
            pre.appendChild(code);
            codeBlockContainer.appendChild(pre);

            const copyButtonElement = document.createElement('button');
            copyButtonElement.classList.add('copy-button');
            copyButtonElement.innerHTML = '<i class="fas fa-copy"></i>';
            copyButtonElement.addEventListener('click', (event) => {
                event.stopPropagation();
                copyTextToClipboard(randomString);
            });
            codeBlockContainer.appendChild(copyButtonElement);

            resultDiv.appendChild(codeBlockContainer);
        }
    });

    // クリップボードにテキストをコピーする関数
    const copyTextToClipboard = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    alert('クリップボードにコピーしました！');
                })
                .catch(err => {
                    console.error('クリップボード APIでのコピーに失敗しました: ', err);
                    fallbackCopyTextToClipboard(text);
                });
        } else {
            fallbackCopyTextToClipboard(text);
        }
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
            alert('クリップボードにコピーしました（互換モード）');
        } catch (err) {
            console.error('コピーに失敗しました: ', err);
            alert('コピーに失敗しました。');
        }

        document.body.removeChild(textArea);
    };
});
