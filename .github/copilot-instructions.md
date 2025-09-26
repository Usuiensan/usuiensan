# 基本
- 日本語で応答すること
- 必要に応じて、ユーザに質問を行い、要求を明確にすること
- 作業後、作業内容とユーザが次に取れる行動を説明すること
- 作業項目が多い場合は、段階に区切り、git commit を行いながら進めること
  - semantic commit（例: "feat:", "fix:", "docs:" などのprefixを付ける。詳細は [Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/) を参照）を使用する
- コマンドの出力が確認できない場合、 get last command / check background terminal を使用して確認すること
- テーマカラーは#C0ffeeを基調とすること。デベロッパーの私は色弱者なので色を扱う際はどんな色なのか、どんな印象を与える色かを説明すること
- 変更したコードは、変更前と変更後の両方を示すこと。
- 変更したコードが動作するかどうか、動作確認を行うこと。
- デザインについて変更を行う場合、変更前と変更後のサンプルを示すこと。
 - そのため、.design_example\example.html と .design_example\example.css に変更前と変更後のデザインを示すこと
# レビューに関して
レビューする際には、以下のprefix(接頭辞)を付けましょう。
<!-- for GitHub Copilot review rule -->
🛑[must] → かならず変更してね  
💡[imo] → 自分の意見だとこうだけど修正必須ではないよ(in my opinion)  
📝[nits] → ささいな指摘(nitpick)  
❓[ask] → 質問  
ℹ️[fyi] → 参考情報
<!-- for GitHub Copilot review rule -->
