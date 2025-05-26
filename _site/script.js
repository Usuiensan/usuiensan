document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generate');
    const lengthInput = document.getElementById('length');
    const resultDiv = document.getElementById('result');
    const modeSelect = document.getElementById('mode');
    const characterInfo = document.getElementById('character-info');
    const countInput = document.getElementById('count');
    const hyphenateCheckbox = document.getElementById('hyphenate');

    const generateRandomString = (length, characters) => {
        let randomString = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            randomString += characters.charAt(randomIndex);
        }
        return randomString;
    };

    const hyphenate = (str) => {
        const regex = /.{5}/g;
        return str.match(regex)?.join('-') + (str.length % 5 !== 0 ? '-' + str.substring(str.length - (str.length % 5)) : '');
    };

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
            case 'nomberAndApper':
                characterSetDescription = "使用文字: 0-9 A-Z";
                break;
            case 'numberAndAlphabet':
                characterSetDescription = "使用文字: 0-9 A-Z a-z(紛らわしい文字を除く)";
                break;
            case 'numberAndAlphabetAndSymbols':
                characterSetDescription = "使用文字: 0-9 A-Z a-z(紛らわしい文字を除く) -!?@#$%&=";
                break;
            default:
                characterSetDescription = "";
        }

        characterInfo.textContent = characterSetDescription;
    };

    modeSelect.addEventListener('change', updateDescription);
    updateDescription(); // 初期表示

    modeSelect.addEventListener('change', () => {
        if (modeSelect.value === 'ulid') {
            hyphenateCheckbox.disabled = true;
            hyphenateCheckbox.checked = false;
        } else {
            hyphenateCheckbox.disabled = false;
        }
    });

    const updateTimestampDisplay = () => {
        const timestampDisplay = document.getElementById('timestamp-display');
        const currentTimestamp = new Date().toLocaleString();
        const ulidTimestamp = Math.floor(Date.now()).toString(32).toUpperCase().padStart(10, '0');
        const localNow = new Date();
        // const excelTimestamp = (localNow - new Date('1899-12-30')) / (1000 * 60 * 60 * 24);
        // const excelDate = Math.floor(excelTimestamp);
        // const excelTime = excelTimestamp - excelDate;
        timestampDisplay.innerHTML = `現在時刻: ${currentTimestamp}<br>ULID上10桁: <span id='ulid-timestamp' style='font-family: "OCR B", monospace; cursor: pointer;'>${ulidTimestamp}</span></span>`;
//<br>Excel形式: <span id='excel-date' style='font-family: "OCR B", monospace; cursor: pointer;'>${excelDate}</span><br>Excel時刻部: <span id='excel-time' style='font-family: "OCR B", monospace; cursor: pointer;'>${excelTime.toFixed(6)}</span><br>Excel形式全体: <span id='excel-full' style='font-family: "OCR B", monospace; cursor: pointer;'>${excelDate + excelTime.toFixed(6).substring(1)}
        const ulidTimestampElement = document.getElementById('ulid-timestamp');
        ulidTimestampElement.addEventListener('click', () => {
            navigator.clipboard.writeText(ulidTimestamp).then(() => {
                alert('ULID形式の時刻をコピーしました！');
            }).catch(err => {
                console.error('コピーに失敗しました: ', err);
            });
        });

        const excelDateElement = document.getElementById('excel-date');
        const excelTimeElement = document.getElementById('excel-time');

        excelDateElement.addEventListener('click', () => {
            navigator.clipboard.writeText(excelDate).then(() => {
                alert('Excel形式の日付をコピーしました！');
            }).catch(err => {
                console.error('コピーに失敗しました: ', err);
            });
        });

        excelTimeElement.addEventListener('click', () => {
            navigator.clipboard.writeText(excelTime.toFixed(6)).then(() => {
                alert('Excel形式の時刻部をコピーしました！');
            }).catch(err => {
                console.error('コピーに失敗しました: ', err);
            });
        });

        const excelFullElement = document.getElementById('excel-full');
        excelFullElement.addEventListener('click', () => {
            navigator.clipboard.writeText(excelDate + excelTime.toFixed(6).substring(1)).then(() => {
                alert('Excel形式全体をコピーしました！');
            }).catch(err => {
                console.error('コピーに失敗しました: ', err);
            });
        });
    };

    setInterval(updateTimestampDisplay, 1000);

    // const generateULID = () => {
    //     const timestamp = Math.floor(Date.now() / 1000).toString(36).toUpperCase().padStart(10, '0');
    //     const randomPart = Array.from({ length: 16 }, () => {
    //         const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    //         return chars[Math.floor(Math.random() * chars.length)];
    //     }).join('');
    //     return timestamp + randomPart;
    // };

    generateButton.addEventListener('click', () => {
        const length = parseInt(lengthInput.value);
        const count = parseInt(countInput.value);

        if (isNaN(length) || length <= 0) {
            alert('有効な文字数を入力してください。');
            return;
        }

        if (isNaN(count) || count <= 0) {
            alert('有効な生成回数を入力してください。');
            return;
        }

        const selectedMode = modeSelect.value;
        let characters = '';

        resultDiv.innerHTML = ''; // 結果をクリア

        for (let i = 0; i < count; i++) {
            let randomString;

            if (selectedMode === 'ulid') {
                const timestamp = Math.floor(Date.now()).toString(32).toUpperCase().padStart(10, '0');
                const randomPart = Array.from({ length: 16 }, () => {
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join('');
                randomString = `${timestamp}${randomPart}`;
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
                    case 'nomberAndApper':
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

    const copyTextToClipboard = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    alert('クリップボードにコピーしました！');
                })
                .catch(err => {
                    console.error('コピーに失敗しました: ', err);
                    fallbackCopyTextToClipboard(text);
                });
        } else {
            fallbackCopyTextToClipboard(text);
        }
    };

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
            const successful = document.execCommand('copy');
            const msg = successful ? 'successful' : 'unsuccessful';
            console.log('Fallback: Copying text command was ' + msg);
            alert('クリップボードにコピーしました！');
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
            alert('コピーに失敗しました。');
        }

        document.body.removeChild(textArea);
    };
});
