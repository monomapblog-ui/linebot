const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle,
} = require("docx");

const GOLD = "9C7A2E";
const NAVY = "1B2233";
const GREY = "6B7280";

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 160 },
    border: { bottom: { color: GOLD, space: 4, style: BorderStyle.SINGLE, size: 6 } },
    children: [new TextRun({ text, bold: true, size: 28, color: "111111" })],
  });
}

function h2(text) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, color: "111111" })],
  });
}

function note(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 18, color: GREY, italics: true })],
  });
}

function scriptLine(who, text) {
  return new Paragraph({
    spacing: { after: 100 },
    indent: { left: 260 },
    children: [
      new TextRun({ text: `${who}　`, bold: true, size: 20, color: GOLD }),
      new TextRun({ text: `「${text}」`, size: 20 }),
    ],
  });
}

function bodyText(text) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 20 })],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: "・", size: 20 }),
      new TextRun({ text, size: 20 }),
    ],
  });
}

function simpleTable(rows, colWidths) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: rows.map((cells, ri) =>
      new TableRow({
        children: cells.map((cellText, ci) =>
          new TableCell({
            width: { size: colWidths[ci], type: WidthType.DXA },
            shading: ri === 0 ? { type: ShadingType.CLEAR, fill: NAVY, color: "auto" } : undefined,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cellText,
                    bold: ri === 0,
                    size: 19,
                    color: ri === 0 ? "FFFFFF" : "111111",
                  }),
                ],
              }),
            ],
          })
        ),
      })
    ),
  });
}

const doc = new Document({
  sections: [
    {
      properties: {
        page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } },
      },
      children: [
        new Paragraph({
          children: [new TextRun({ text: "YOIN DESK", bold: true, size: 20, color: GOLD })],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "電話受け代行プラン ｜ トークスクリプトテンプレート", bold: true, size: 40 }),
          ],
        }),
        note("店舗ごとのオンボーディングシートの内容を反映させたうえで使用してください。〔　〕内は店舗ごとに差し替える箇所です。"),

        h1("1. 応答の基本方針"),
        bullet("口調は丁寧・落ち着いたトーンで。馴れ馴れしい言葉遣いは避ける。"),
        bullet("お客様を待たせない。コール音3回以内を目安に応答する。"),
        bullet("〔店舗名〕の従業員として応対する（代行であることは案内しない）。"),

        h1("2. 電話の受け方"),
        h2("第一声"),
        scriptLine("受電時", "お電話ありがとうございます。〔店舗名〕でございます。"),
        h2("要件のヒアリング"),
        scriptLine("応対", "本日はどのようなご用件でしょうか。"),
        note("→ ご予約か、コース・料金の質問か、その他かを最初に見極める。"),

        h1("3. よくある質問と回答例"),
        h2("コース内容・料金について"),
        scriptLine("応対", "コースは60分・90分・120分をご用意しております。60分ですと〔金額〕円となります。〔補足内容〕"),
        note("→ 具体的な金額・時間はオンボーディングシート「2. コースメニュー・料金」を必ず参照。"),
        h2("クーポンについて"),
        scriptLine("応対", "現在〔クーポン名〕をご利用いただけます。〔割引内容〕となっております。"),
        h2("アクセス・駐車場について"),
        scriptLine("応対", "〔最寄り駅〕から徒歩〔分数〕分でございます。駐車場は〔案内内容〕。"),
        h2("在籍状況について"),
        note("→ 原則、この場では案内しない。オンボーディングシート「4. 在籍状況の案内方針」に従うこと。"),
        scriptLine("応対（引き継ぐ場合）", "確認のうえ、店舗より折り返しご連絡させていただきます。お名前とご連絡先をお伺いしてもよろしいでしょうか。"),

        h1("4. 予約受付の手順"),
        note("以下の情報を漏れなく確認する。"),
        simpleTable(
          [
            ["確認項目", "備考"],
            ["希望日時", "第1〜第2希望まで確認できると良い"],
            ["希望コース", ""],
            ["お名前", ""],
            ["連絡先（電話番号）", ""],
            ["ご利用回数（初めて／2回目以降）", "クーポン適用可否の判断に使う場合あり"],
          ],
          [3500, 5500]
        ),
        new Paragraph({ spacing: { before: 160 }, children: [] }),
        scriptLine("確認時", "ありがとうございます。〔日付〕の〔時間〕、〔コース名〕でお伺いしました。店舗より確定のご連絡をいたしますので、少々お待ちください。"),
        note("→ 確認した内容は、オンボーディングシート「6. 予約の取り次ぎ方法」に従い、速やかに店舗へ引き継ぐこと。"),

        h1("5. 対応が難しい場合"),
        h2("値引き交渉があった場合"),
        scriptLine("応対", "誠に申し訳ございませんが、料金についてはこちらでは判断いたしかねます。店舗に確認のうえ、改めてご連絡いたします。"),
        h2("クレームがあった場合"),
        scriptLine("応対", "ご不快な思いをさせてしまい、申し訳ございません。担当者より改めてご連絡させていただきます。"),
        note("→ クレーム内容は詳細に記録し、オンボーディングシート「7. エスカレーション」の連絡先へ速やかに共有する。"),
        h2("不適切な要求・NGな質問があった場合"),
        scriptLine("応対", "申し訳ございませんが、そちらについてはお答えいたしかねます。"),
        note("→ 性的サービスに関する示唆・要求など、対応方針に反する内容には応じず、毅然と対応を終える。必要に応じて通話を切る判断も可。"),

        h1("6. クロージング"),
        scriptLine("終話時", "お電話ありがとうございました。〔店舗名〕でお待ちしております。失礼いたします。"),

        new Paragraph({
          spacing: { before: 400 },
          children: [new TextRun({ text: "運営: 合同会社グラステ　YOIN DESK", size: 16, color: GREY })],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  require("fs").writeFileSync(
    "/tmp/claude-0/-home-user-yoin/eaa362e4-d40c-5177-8209-10fdd8fdf130/scratchpad/yoin-desk-talk-script.docx",
    buffer
  );
  console.log("done");
});
