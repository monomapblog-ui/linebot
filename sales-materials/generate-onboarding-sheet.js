const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, LevelFormat, convertInchesToTwip,
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

function label(text) {
  return new Paragraph({
    spacing: { before: 120, after: 60 },
    children: [new TextRun({ text, bold: true, size: 20 })],
  });
}

function note(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 18, color: GREY, italics: true })],
  });
}

function fillLine(widthTwips = 9000) {
  return new Paragraph({
    spacing: { after: 200 },
    border: { bottom: { color: "AAAAAA", space: 1, style: BorderStyle.SINGLE, size: 4 } },
    children: [new TextRun({ text: " ", size: 20 })],
  });
}

function checkboxItem(text) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({ text: "☐  ", size: 22 }),
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
                    size: 20,
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
        page: {
          margin: { top: 900, bottom: 900, left: 1000, right: 1000 },
        },
      },
      children: [
        new Paragraph({
          children: [new TextRun({ text: "YOIN DESK", bold: true, size: 20, color: GOLD })],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "電話受け代行プラン ｜ クライアントオンボーディングシート", bold: true, size: 40 }),
          ],
        }),
        note("契約が決まった店舗様から、サービス開始前に必ず伺う項目です。このシートを埋めてから運用を開始してください。"),

        h1("1. 基本情報"),
        label("店舗名"),
        fillLine(),
        label("所在地"),
        fillLine(),
        label("既存の電話番号（受付代行に使用する番号）"),
        fillLine(),
        label("営業時間"),
        fillLine(),
        label("店舗ご担当者名・緊急連絡先（電話番号／LINE等）"),
        fillLine(),
        label("契約プラン"),
        checkboxItem("ライトプラン（月100件まで／指定時間帯のみ）　対応時間帯：＿＿＿＿〜＿＿＿＿"),
        checkboxItem("スタンダードプラン（月300件まで／24時間365日）"),
        checkboxItem("カスタムプラン（複数店舗・LINE自動受付との併用）"),

        h1("2. コースメニュー・料金"),
        note("表に記入するか、既存のメニュー表・料金表をこのシートに添付してください。"),
        simpleTable(
          [
            ["コース名", "時間", "料金", "内容・備考"],
            ["", "", "", ""],
            ["", "", "", ""],
            ["", "", "", ""],
            ["", "", "", ""],
          ],
          [2200, 1600, 1800, 3400]
        ),

        h1("3. クーポン・キャンペーン情報"),
        fillLine(),
        fillLine(),
        note("内容が更新された場合は、都度ご連絡ください。反映までにかかる時間の目安：1営業日"),

        h1("4. 在籍状況の案内方針"),
        note("在籍状況（誰が出勤しているか）は原則リアルタイム連携がないため、オペレーターからは案内せず、店舗へ引き継ぐ運用が基本です。方針を選択してください。"),
        checkboxItem("在籍状況は一切案内せず、必ず店舗へ引き継ぐ"),
        checkboxItem("大まかな在籍人数のみ案内可（詳細は引き継ぎ）"),
        checkboxItem("その他（下記に記入）"),
        fillLine(),

        h1("5. NG事項・注意事項"),
        note("性風俗関連特殊営業に該当する内容の案内は一切行いません。以下、店舗固有の注意事項があれば記入してください。"),
        checkboxItem("特定のキャストの本名・プライベートな情報は案内しない"),
        checkboxItem("料金の割引交渉には応じない旨を案内する"),
        checkboxItem("その他（下記に記入）"),
        fillLine(),
        fillLine(),

        h1("6. 予約の取り次ぎ方法"),
        note("お客様からの予約希望をどう店舗に引き継ぐか、方法を選択してください。"),
        checkboxItem("LINEで即時通知（グループ／個別チャット）"),
        checkboxItem("メールで通知"),
        checkboxItem("既存の予約管理システム（Caskan等）に直接入力"),
        checkboxItem("その他（下記に記入）"),
        fillLine(),

        h1("7. エスカレーション（判断に迷う場合の連絡先）"),
        label("平常時の連絡先（電話／LINE）"),
        fillLine(),
        label("連絡がつかない場合の代替連絡先"),
        fillLine(),
        label("クレーム発生時の対応方針"),
        fillLine(),
        fillLine(),

        h1("8. 契約情報"),
        simpleTable(
          [
            ["項目", "内容"],
            ["サービス開始日", ""],
            ["月額料金", ""],
            ["請求方法・支払期日", ""],
            ["契約担当者サイン", ""],
          ],
          [3000, 6000]
        ),

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
    "/tmp/claude-0/-home-user-yoin/eaa362e4-d40c-5177-8209-10fdd8fdf130/scratchpad/yoin-desk-onboarding-sheet.docx",
    buffer
  );
  console.log("done");
});
