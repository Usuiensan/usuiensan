(function () {
  const formatter = window.JumonFormatter;
  const uuidInput = document.getElementById('uuidInput');
  const jumonInput = document.getElementById('jumonInput');
  const jumonOutput = document.getElementById('jumonOutput');
  const uuidOutput = document.getElementById('uuidOutput');
  const toJumonBtn = document.getElementById('toJumonBtn');
  const toUuidBtn = document.getElementById('toUuidBtn');
  const convertMessage = document.getElementById('convertMessage');

  function setMessage(message, type) {
    convertMessage.textContent = message;
    convertMessage.classList.remove('success', 'error');
    if (type) {
      convertMessage.classList.add(type);
    }
  }

  // 正規化: 空白を除去した純粋なじゅもん文字列
  function normalizeJumon(raw) {
    return (raw || '').replace(/\s+/g, '');
  }

  // 表示用フォーマット: 4文字ごとにスペース挿入（入力完了時にのみ適用）
  function formatJumonBlocks4(raw) {
    const noSpace = normalizeJumon(raw);
    return noSpace.replace(/(.{4})/g, '$1 ').trim();
  }

  if (!formatter || !formatter.uuidToJumon || !formatter.jumonToUuid) {
    setMessage('変換モジュールの読み込みに失敗しました。', 'error');
    return;
  }

  // 入力中は自動整形しない（ローマ字入力等で邪魔になるため）
  // 整形はフォーカスを外したときに実行する
  jumonInput.addEventListener('blur', () => {
    jumonInput.value = formatJumonBlocks4(jumonInput.value);
  });

  toJumonBtn.addEventListener('click', () => {
    try {
      const uuid = (uuidInput.value || '').trim().toLowerCase();
      const jumon = formatter.uuidToJumon(uuid);
      jumonOutput.value = jumon;
      // NOTE: do not populate `jumonInput` here to avoid overwriting user's manual input.
      setMessage('UUIDをじゅもんに変換しました。', 'success');
    } catch (error) {
      setMessage(error.message || '変換に失敗しました。', 'error');
    }
  });

  toUuidBtn.addEventListener('click', () => {
    try {
      // 正規化して変換（内部でスペースは許容されるが明示的に除去）
      const normalized = normalizeJumon(jumonInput.value);
      const uuid = formatter.jumonToUuid(normalized);
      uuidOutput.value = uuid;
      // ユーザ入力欄は、変換操作後に4文字区切りで整形して表示する
      jumonInput.value = formatJumonBlocks4(normalized);
      setMessage('じゅもんをUUIDに変換しました。', 'success');
    } catch (error) {
      setMessage(error.message || '変換に失敗しました。', 'error');
    }
  });

  // コピーユーティリティ（navigator.clipboard対応。未対応環境はフォールバック）
  function copyTextToClipboard(text) {
    if (!text) return Promise.reject(new Error('コピーするテキストがありません'));
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // フォールバック
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  function flashCopied(el, btn) {
    if (el) el.classList.add('copied-feedback');
    if (btn) btn.classList.add('copied');
    setTimeout(() => {
      if (el) el.classList.remove('copied-feedback');
      if (btn) btn.classList.remove('copied');
    }, 1400);
  }

  // 出力テキストエリア（じゅもん出力、UUID出力）をクリックするだけでコピー
  // ※ `jumonInput` は入力欄のためクリックでコピーしない（編集が阻害されるため）
  [jumonOutput, uuidOutput].forEach((el) => {
    if (!el) return;
    el.style.cursor = 'pointer';
    el.title = 'クリックでコピー';
    el.addEventListener('click', () => {
      copyTextToClipboard(el.value)
        .then(() => {
          setMessage('クリックでコピーしました。', 'success');
          flashCopied(el, null);
        })
        .catch(() => setMessage('コピーに失敗しました。', 'error'));
    });
  });
})();
