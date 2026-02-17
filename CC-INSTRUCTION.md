# CC初期指示

## 1. リポジトリ作成とセットアップ

GitHubにリポジトリ `machi-no-karte` を作成してください（public）。

```bash
mkdir machi-no-karte && cd machi-no-karte
git init
npm create vite@latest . -- --template react-ts
npm install
npm install recharts
```

## 2. 環境変数

`.env` を作成：
```
VITE_ESTAT_API_KEY=b885fdfa6a634809553a106e169925e289c52fee
```

`.gitignore` に `.env` を追加。

## 3. PROJECT.md

以下の内容でPROJECT.mdをプロジェクトルートに配置してください。

---

PROJECT.mdの内容は別途渡すのでそれを読み込んでください。
（このファイルと同じディレクトリにあるPROJECT.mdを参照）

---

## 4. やること（Phase 1 MVP）

PROJECT.mdを読んで、Phase 1のMVPを作ってください。

方針：
- **e-Stat APIは後回し**。渋谷区のデータをハードコードして画面を先に作る
- e-Statの「統計でみる市区町村のすがた2025」から渋谷区（コード:13113）のデータをハードコード用に取得して使う
- 比較用に23区平均・全国平均もハードコードする
- レスポンシブ対応（スマホファースト）
- GitHub Pagesへのデプロイ設定も入れる

画面構成（1ページ完結）：
- ヘッダー：タイトル + 自治体セレクター（Phase1はまず渋谷区固定でOK）
- レーダーチャート：6軸（子育て・医療・安全・経済・教育・住環境）のまちスコア
- 人口トレンド：折れ線グラフ（年次推移）
- 6カテゴリのStatCard：数字大きく、23区平均との比較↑↓表示
  - 👶 子育て（保育所数、児童福祉施設数）
  - 🏥 医療（病院数、診療所数、医師数）
  - 🛡️ 安全（犯罪件数、交通事故、火災件数）
  - 💰 経済（平均所得、事業所数、財政力指数）
  - 📚 教育（小中学校数、図書館数）
  - 🏠 暮らし（世帯数、住宅着工数、高齢単独世帯率）

デザイン：
- 白背景、モダンでクリーン
- Noto Sans JP
- カテゴリごとにアクセントカラー
- 専門用語には平易な説明を添える（例：財政力指数→「自治体の財政の健全さ」）

## 5. デプロイ

GitHub Pagesで公開できるように `vite.config.ts` の `base` 設定と GitHub Actions を入れてください。

## 6. 検証

- `npm run dev` でローカル表示確認
- スマホサイズ（375px幅）で崩れないか確認
- `npm run build` が通ること
