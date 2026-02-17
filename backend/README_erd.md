### ER図
https://gyazo.com/82c37820fdbee48e457fa7a4f754d988

---

### 本サービスの概要（700文字以内）
本サービスは、米国株・日本株を対象とした、投資家同士が気軽に意見交換できる軽量な株式コミュニティサービスです。既存の株式情報サービスはチャートやニュースに特化している一方で、ユーザー同士がリアルタイムに交流できる場が少なく、UI が複雑で初心者には扱いづらいという課題があります。本サービスでは、シンプルで高速な UI を重視し、銘柄チャート・出来高・投稿・コメントを1画面で確認できるよう設計しました。

未ログインでも投稿やコメントを閲覧でき、新規ユーザーが気軽に利用を開始できる点が特徴です。ログイン後は投稿・コメント・いいね・ブックマークなどのコミュニティ機能を活用でき、自分の興味ある銘柄に関する意見を整理しながら情報収集ができます。今後はニュース連携、AI による記事要約、リアルタイム更新（WebSocket）などの拡張を予定しており、投資家が効率よく情報を得て交流できる場を提供することを目指しています。

### MVPで実装する予定の機能
-	ユーザー登録 / ログイン（JWT 認証）
-	銘柄検索・銘柄詳細ページの表示
-	株価チャート（Yahoo Finance API）と出来高表示
-	銘柄ごとの投稿（テキスト＋画像1枚）
-	コメント投稿・閲覧
-	投稿・コメントへのいいね機能
-	投稿のブックマーク登録 / 解除
-	未ログイン時の閲覧（投稿一覧・コメント）
-	管理者による投稿削除機能
-	お問い合わせフォーム

---

### テーブル詳細
#### 🅐 users テーブル（ユーザー情報）
- (string) email : ログイン認証用のメールアドレス（ユニーク制約）
- (string) encrypted_password : ハッシュ化されたパスワード
- (string) name : ユーザーの表示名
- (string) avatar_url : プロフィール画像URL
- (string) role : 権限区分（normal / admin）
- (datetime) created_at : 作成日時
- (datetime) updated_at : 更新日時

#### 🅑 stocks テーブル（銘柄情報）
- (string) symbol : 銘柄コード（例：7203.T）/ ユニーク制約
- (string) name_ja : 銘柄名（日本語）
- (string) name_en : 銘柄名（英語）
- (string) market : 上場市場名
- (string) sector : 業種・セクター名称
- (datetime) created_at : 作成日時
- (datetime) updated_at : 更新日時

#### 🅒 posts テーブル（投稿）
- (bigint) user_id : 投稿者ユーザーID（外部キー）
- (bigint) stock_id : 対象銘柄ID（外部キー）
- (text) body : 投稿本文
- (text) image_url : 添付画像URL（任意・1枚）
- (integer) comments_count : コメント数（counter cache）
- (integer) likes_count : いいね数（counter cache）
- (datetime) created_at : 作成日時
- (datetime) updated_at : 更新日時

#### 🅓 comments テーブル（コメント）
- (bigint) user_id : コメントしたユーザーID（外部キー）
- (bigint) post_id : 対象投稿ID（外部キー）
- (text) body : コメント本文
- (integer) likes_count : コメントへのいいね数
- (datetime) created_at : 作成日時
- (datetime) updated_at : 更新日時

#### 🅔 post_likes テーブル（投稿へのいいね）
- (bigint) user_id : いいねしたユーザーID（外部キー）
- (bigint) post_id : 対象投稿ID（外部キー）
- (datetime) created_at : 作成日時
- (datetime) updated_at : 更新日時
  ※ user_id + post_id にユニーク制約（同じ投稿へ複数回いいね不可）

#### 🅕 comment_likes テーブル（コメントへのいいね）
- (bigint) user_id : いいねしたユーザーID（外部キー）
- (bigint) comment_id : 対象コメントID（外部キー）
- (datetime) created_at : 作成日時
- (datetime) updated_at : 更新日時
  ※ user_id + comment_id にユニーク制約

#### 🅖 bookmarks テーブル（ブックマーク）
- (bigint) user_id : ブックマークしたユーザーID
- (bigint) post_id : ブックマーク対象の投稿ID
- (datetime) created_at : 作成日時
- (datetime) updated_at : 更新日時
  ※ user_id + post_id にユニーク制約

#### 🅗 price_candles テーブル（株価キャッシュ）
- (bigint) stock_id : 対象銘柄ID
- (datetime) time : 足の基準時刻
- (string) interval : 足種別（例：1m / 5m / 1d）
- (decimal) open : 始値
- (decimal) high : 高値
- (decimal) low : 安値
- (decimal) close : 終値
- (bigint) volume : 出来高
- (datetime) created_at : 作成日時
- (datetime) updated_at : 更新日時

---

### ER図の注意点
- [✔] プルリクエストに最新のER図のスクリーンショットを画像が表示される形で掲載できているか？
- [✔] テーブル名は複数形になっているか？
- [✔] カラムの型は記載されているか？
- [✔] 外部キーは適切に設けられているか？
- [✔] リレーションは適切に描かれているか？多対多の関係は存在しないか？
- [✔] STIは使用しないER図になっているか？
- [✔] Postsテーブルにpost_nameのように"テーブル名+カラム名"を付けていないか？