# ホールパニック v2

キャラタップの達人の次作として、使用感を揃えたスマホ縦画面ゲームです。

## GitHub / Vercel 構成

```text
hole-panic-v2/
├─ index.html
├─ style.css
├─ script.js
├─ vercel.json
├─ README.md
├─ api/
│  └─ check-license.js
└─ assets/
   ├─ icon.png
   ├─ ohirunetsubuo.png
   ├─ feverohirunetsubuo.png
   ├─ ohiruneblack.png
   ├─ osanpotsubuo.png
   ├─ feverosanpotsubuo.png
   ├─ idoublack.png
   ├─ tousoutsubuo.png
   ├─ fevertousoutsubuo.png
   ├─ rakkatsubuo.png
   ├─ feverrakkatsubuo.png
   ├─ rakkablack.png
   └─ sounds/
      ├─ countdown.mp3
      ├─ collect.mp3
      ├─ levelup.mp3
      ├─ fever.mp3
      ├─ black.mp3
      ├─ clear.mp3
      └─ fail.mp3
```

## Vercel 環境変数

```text
LICENSE_KEY=tsubuodream
```

合言葉はフロントに直書きしていません。`/api/check-license` で確認します。

## note リンク

`script.js` 冒頭の2つを差し替えてください。

```js
const PAID_NOTE_URL = 'https://note.com/cute_tsubuo';
const TSUBUO_NOTE_URL = 'https://note.com/cute_tsubuo';
```

無料版では `PAID_NOTE_URL`、有料版解放後は `TSUBUO_NOTE_URL` に誘導します。

## 画像

現在の `assets/*.png` は仮画像です。作成済み素材に同名で差し替えてください。

## 効果音

音声ファイルは未配置でも動きます。後から同名ファイルを入れるだけで鳴ります。

## 仕様メモ

- タイトル画面は背景にゲーム画面、ウィンドウ内にボタン。
- スタート後にステージ選択。
- 有料ステージは解放前はタップ不可。メッセージなし。
- ゲーム画面は全画面。
- HUD はスコア、残り時間、タイトルへ。
- 合言葉、有料解放状態、ベストタイムはブラウザ保存。
- 無料マップは 3.5画面分、有料マップは 6画面分。
