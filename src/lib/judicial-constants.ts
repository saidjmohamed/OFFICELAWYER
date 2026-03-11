// Judicial Bodies Constants - الهيئات القضائية
// This file contains all predefined chamber/section types for each judicial body

// Chamber types for المحكمة العليا (Supreme Court)
export const SUPREME_COURT_CHAMBERS = [
  { id: 'civil', name: 'الغرفة المدنية', hasNumber: true, numberRange: [1, 10] },
  { id: 'real_estate', name: 'الغرفة العقارية', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'family_inheritance', name: 'غرفة شؤون الأسرة و المواريث', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'commercial_maritime', name: 'الغرفة التجارية و البحرية', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'social', name: 'الغرفة الإجتماعية', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'criminal', name: 'الغرفة الجنائية', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'misdemeanors', name: 'غرفة الجنح و المخالفات', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
] as const;

// Chamber types for المجلس القضائي (Judicial Council)
export const JUDICIAL_COUNCIL_CHAMBERS = [
  { id: 'civil', name: 'الغرفة المدنية', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'penal', name: 'الغرفة الجزائية', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'indictment', name: 'غرفة الاتهام', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'urgent', name: 'الغرفة الاستعجالية', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'family', name: 'غرفة شؤون الأسرة', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'juvenile', name: 'غرفة الأحداث', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'social', name: 'الغرفة الاجتماعية', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'real_estate', name: 'الغرفة العقارية', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'maritime', name: 'الغرفة البحرية', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'commercial', name: 'الغرفة التجارية', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
] as const;

// Section types for المحكمة (Court)
export const COURT_SECTIONS = [
  { id: 'civil', name: 'القسم المدني', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'misdemeanors', name: 'قسم الجنح', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'contraventions', name: 'قسم المخالفات', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'urgent', name: 'القسم الاستعجالي', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'family', name: 'قسم شؤون الأسرة', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'juvenile', name: 'قسم الأحداث', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'social', name: 'القسم الاجتماعي', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'real_estate', name: 'القسم العقاري', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'maritime', name: 'القسم البحري', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
  { id: 'commercial', name: 'القسم التجاري', hasNumber: true, numberRange: [1, 10], allowNoNumber: true },
] as const;

// Administrative Judiciary Types
export const ADMINISTRATIVE_COURT_TYPES = [
  { id: 'admin_appeal_court', name: 'المحكمة الإدارية الاستئنافية', onePerWilaya: true },
  { id: 'admin_first_instance_court', name: 'المحكمة الإدارية الابتدائية', onePerWilaya: true },
  { id: 'specialized_commercial_court', name: 'المحكمة التجارية المتخصصة', onePerWilaya: true },
] as const;

// Main judicial body types
export const JUDICIAL_BODY_TYPES = {
  // المحكمة العليا - لا تتبع أي ولاية
  supreme_court: {
    name: 'المحكمة العليا',
    requiresWilaya: false,
    chambers: SUPREME_COURT_CHAMBERS,
    icon: 'Scale',
  },
  
  // القضاء العادي
  normal_judiciary: {
    name: 'القضاء العادي',
    requiresWilaya: true,
    subTypes: {
      judicial_council: {
        name: 'مجلس قضائي',
        chambers: JUDICIAL_COUNCIL_CHAMBERS,
        icon: 'Building2',
      },
      court: {
        name: 'محكمة',
        requiresParent: true, // تتبع مجلس قضائي
        sections: COURT_SECTIONS,
        icon: 'Building',
      },
    },
  },
  
  // القضاء الإداري
  administrative_judiciary: {
    name: 'القضاء الإداري',
    requiresWilaya: true,
    subTypes: ADMINISTRATIVE_COURT_TYPES,
    icon: 'Briefcase',
  },
} as const;

// Helper function to get chamber display name with number
export function getChamberDisplayName(chamberName: string, roomNumber?: number | null): string {
  if (roomNumber) {
    return `${chamberName} رقم ${roomNumber}`;
  }
  return chamberName;
}

// Wilayas list (58 wilayas)
export const WILAYAS_LIST = [
  { number: 1, name: 'أدرار' },
  { number: 2, name: 'الشلف' },
  { number: 3, name: 'الأغواط' },
  { number: 4, name: 'أم البواقي' },
  { number: 5, name: 'باتنة' },
  { number: 6, name: 'بجاية' },
  { number: 7, name: 'بسكرة' },
  { number: 8, name: 'بشار' },
  { number: 9, name: 'البليدة' },
  { number: 10, name: 'البويرة' },
  { number: 11, name: 'تمنراست' },
  { number: 12, name: 'تبسة' },
  { number: 13, name: 'تلمسان' },
  { number: 14, name: 'تيارت' },
  { number: 15, name: 'تيزي وزو' },
  { number: 16, name: 'الجزائر' },
  { number: 17, name: 'الجلفة' },
  { number: 18, name: 'جيجل' },
  { number: 19, name: 'سطيف' },
  { number: 20, name: 'سعيدة' },
  { number: 21, name: 'سكيكدة' },
  { number: 22, name: 'سيدي بلعباس' },
  { number: 23, name: 'عنابة' },
  { number: 24, name: 'قالمة' },
  { number: 25, name: 'قسنطينة' },
  { number: 26, name: 'المدية' },
  { number: 27, name: 'مستغانم' },
  { number: 28, name: 'المسيلة' },
  { number: 29, name: 'معسكر' },
  { number: 30, name: 'ورقلة' },
  { number: 31, name: 'وهران' },
  { number: 32, name: 'البيض' },
  { number: 33, name: 'إليزي' },
  { number: 34, name: 'برج بوعريريج' },
  { number: 35, name: 'بومرداس' },
  { number: 36, name: 'الطارف' },
  { number: 37, name: 'تندوف' },
  { number: 38, name: 'تيسمسيلت' },
  { number: 39, name: 'الوادي' },
  { number: 40, name: 'خنشلة' },
  { number: 41, name: 'سوق أهراس' },
  { number: 42, name: 'تيبازة' },
  { number: 43, name: 'ميلة' },
  { number: 44, name: 'عين الدفلى' },
  { number: 45, name: 'النعامة' },
  { number: 46, name: 'عين تموشنت' },
  { number: 47, name: 'غرداية' },
  { number: 48, name: 'غليزان' },
  { number: 49, name: 'تيميمون' },
  { number: 50, name: 'برج باجي مختار' },
  { number: 51, name: 'أولاد جلال' },
  { number: 52, name: 'بني عباس' },
  { number: 53, name: 'عين صالح' },
  { number: 54, name: 'عين قزام' },
  { number: 55, name: 'تقرت' },
  { number: 56, name: 'جانت' },
  { number: 57, name: 'المغير' },
  { number: 58, name: 'المنيعة' },
] as const;

export type ChamberType = typeof SUPREME_COURT_CHAMBERS[number] | typeof JUDICIAL_COUNCIL_CHAMBERS[number] | typeof COURT_SECTIONS[number];
export type WilayaType = typeof WILAYAS_LIST[number];
