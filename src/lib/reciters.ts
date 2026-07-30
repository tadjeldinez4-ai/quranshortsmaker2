// Quran.com recitation IDs that ship with word-level segment timings.
export interface Reciter {
  id: number;
  nameArabic: string;
  nameEnglish: string;
  style?: string;
  image?: string;
}

// Sentinel IDs for reciters sourced outside the Quran.com recitations API.
// Kept negative to avoid colliding with real Quran.com recitation IDs.
export const ALI_JABER_ID = -1001;
export const YASSER_DOSARI_ID = -1002;

export const RECITERS: Reciter[] = [
  {
    id: 7,
    nameArabic: "مشاري العفاسي",
    nameEnglish: "Mishari Alafasy",
    style: "مرتل",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBEd6bih71VSuyUBswZvOfmbXcR9iSkJZfb9qZRVUEVEUGdQfPZFXm1wu_T0ZZeGch-5bhDSrJbgm8_ldJ-K_KFTlDchlEi7SD16idQRooAQqrfx6lhjUw2NkAuvPTrbhVVMFpVgLFuCncqxpLg6F92rpMuc1R3WR0yP8_e_QWL9s_NnjPN5ZjxVasWn45TXaNl14QT8nCd7SEIYth3cPAg4G5gWW2t0RQqFeY9mizJnLDlXJ8gqroC",
  },
  {
    id: 9,
    nameArabic: "محمد صديق المنشاوي",
    nameEnglish: "Al-Minshawi",
    style: "مرتل",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCfrao1z3icpT69WKlDXevpV7APeqOD-jvJtIZ5Y2pSGWaxq23Q561pZoIvp1Y532OJapDIcOgfss6UJDgNJAuln2HBLK9TIY43NpUd88xXJQ4phLpWb7_9MMe_pA5o0EcfVkUbKKWVSYt6FI8Z4h_-MDcWofQ0MI-W1qVdJwNMiXQwBIDnU097SKzV-IH3bKO__sk9ScuYJcXYH77ZmyiyYa_yX2eYFBMUJT0fQ4s7StGBETBGRY7l",
  },
  {
    id: 8,
    nameArabic: "محمد صديق المنشاوي",
    nameEnglish: "Al-Minshawi",
    style: "مجود",
  },
  {
    id: 6,
    nameArabic: "محمود خليل الحصري",
    nameEnglish: "Mahmoud Al-Husary",
    style: "مرتل",
  },
  {
    id: 12,
    nameArabic: "محمود خليل الحصري",
    nameEnglish: "Mahmoud Al-Husary",
    style: "معلم",
  },
  {
    id: 2,
    nameArabic: "عبد الباسط عبد الصمد",
    nameEnglish: "Abdul Basit",
    style: "مرتل",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCRQiOnHY-kmemoVaiewKVsd6NRtOFjDBJsAIGPt3xcfcfj4XBFelQfcMe_yTd_VmgKyrnH-A7bkrD96LSeA-CYok7NHre41DveRcigmBxLblzMYAi3UfzFJQ2rLx0TSmjXk-qj6qBk9S635_6h8jtzdzpUSKxvIrEuzOnlGKwQQz2UIrOM2O4vp8dOvI3lRjwJQaV5U5RVTWmME8V7irdJmAQxBuRF4Ln9AczWMxdsMFBYsr_dXYdc",
  },
  {
    id: 1,
    nameArabic: "عبد الباسط عبد الصمد",
    nameEnglish: "Abdul Basit",
    style: "مجود",
  },
  {
    id: 3,
    nameArabic: "عبد الرحمن السديس",
    nameEnglish: "As-Sudais",
    style: "مرتل",
  },
  {
    id: 4,
    nameArabic: "أبو بكر الشاطري",
    nameEnglish: "Abu Bakr Al-Shatri",
    style: "مرتل",
  },
  {
    id: 5,
    nameArabic: "هاني الرفاعي",
    nameEnglish: "Hani Ar-Rifai",
    style: "مرتل",
  },
  {
    id: 10,
    nameArabic: "سعود الشريم",
    nameEnglish: "Sa'ud Al-Shuraym",
    style: "مرتل",
  },
  {
    id: 11,
    nameArabic: "محمد الطبلاوي",
    nameEnglish: "Mohamed Al-Tablawi",
    style: "مرتل",
  },
  { id: ALI_JABER_ID, nameArabic: "علي جابر", nameEnglish: "Ali Jaber", style: "مزامنة تقريبية" },
  {
    id: YASSER_DOSARI_ID,
    nameArabic: "ياسر الدوسري",
    nameEnglish: "Yasser Al-Dosari",
    style: "مزامنة تقريبية",
  },
];
