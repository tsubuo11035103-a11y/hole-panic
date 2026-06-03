# ホールパニック

スマホ縦画面向けのHTML/CSS/JSゲームです。

## ローカル確認

```bash
npx vercel dev
```

または静的確認だけなら `index.html` を開いてください。ただし有料版の合言葉認証は `/api/check-license` が必要です。

## Vercel設定

Environment Variables に以下を追加してください。

```text
LICENSE_KEY=tsubuodream
```

## 構成

```text
index.html
style.css
script.js
assets/tsubuo.png
api/check-license.js
```

## 有料版

- STAGE4〜6解放
- 画像アップロード解放
- 合言葉はフロントに直書きしない方式
