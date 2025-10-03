document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const jpPlateDiv = document.getElementById('jpPlate');
    const vehicleTypeDiv = document.getElementById('vehicleType');
    const intPlateDiv = document.getElementById('intPlate');
    const copyRomajiBtn = document.getElementById('copyRomajiBtn');
    const romajiPlateDiv = document.getElementById('romajiPlate');
    const noAlphabetMode = document.getElementById('noAlphabetMode');
    const areaModeRadios = document.querySelectorAll('input[name="areaMode"]');
    const areaSelect = document.getElementById('areaSelect');
    const vehicleModeRadios = document.querySelectorAll('input[name="vehicleMode"]');
    const vehicleSelect = document.getElementById('vehicleSelect');
    const separatorRadios = document.querySelectorAll('input[name="separator"]');

    let plateData = null;
    let romajiPlateCopy = '';
    
    // ひらがなからローマ字への変換マップ
    const hiraganaToRomaji = {
        'あ': 'A', 'い': 'I', 'う': 'U', 'え': 'E', 'お': 'O',
        'か': 'KA', 'き': 'KI', 'く': 'KU', 'け': 'KE', 'こ': 'KO',
        'さ': 'SA', 'し': 'SHI', 'す': 'SU', 'せ': 'SE', 'そ': 'SO',
        'た': 'TA', 'ち': 'CHI', 'つ': 'TSU', 'て': 'TE', 'と': 'TO',
        'な': 'NA', 'に': 'NI', 'ぬ': 'NU', 'ね': 'NE', 'の': 'NO',
        'は': 'HA', 'ひ': 'HI', 'ふ': 'FU', 'へ': 'HE', 'ほ': 'HO',
        'ま': 'MA', 'み': 'MI', 'む': 'MU', 'め': 'ME', 'も': 'MO',
        'や': 'YA', 'ゆ': 'YU', 'よ': 'YO',
        'ら': 'RA', 'り': 'RI', 'る': 'RU', 'れ': 'RE', 'ろ': 'RO',
        'わ': 'WA', 'を': 'WO', 'ん': 'N'
    };

    // クッキーから設定を読み込む関数
    function loadSettingsFromCookie() {
        const cookie = document.cookie.split(';').find(c => c.trim().startsWith('plateSettings='));
        if (cookie) {
            const settings = JSON.parse(cookie.split('=')[1]);
            if (settings.noAlphabet) noAlphabetMode.checked = settings.noAlphabet;
            if (settings.areaMode) document.querySelector(`input[name="areaMode"][value="${settings.areaMode}"]`).checked = true;
            if (settings.vehicleMode) document.querySelector(`input[name="vehicleMode"][value="${settings.vehicleMode}"]`).checked = true;
            if (settings.separator) document.querySelector(`input[name="separator"][value="${settings.separator}"]`).checked = true;
            if (settings.selectedArea) areaSelect.value = settings.selectedArea;
            if (settings.selectedVehicle) vehicleSelect.value = settings.selectedVehicle;
        }
    }

    // 設定をクッキーに保存する関数
    function saveSettingsToCookie() {
        const settings = {
            noAlphabet: noAlphabetMode.checked,
            areaMode: document.querySelector('input[name="areaMode"]:checked').value,
            vehicleMode: document.querySelector('input[name="vehicleMode"]:checked').value,
            separator: document.querySelector('input[name="separator"]:checked').value,
            selectedArea: areaSelect.value,
            selectedVehicle: vehicleSelect.value
        };
        document.cookie = `plateSettings=${JSON.stringify(settings)}; max-age=31536000; path=/`;
    }

    // JSONファイルを読み込む関数
    async function loadData() {
        try {
            const response = await fetch('assets/json/plate-data.json');
            plateData = await response.json();
            generateBtn.disabled = false;
            setupDropdowns();
            loadSettingsFromCookie();
        } catch (error) {
            console.error('Error loading plate-data.json:', error);
            jpPlateDiv.textContent = 'データファイルの読み込みに失敗しました。';
            intPlateDiv.textContent = 'データファイルの読み込みに失敗しました。';
            generateBtn.disabled = true;
        }
    }

    // ドロップダウンを設定する関数
    function setupDropdowns() {
        // 地域ドロップダウン
        areaSelect.innerHTML = '';
        Object.keys(plateData.areas).forEach(area => {
            const option = document.createElement('option');
            option.value = area;
            option.textContent = `${area} - ${plateData.areas[area].code}`;
            areaSelect.appendChild(option);
        });

        // 車種ドロップダウン
        vehicleSelect.innerHTML = '';
        Object.entries(plateData.classification.first_digit).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${key}: ${value}`;
            vehicleSelect.appendChild(option);
        });

        // ラジオボタンのイベントリスナー
        areaModeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                areaSelect.disabled = radio.value !== 'manual';
                saveSettingsToCookie();
            });
        });
        vehicleModeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                vehicleSelect.disabled = radio.value !== 'manual';
                saveSettingsToCookie();
            });
        });
        separatorRadios.forEach(radio => {
            radio.addEventListener('change', saveSettingsToCookie);
        });
        noAlphabetMode.addEventListener('change', saveSettingsToCookie);
        areaSelect.addEventListener('change', saveSettingsToCookie);
        vehicleSelect.addEventListener('change', saveSettingsToCookie);
    }

    // ナンバープレートを生成する関数
    function generatePlate() {
        if (!plateData) return;

        // 区切り文字を取得
        const separator = document.querySelector('input[name="separator"]:checked').value === 'space' ? ' ' : '-';

        // 地域を選択
        let selectedAreaKey;
        if (document.querySelector('input[name="areaMode"]:checked').value === 'manual') {
            selectedAreaKey = areaSelect.value;
        } else {
            const areas = Object.keys(plateData.areas);
            selectedAreaKey = areas[Math.floor(Math.random() * areas.length)];
        }
        const areaInfo = plateData.areas[selectedAreaKey];
        const intAreaCode = areaInfo.code;

        // 日本の地域名を整形（括弧部分を完全に削除）
        const jpAreaName = selectedAreaKey.replace(/（.*?）|\(.*?\)/g, '');
        
        // 都道府県と運輸支局名を取得
        const prefecture = areaInfo.prefecture;
        const plateRomaji = areaInfo.romaji || '';
        const codeExplanation = areaInfo.codeExplanation || '';

        // 分類番号を生成
        let availableSecondDigits = plateData.classification.second_digit;
        let availableThirdDigits = plateData.classification.third_digit;
        if (noAlphabetMode.checked) {
            availableSecondDigits = availableSecondDigits.filter(d => /^\d$/.test(d));
            availableThirdDigits = availableThirdDigits.filter(d => /^\d$/.test(d));
        }

        let firstDigit;
        if (document.querySelector('input[name="vehicleMode"]:checked').value === 'manual') {
            firstDigit = vehicleSelect.value;
        } else {
            firstDigit = randomItem(Object.keys(plateData.classification.first_digit));
        }

        // 軽自動車の場合、secondDigit をフィルタ
        const isKeiFirst = ['4', '5', '7', '8'].includes(firstDigit);
        if (isKeiFirst) {
            let keiSecondDigits = ['8', '9', 'A', 'C', 'F', 'H', 'K', 'L', 'M', 'P', 'X', 'Y'];
            if (noAlphabetMode.checked) {
                keiSecondDigits = keiSecondDigits.filter(d => /^\d$/.test(d));
            }
            availableSecondDigits = availableSecondDigits.filter(d => keiSecondDigits.includes(d));
        }

        const secondDigit = randomItem(availableSecondDigits);
        const thirdDigit = randomItem(availableThirdDigits);

        const classificationNumber = `${firstDigit}${secondDigit}${thirdDigit}`;
        // console.log(`Generated classification number: ${classificationNumber}`);
        //分類番号に応じてプレートの種類を決定
        const isKei = isKeiFirst && ['8', '9', 'A', 'C', 'F', 'H', 'K', 'L', 'M', 'P', 'X', 'Y'].includes(secondDigit);
        const hiraganaSet = isKei ? plateData.hiraganas.kei : plateData.hiraganas.normal;
        // 用途（自家用・事業用・レンタカー）をランダムに選択
        const hiraganaType = randomItem(Object.keys(hiraganaSet));
        // 選択された用途から、ランダムにひらがなを選ぶ
        const randomHiragana = randomItem(hiraganaSet[hiraganaType]);
        // console.log(`Selected hiragana: ${randomHiragana} for type: ${hiraganaType}`);
        let plateTypeClass;
        if (isKei) {
            if (hiraganaType === "自家用") {
                plateTypeClass = 'kei-private';
            } else if (hiraganaType === "事業用") {
                plateTypeClass = 'kei-business';
            } else {
                plateTypeClass = 'kei-private'; // レンタカーは自家用と同じ
            }
        } else {
            if (hiraganaType === "自家用") {
                plateTypeClass = 'normal-private';
            } else if (hiraganaType === "事業用") {
                plateTypeClass = 'normal-business';
            } else {
                plateTypeClass = 'normal-private'; // レンタカーは自家用と同じ
            }
        }
        // console.log(`Plate type: ${plateTypeClass}`);
        // 一連指定番号を生成
        let serialNumber;
        do {
            const num = Math.floor(Math.random() * 9999) + 1;
            const paddedNum = num.toString().padStart(4, '0');
            const lastTwoDigits = paddedNum.slice(-2);
            // 欠番ルール42,49,13を避ける
            if (lastTwoDigits !== '42' && lastTwoDigits !== '49' && lastTwoDigits !== '13') {
                serialNumber = num;
                break;
            }
        } while (true);

        // 一連指定番号の表示形式を整形
        let formattedNumber;
        if (serialNumber < 1000) {
            // 4桁にパディングしてから、先頭のゼロのみを点に変換
            const paddedNum = serialNumber.toString().padStart(4, '0');
            formattedNumber = paddedNum.replace(/^0+/, (match) => '・'.repeat(match.length));
        } else {
            formattedNumber = `${serialNumber.toString().slice(0, 2)}-${serialNumber.toString().slice(2)}`;
        }
        
        // 日本のナンバープレート（本物の配置：地域 分類番号（改行）ひらがな 一連番号）
        const jpPlateDisplay = `
            <div class="plate-line-1">
                <span class="area-name">${jpAreaName}</span>
                <span class="classification-number">${classificationNumber}</span>
            </div>
            <div class="plate-line-2">
                <span class="hiragana">${randomHiragana}</span>
                <span class="serial-number">${formattedNumber}</span>
            </div>
        `;
        const jpPlateCopy = `${jpAreaName}${separator}${classificationNumber}${separator}${randomHiragana}${separator}${serialNumber}`;
        console.log(`${jpAreaName} ${classificationNumber} ${randomHiragana} ${serialNumber}`);
        const jpPlateContent = jpPlateDiv.querySelector('.plate-content');
        jpPlateContent.innerHTML = jpPlateDisplay;
        
        // プレートの種類に応じたクラスを適用
        jpPlateDiv.className = `license-plate japan-plate ${plateTypeClass}`;
        jpPlateDiv.onclick = () => copyToClipboard(jpPlateCopy, jpPlateDiv);

        // 車種・用途を表示
        const vehicleType = plateData.classification.first_digit[firstDigit];
        const hiraganaPurpose = hiraganaType;
        // 管轄情報を抽出（括弧内の情報）
        const jurisdictionMatch = selectedAreaKey.match(/[（\(]([^）\)]*)[）\)]/);
        const jurisdiction = jurisdictionMatch ? jurisdictionMatch[1] : '';
        
        vehicleTypeDiv.innerHTML = `
            <table class="vehicle-info-table">
                <tr>
                    <th>項目</th>
                    <th>内容</th>
                </tr>
                <tr>
                    <td>車種</td>
                    <td>${vehicleType}</td>
                </tr>
                <tr>
                    <td>用途</td>
                    <td>${hiraganaPurpose}</td>
                </tr>
                <tr>
                    <td>都道府県</td>
                    <td>${prefecture}</td>
                </tr>
                <tr>
                    <td>コード説明</td>
                    <td>${codeExplanation}</td>
                </tr>
            </table>
        `;
        
        // 国際ナンバープレート（ひらがなをローマ字に変換）
        const romajiLetter = hiraganaToRomaji[randomHiragana] || randomHiragana;
        // 国際ナンバープレートでは国際コードを表示
        const intPlateDisplay = `
            <div class="plate-line-1">
                <span class="area-name">${intAreaCode}</span>
                <span class="classification-number">${classificationNumber}</span>
            </div>
            <div class="plate-line-2">
                <span class="hiragana">${romajiLetter}</span>
                <span class="serial-number">${serialNumber}</span>
            </div>
        `;
        const intPlateCopy = `${intAreaCode}${separator}${classificationNumber}${separator}${romajiLetter}${separator}${serialNumber}`;
        // console.log(`${intAreaCode} ${classificationNumber} ${romajiLetter} ${serialNumber}`);
        const intPlateContent = intPlateDiv.querySelector('.plate-content');
        intPlateContent.innerHTML = intPlateDisplay;
        intPlateDiv.onclick = () => copyToClipboard(intPlateCopy, intPlateDiv);

        // ローマ字エリアコードの国際ナンバープレート
        const romajiAreaCode = plateRomaji;
        romajiPlateCopy = `${romajiAreaCode}${separator}${classificationNumber}${separator}${romajiLetter}${separator}${serialNumber}`;
        // console.log(`${romajiAreaCode} ${classificationNumber} ${romajiLetter} ${serialNumber}`);
    }

    // リストからランダムな要素を取得するヘルパー関数
    function randomItem(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    // クリップボードにコピーする関数
    window.copyToClipboard = function(text, element) {
        navigator.clipboard.writeText(text).then(() => {
            // 成功時のフィードバック
            element.classList.add('copied');
            
            setTimeout(() => {
                element.classList.remove('copied');
            }, 1000);
        }).catch(err => {
            console.error('コピーに失敗しました:', err);
            // フォールバック: テキストを選択状態にする
            const plateContent = element.querySelector('.plate-content');
            if (plateContent) {
                const range = document.createRange();
                range.selectNodeContents(plateContent);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });
    };

    // ボタンのクリックイベントを設定
    generateBtn.addEventListener('click', () => {
        generatePlate();
        saveSettingsToCookie();
    });

    // ローマ字コピーボタンのイベント
    copyRomajiBtn.addEventListener('click', () => {
        if (romajiPlateCopy) {
            navigator.clipboard.writeText(romajiPlateCopy).then(() => {
                // 成功時のフィードバック
                copyRomajiBtn.textContent = 'コピーしました!';
                setTimeout(() => {
                    copyRomajiBtn.textContent = '車種・用途情報';
                }, 1000);
            }).catch(err => {
                console.error('コピーに失敗しました:', err);
            });
        }
    });

    // ページ読み込み時にデータをロード
    loadData();

});