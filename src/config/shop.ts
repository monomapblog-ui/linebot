/**
 * 店舗情報の設定ファイル（MVP版）
 *
 * 複数店舗展開する段階までは、この1店舗分のダミーデータを直接編集して運用する。
 * ここに書かれた内容がそのままClaudeへのシステムプロンプトに埋め込まれ、
 * 「コース内容」「クーポン」に関する質問への回答根拠として使われる。
 */

export type Course = {
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
};

export type Coupon = {
  title: string;
  description: string;
  validUntil: string;
};

export type ShopConfig = {
  shopName: string;
  businessHours: string;
  address: string;
  phoneNumber: string;
  courses: Course[];
  coupons: Coupon[];
  /** AIが回答してよい範囲・トーンなどの追加指示 */
  extraNotes: string[];
};

export const shopConfig: ShopConfig = {
  shopName: "リラクゼーションサロン Sample",
  businessHours: "12:00〜24:00（最終受付23:00）",
  address: "東京都新宿区西新宿1-1-1 サンプルビル3F",
  phoneNumber: "03-0000-0000",
  courses: [
    {
      name: "スタンダードコース",
      durationMinutes: 60,
      price: 12000,
      description: "全身をゆっくりほぐす基本コース。初めての方にもおすすめ。",
    },
    {
      name: "スタンダードコース",
      durationMinutes: 90,
      price: 17000,
      description: "60分コースに背面オイルトリートメントを追加したコース。",
    },
    {
      name: "プレミアムコース",
      durationMinutes: 120,
      price: 22000,
      description: "全身+ヘッド+ハンドケアまでじっくり行う最上級コース。",
    },
  ],
  coupons: [
    {
      title: "初回限定2,000円OFF",
      description: "初めてご利用のお客様限定で、全コース2,000円割引。",
      validUntil: "2026-12-31",
    },
    {
      title: "平日14時〜18時限定 1,000円OFF",
      description: "平日14:00〜18:00にご来店の場合、全コース1,000円割引。",
      validUntil: "2026-12-31",
    },
  ],
  extraNotes: [
    "料金は税込表示。",
    "コースやクーポンにない質問（在籍セラピストの出勤状況など）には正直に「わかりません、店舗に直接お問い合わせください」と答える。",
    "予約の確定操作は行わず、予約したい場合は電話または既存の予約システムへ誘導する。",
  ],
};
