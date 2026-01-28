/*
 * 電話市外局番データ（生成ファイル）
 * - メンテナンス時は assets/json/phone-area-codes.json を編集して下さい
 * - 同期ロードのため window.PHONE_AREA_CODES に割当てます
 */
window.PHONE_AREA_CODES = {
  "twoDigit": {
    "03": { "region": "東京都", "isKinki": false },
    "06": { "region": "大阪府", "isKinki": true }
  },
  "threeDigit": {
    "072": { "region": "大阪府・兵庫県", "isKinki": true },
    "073": { "region": "和歌山県", "isKinki": true },
    "074": { "region": "滋賀県・奈良県", "isKinki": true },
    "075": { "region": "京都府", "isKinki": true },
    "076": { "region": "石川県・富山県", "isKinki": false },
    "077": { "region": "滋賀県", "isKinki": true },
    "078": { "region": "兵庫県（神戸）", "isKinki": true },
    "079": { "region": "兵庫県（姫路）", "isKinki": true },

    "042": { "region": "東京都・埼玉県", "isKinki": false },
    "052": { "region": "愛知県", "isKinki": false },
    "092": { "region": "福岡県", "isKinki": false }
  },
  "fourDigit": {
    "0120": { "region": "フリーダイヤル", "isKinki": false },
    "0570": { "region": "ナビダイヤル", "isKinki": false },
    "0220": { "region": "宮城県（ローカル）", "isKinki": false }
  },
  "fiveDigit": {
    "01267": { "region": "北海道（特例）", "isKinki": false }
  }
};