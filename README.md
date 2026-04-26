# Tsubuyaki

シンプルな X 風つぶやきアプリ。バックエンドは Supabase、フロントエンドは静的 HTML/CSS/JS。

## 機能

- メール + パスワードのサインアップ / サインイン
- 280 文字以内のつぶやき投稿
- タイムライン表示（全ユーザーの投稿を時系列で表示）
- 自分の投稿は削除可能（Row Level Security で保護）

## セットアップ

### 1. Supabase プロジェクトを用意

1. <https://supabase.com> でプロジェクトを作成
2. **SQL editor** で `supabase-schema.sql` の内容を実行（`posts` テーブル + RLS ポリシー）
3. **Authentication → Providers** で Email を有効化
   - 動作確認だけならメール確認をオフにすると楽（Settings → Auth → "Confirm email" をオフ）

### 2. ローカル設定

```bash
cp config.example.js config.js
```

`config.js` を開き、Supabase ダッシュボードの **Project Settings → API** から取得した値を入れる:

- `url`: Project URL
- `anonKey`: Project API Keys → `anon` `public`

`config.js` は `.gitignore` 済みなのでコミットされません。

### 3. ローカルで起動

ブラウザの fetch CORS の都合上、`file://` ではなく簡易サーバーで開きます。

```bash
python -m http.server 8000
# あるいは
npx serve .
```

<http://localhost:8000> を開く。

## デプロイ

### GitHub Pages の場合

`config.js` はリポジトリに無いので、Pages にデプロイする際は GitHub Actions で
シークレットから生成するのが安全です。例:

```yaml
# .github/workflows/deploy.yml （必要になったら追加してください）
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Inject Supabase config
        run: |
          cat > config.js <<EOF
          window.SUPABASE_CONFIG = {
              url: "${{ secrets.SUPABASE_URL }}",
              anonKey: "${{ secrets.SUPABASE_ANON_KEY }}",
          };
          EOF
      - uses: actions/upload-pages-artifact@v3
        with: { path: . }
  deploy:
    needs: build
    permissions: { pages: write, id-token: write }
    environment: github-pages
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
```

リポジトリの **Settings → Secrets and variables → Actions** に
`SUPABASE_URL` と `SUPABASE_ANON_KEY` を登録してください。

> 注: Supabase の `anon` キーはクライアント公開を前提とした設計で、テーブルは
> RLS ポリシーで守られています。それでも公開リポジトリに直書きせず、
> シークレット経由で注入するのが推奨パターンです。

## ファイル構成

```
├── index.html            メイン画面（ログインフォーム + タイムライン）
├── styles.css            スタイル
├── app.js                Supabase 認証 + 投稿ロジック
├── config.example.js     設定テンプレ（コミットされる）
├── config.js             実際の設定（gitignore 済み・要作成）
├── supabase-schema.sql   Supabase 用スキーマ + RLS
└── README.md             このファイル
```

## ライセンス

MIT
