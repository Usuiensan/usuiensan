(function () {
  // 同期で JSON を読み込んで window.PHONE_AREA_CODES に設定します（簡易ローダー）
  try {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'assets/json/phone-area-codes.json', false); // 同期
    xhr.send(null);
    if (xhr.status === 200) {
      window.PHONE_AREA_CODES = JSON.parse(xhr.responseText);
    } else {
      console.error(
        'phone-area-codes.json の読み込みに失敗しました: status=' + xhr.status,
      );
      window.PHONE_AREA_CODES = {};
    }
  } catch (e) {
    // ブラウザ以外（テスト）の場合や、何らかの問題がある場合は空オブジェクトにフォールバック
    window.PHONE_AREA_CODES = window.PHONE_AREA_CODES || {};
    console.error('phone-area-codes ローダーで例外が発生しました', e);
  }
})();
