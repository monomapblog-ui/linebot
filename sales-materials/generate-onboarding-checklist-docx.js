const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, VerticalAlign, AlignmentType,
  HeadingLevel, convertInchesToTwip,
} = require('docx');

const FONT = 'Noto Sans CJK JP';
const NAVY = '17354D';
const LIGHT = 'F2F6F8';
const BORDER_GRAY = 'D9D9D9';
const TEAL = '176D83';

const CONTENT_WIDTH = 9026; // approx A4 content width in DXA (matches reference doc's table grid scale)
const COL = Math.floor(CONTENT_WIDTH / 2);

function cellBorders() {
  const b = { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY };
  return { top: b, bottom: b, left: b, right: b };
}

function headerCell(text) {
  return new TableCell({
    width: { size: COL, type: WidthType.DXA },
    borders: cellBorders(),
    shading: { type: ShadingType.CLEAR, fill: NAVY, color: 'auto' },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [new Paragraph({
      spacing: { after: 20 },
      children: [new TextRun({ text, bold: true, color: 'FFFFFF', font: FONT, size: 20 })],
    })],
  });
}

function bodyCell(items) {
  return new TableCell({
    width: { size: COL, type: WidthType.DXA },
    borders: cellBorders(),
    shading: { type: ShadingType.CLEAR, fill: LIGHT, color: 'auto' },
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    children: items.map((it, i) => new Paragraph({
      spacing: { after: i === items.length - 1 ? 0 : 80, line: 300, lineRule: 'auto' },
      children: [new TextRun({ text: '☐ ' + it, font: FONT, size: 19 })],
    })),
  });
}

function phaseTable(leftTitle, leftItems, rightTitle, rightItems) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [COL, COL],
    rows: [
      new TableRow({ tableHeader: true, children: [headerCell(leftTitle), headerCell(rightTitle)] }),
      new TableRow({ children: [bodyCell(leftItems), bodyCell(rightItems)] }),
    ],
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 420, after: 160 },
    children: [new TextRun({ text, bold: true, color: NAVY, font: FONT, size: 30 })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 320, lineRule: 'auto' },
    children: [new TextRun({ text, font: FONT, size: 20, ...opts })],
  });
}

function noteBox(text) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      borders: cellBorders(),
      shading: { type: ShadingType.CLEAR, fill: LIGHT, color: 'auto' },
      margins: { top: 140, bottom: 140, left: 160, right: 160 },
      children: [new Paragraph({ children: [new TextRun({ text, font: FONT, size: 19, color: TEAL })] })],
    })] })],
  });
}

