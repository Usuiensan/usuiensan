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

        resultDiv.innerHTML = ''; // 結果をクリア

        for (let i = 0; i < count; i++) {
            let randomString = generateRandomString(length, characters);

            if (hyphenateCheckbox.checked) {
                randomString = hyphenate(randomString);
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
