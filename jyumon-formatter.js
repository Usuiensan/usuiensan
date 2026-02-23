/**
 * UUID <-> ふっかつのじゅもん (24文字) 変換モジュール
 * 16-bit CRC と 連鎖加算による強力なエラー検知を実装
 */

// DQ1のふっかつのじゅもん辞書
//ふっかつのじゅもんに使われる文字と番号との関係
//Qiita、「DQ1の「ふっかつのじゅもん」の仕組みを全解説 #Python - Qiita」、https://qiita.com/musemyuzu/items/eb08f7790df356434e0f（閲覧日：2026-02-21）
const DICT_STRING =
  'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわがぎぐげござじずぜぞだぢづでどばびぶべぼ';
const passDict = Array.from(DICT_STRING);
const reverseDict = new Map(passDict.map((char, index) => [char, index]));

// CRC-16-CCITT (多項式: 0x1021) の計算
function calculateCRC16(buffer) {
  let crc = 0xffff;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i] << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc;
}

// UUID(String) -> じゅもん(String)
function uuidToJumon(uuidStr) {
  // 1. UUIDをパースして16バイトの配列にする
  const hex = uuidStr.replace(/-/g, '').toLowerCase();
  if (hex.length !== 32) throw new Error('無効なUUIDフォーマットです。');

  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }

  // 2. 16バイトからCRC-16を計算
  const crc = calculateCRC16(bytes);

  // 3. UUID(128bit)とCRC(16bit)を結合し、144bitのBigIntを生成
  let data144 = 0n;
  for (let i = 0; i < 16; i++) {
    data144 = (data144 << 8n) | BigInt(bytes[i]);
  }
  data144 = (data144 << 16n) | BigInt(crc);

  // 4. 144bitを6bitずつ24個のブロックに分割
  const blocks = [];
  let temp144 = data144;
  for (let i = 0; i < 24; i++) {
    blocks.unshift(Number(temp144 & 0x3fn));
    temp144 >>= 6n;
  }

  // 5. 連鎖加算による暗号化 E_i = (B_i + E_{i-1} + 4) mod 64
  const encoded = [];
  let prev = 0;
  for (let i = 0; i < 24; i++) {
    const e = (blocks[i] + prev + 4) % 64;
    encoded.push(e);
    prev = e;
  }

  // 6. 文字に変換して4文字区切りでフォーマット
  const chars = encoded.map((idx) => passDict[idx]).join('');
  return `${chars.slice(0, 4)} ${chars.slice(4, 8)} ${chars.slice(8, 12)} ${chars.slice(12, 16)} ${chars.slice(16, 20)} ${chars.slice(20, 24)}`;
}

// じゅもん(String) -> UUID(String)
function jumonToUuid(jumonStr) {
  // スペースを除去
  const cleanStr = jumonStr.replace(/\s+/g, '');
  if (cleanStr.length !== 24) throw new Error('じゅもんが ちがいます（文字数が異なります）');

  // 1. 文字をインデックスに変換
  const encoded = [];
  for (const char of cleanStr) {
    if (!reverseDict.has(char)) throw new Error('じゅもんが ちがいます（不正な文字が含まれています）');
    encoded.push(reverseDict.get(char));
  }

  // 2. 連鎖加算の復号 B_i = (E_i - E_{i-1} - 4) mod 64
  const blocks = [];
  let prev = 0;
  for (let i = 0; i < 24; i++) {
    let b = (encoded[i] - prev - 4) % 64;
    if (b < 0) b += 64; // JSの負の剰余対策
    blocks.push(b);
    prev = encoded[i];
  }

  // 3. 24個の6bitブロックを144bitのBigIntに結合
  let data144 = 0n;
  for (let i = 0; i < 24; i++) {
    data144 = (data144 << 6n) | BigInt(blocks[i]);
  }

  // 4. CRC(下位16bit)とUUID(上位128bit)を分離
  const extractedCrc = Number(data144 & 0xffffn);
  let tempUuid = data144 >> 16n;

  const bytes = new Uint8Array(16);
  for (let i = 15; i >= 0; i--) {
    bytes[i] = Number(tempUuid & 0xffn);
    tempUuid >>= 8n;
  }

  // 5. チェックサムの検証
  const calculatedCrc = calculateCRC16(bytes);
  if (extractedCrc !== calculatedCrc) {
    throw new Error('じゅもんが ちがいます（チェックサムエラー）');
  }

  // 6. UUID文字列にフォーマット
  const hexArr = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0'));
  return `${hexArr.slice(0, 4).join('')}-${hexArr.slice(4, 6).join('')}-${hexArr.slice(6, 8).join('')}-${hexArr.slice(8, 10).join('')}-${hexArr.slice(10, 16).join('')}`;
}

const JumonFormatter = {
  DICT_STRING,
  uuidToJumon,
  jumonToUuid,
};

if (typeof window !== 'undefined') {
  window.JumonFormatter = JumonFormatter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = JumonFormatter;
}