function spacer(h = 160) {
  return new Paragraph({ spacing: { after: h }, children: [] });
}

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: FONT, size: 21, color: '000000' } },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(0.9), bottom: convertInchesToTwip(0.9),
          left: convertInchesToTwip(0.9), right: convertInchesToTwip(0.9),
        },
      },
    },
    children: [
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: '導入オンボーディングチェックリスト', bold: true, font: FONT, size: 44, color: NAVY })],
      }),
      new Paragraph({
        spacing: { after: 260 },
        children: [new TextRun({ text: '契約〜初日受電まで', bold: true, font: FONT, size: 24, color: TEAL })],
      }),
      body('新規契約が決まってから、実際に受電を開始するまでの社内手順書。契約ごとにこのファイルをコピーして、進捗をチェックして管理する。'),
      noteBox('対象プラン：電話受け代行プラン。経営サポートオプションを併せて契約する場合は、業務委託契約書ひな形（yoin-desk-service-agreement.docx）第2条が電話受付代行のみをカバーしている点に注意。オプションを含める場合は契約書の業務内容・免責条項を先に拡張すること。'),
      spacer(320),

      heading1('フェーズ1：契約'),
      phaseTable(
        'YOIN DESK側',
        ['契約書（yoin-desk-service-agreement.docx）を送付', '経営サポートオプション併用時のみ、基本料金分のご請求書を発行（電話受け代行プラン単体はこの時点では請求なし。初回請求は成約発生後の月次）'],
        '店舗様側',
        ['契約書へのご署名・捺印', 'ご入金'],
      ),
      spacer(360),

      heading1('フェーズ2：ヒアリング・初期情報収集'),
      phaseTable(
        'YOIN DESK側',
        ['オンボーディングシートを送付（generate-onboarding-sheet.js で生成）'],
        '店舗様側',
        [
          '店舗名・所在地',
          '既存の電話番号（受付代行に使用する番号）',
          '営業時間',
          'コースメニュー・料金',
          '緊急連絡先（店舗ご担当者名・電話番号／LINE等）',
          '契約プラン・対応時間帯（10:00〜翌4:00 フル対応 or 時間帯限定）',
          '成約（ご来店・施術完了）の報告方法・タイミング',
        ],
      ),
      spacer(360),

      heading1('フェーズ3：電話環境構築'),
      noteBox('前提：RecTEL2は5ライセンス単位の買い切り契約（基本¥10,000/ライセンス、法人のみ）。見積→発注→入金→アカウント発行で即日では届かないため、初契約の前に先に調達しておくこと。'),
      spacer(220),
      phaseTable(
        'YOIN DESK側',
        [
          'SmaCom【ユーザー管理】→【ユーザー】→「＋追加」で内線ユーザーを作成（ユーザー番号は2〜6文字・0始まり不可・作成後は変更不可。店舗ごとの採番ルールを先に決めておく）',
          '発行されたユーザー番号・SIPパスワードをRecTEL2のSIPアカウント設定に登録',
          '転送〜着信の動作確認（テストコール）',
        ],
        '店舗様側',
        ['既存電話番号の転送電話サービスを契約キャリアに申し込み（店舗側対応・日数がかかる場合があるため契約締結と同時に依頼する）'],
      ),
      spacer(260),
      noteBox('出典：楽天コネクトSmaCom管理者向けはじめてガイド、RecTEL2公式サイト。一次情報の細部は要再確認。'),
      spacer(360),

      heading1('フェーズ4：Caskan連携'),
      phaseTable(
        'YOIN DESK側',
        ['Caskan登録内容を確認し、必要に応じてサポート', '既存の顧客情報をCaskanへ移管・確認（公式の外部向けAPI連携がないため手入力になる）'],
        '店舗様側',
        ['YOIN DESK用のCaskanスタッフアカウントを発行', '既存の顧客・セラピスト・コース情報を共有'],
      ),
      spacer(360),

      heading1('フェーズ5：トークスクリプト作成'),
      phaseTable(
        'YOIN DESK側',
        ['店舗ごとのトークスクリプトを作成（generate-talk-script.js）', 'トークスクリプトを使った模擬応対のテスト（ぶっつけ本番にしない）'],
        '店舗様側',
        ['NG事項・コース詳細・よくある質問への回答'],
      ),
      spacer(360),

      heading1('フェーズ6：最終確認・初日受電'),
      phaseTable(
        'YOIN DESK側',
        ['転送動作の最終テスト（本番の電話番号で実施）', 'オペレーターへ店舗情報・NG事項・トークスクリプトを引き継ぎ', '初日の受電体制（担当オペレーター・緊急時のエスカレーション先）を確認'],
        '店舗様側',
        ['初日の緊急連絡先を最終確認'],
      ),
      spacer(360),

      heading1('稼働後フォロー（任意）'),
      new Paragraph({
        spacing: { after: 100, line: 300, lineRule: 'auto' },
        children: [new TextRun({ text: '☐ 初週終了後、応対件数・成約報告の運用に問題がないか店舗様へ確認', font: FONT, size: 20 })],
      }),
      new Paragraph({
        spacing: { after: 100, line: 300, lineRule: 'auto' },
        children: [new TextRun({ text: '☐ 月次レポートの送付タイミングをすり合わせ', font: FONT, size: 20 })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync('YOIN_DESK_導入オンボーディングチェックリスト.docx', buf);
  console.log('written');
});
