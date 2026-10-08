import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'vi' | 'en';
export type Theme = 'light' | 'dark';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Entry = string | ((...a: any[]) => string);
type Dict = Record<string, Entry>;

const D: Record<Lang, Dict> = {
  vi: {
    app: 'Tình Bạn Và Hóa Đơn',
    themeLight: 'Chuyển sang giao diện sáng', themeDark: 'Chuyển sang giao diện tối',
    footerLinks: 'Liên kết nhanh', footerHome: 'Trang chủ', footerEasterEgg: 'Trứng phục sinh',
    footerBuiltWith: 'Được xây dựng với', footerRights: 'Đã đăng ký bản quyền.',
    newTrip: 'Chuyến đi mới', tripName: 'Tên chuyến đi', trips: 'Chuyến đi',
    noTrips: 'Chưa có chuyến đi nào.',
    membersLines: 'Thành viên', creatorMember: 'Bạn là thành viên nào?',
    create: 'Tạo', cancel: 'Hủy', save: 'Lưu', close: 'Đóng', del: 'Xóa', edit: 'Sửa', add: 'Thêm',
    share: 'Chia sẻ', shareView: 'Link chỉ xem (gửi cho bạn bè)', shareEdit: 'Link chỉnh sửa (chỉ trưởng nhóm giữ)',
    memberVerifyTitle: 'Xác nhận thành viên',
    memberVerifyDescription: 'Chọn tên của bạn. Lần đầu, hãy tự đặt câu hỏi và câu trả lời; những lần sau dùng câu trả lời để xác nhận.',
    selectMember: 'Chọn tên của bạn', securityQuestion: 'Câu hỏi bảo mật', securityAnswer: 'Câu trả lời',
    saveAndContinue: 'Lưu và tiếp tục', verify: 'Xác nhận', wrongSecurityAnswer: 'Câu trả lời chưa đúng.',
    securityAnswerRequired: 'Vui lòng nhập câu hỏi và câu trả lời.', verificationSaveFailed: 'Không lưu được xác nhận. Vui lòng thử lại.',
    identitySaveFailed: 'Không lưu được tên thành viên trên thiết bị. Vui lòng bật bộ nhớ trình duyệt rồi thử lại.',
    noAvailableMembers: 'Tên các thành viên đã được chọn hoặc xác nhận.',
    copy: 'Sao chép', copied: 'Đã sao chép', back: 'Quay lại',
    pasteTripLink: 'Dán link chuyến đi',
    pasteTripLinkPlaceholder: 'Dán link được chia sẻ vào đây',
    openTrip: 'Mở chuyến đi',
    invalidTripLink: 'Link không hợp lệ hoặc không thuộc ứng dụng này.',
    tabExp: 'Chi tiêu', tabBal: 'Ai nợ ai', tabStats: 'Thống kê', tabHist: 'Lịch sử', tabMem: 'Thành viên',
    addExpense: 'Thêm khoản chi', editExpense: 'Sửa khoản chi',
    title: 'Nội dung', amount: 'Tổng tiền (₫)', category: 'Danh mục', datetime: 'Ngày giờ',
    mainPayer: 'Người trả', multiPayer: 'Nhiều người cùng trả', payAmounts: 'Số tiền mỗi người đã trả',
    participants: 'Ai tham gia khoản này', splitMode: 'Cách chia',
    equal: 'Chia đều theo thành viên/hộ', perHead: 'Chia theo số người (hộ nhiều người trả nhiều hơn)', custom: 'Nhập số tiền riêng',
    receipt: 'Ảnh hóa đơn', note: 'Ghi chú', total: 'Tổng chi', perPerson: 'Mỗi người cần trả',
    noExpenses: 'Chưa có khoản chi nào.', paidBy: 'trả',
    name: 'Tên', people: 'Số người trong hộ', peopleNote: 'Ghi chú (tên các thành viên trong hộ)',
    addMember: 'Thêm thành viên', editMember: 'Sửa thành viên', persons: 'người',
    owesTo: 'chuyển cho', settledAll: 'Mọi người đã thanh toán xong 🎉',
    markPaid: 'Đã trả', remind: 'Nhắc nợ', payments: 'Đã thanh toán',
    byCategory: 'Chi theo danh mục', byPerson: 'Chi theo người', paid: 'Đã trả', owedShare: 'Phần phải chịu',
    history: 'Lịch sử chỉnh sửa', readOnly: 'Chế độ chỉ xem', changeBg: 'Đổi ảnh nền',
    confirmDel: 'Bạn chắc chắn muốn xóa?',
    deleteFailed: 'Không xóa được chuyến đi. Vui lòng kiểm tra kết nối rồi thử lại.',
    errPayers: 'Tổng số tiền người trả phải bằng tổng tiền.',
    errCustom: 'Tổng số tiền riêng phải bằng tổng tiền.',
    errParts: 'Chọn ít nhất 1 người tham gia.', errName: 'Vui lòng nhập tên.', errAmount: 'Số tiền không hợp lệ.',
    memberInUse: 'Thành viên này đang có trong các khoản chi, không thể xóa.',
    gets: 'được nhận', owes: 'đang nợ', even: 'đã cân bằng',
    notFound: 'Không tìm thấy chuyến đi. Cần mạng để mở link lần đầu.',
    remindText: (trip: any, a: any, b: any, amt: any) => `Nhắc nợ chuyến "${trip}": ${a} chuyển cho ${b} ${amt}. Cảm ơn nhé!`,
    deleteTrip: 'Xóa chuyến đi',
    adjustBg: 'Căn chỉnh ảnh nền', pickImage: 'Chọn ảnh khác', dragHint: 'Kéo ảnh để di chuyển, kéo thanh trượt để phóng to', zoom: 'Phóng to', apply: 'Áp dụng', resetFrame: 'Đặt lại',
    remaining: 'Còn lại', exceeded: 'Vượt quá', sharedWith: 'Chia cho', people_n: (n: number) => `${n} người`,
    spentPerPerson: 'Chi bình quân mỗi người', expenses_n: (n: number) => `${n} khoản`, noHistory: 'Chưa có chỉnh sửa nào.',
    logTripNew: (n: any) => `Tạo chuyến đi "${n}"`,
    logExpAdd: (n: any, a: any) => `Thêm khoản "${n}" (${a})`, logExpEdit: (n: any, a: any) => `Sửa khoản "${n}" (${a})`,
    logExpDel: (n: any) => `Xóa khoản "${n}"`,
    logMemAdd: (n: any) => `Thêm thành viên "${n}"`, logMemEdit: (n: any) => `Sửa thành viên "${n}"`, logMemDel: (n: any) => `Xóa thành viên "${n}"`,
    logPay: (a: any, b: any, amt: any) => `${a} đã trả ${b} ${amt}`, logPayDel: (a: any, b: any, amt: any) => `Hủy ghi nhận ${a} trả ${b} ${amt}`,
    logBg: 'Đổi ảnh nền',
    cat_food: 'Ăn uống', cat_transport: 'Đi lại', cat_stay: 'Chỗ ở', cat_fun: 'Vui chơi', cat_shop: 'Mua sắm', cat_other: 'Khác',
  },
  en: {
    app: 'Friends & Bills',
    themeLight: 'Switch to light mode', themeDark: 'Switch to dark mode',
    footerLinks: 'Quick Links', footerHome: 'Home', footerEasterEgg: 'Easter egg',
    footerBuiltWith: 'Built With', footerRights: 'All rights reserved.',
    newTrip: 'New trip', tripName: 'Trip name', trips: 'Trips',
    noTrips: 'No trips yet.',
    membersLines: 'Members', creatorMember: 'Which member are you?',
    create: 'Create', cancel: 'Cancel', save: 'Save', close: 'Close', del: 'Delete', edit: 'Edit', add: 'Add',
    share: 'Share', shareView: 'View-only link (send to friends)', shareEdit: 'Edit link (organizer only)',
    memberVerifyTitle: 'Confirm your identity',
    memberVerifyDescription: 'Choose your name. The first time, set a security question and answer; next time, answer it to confirm.',
    selectMember: 'Choose your name', securityQuestion: 'Security question', securityAnswer: 'Answer',
    saveAndContinue: 'Save and continue', verify: 'Confirm', wrongSecurityAnswer: 'That answer is incorrect.',
    securityAnswerRequired: 'Enter a security question and answer.', verificationSaveFailed: 'Could not save your verification. Please try again.',
    identitySaveFailed: 'Could not save your member identity on this device. Enable browser storage and try again.',
    noAvailableMembers: 'All member names have already been claimed or verified.',
    copy: 'Copy', copied: 'Copied', back: 'Back',
    pasteTripLink: 'Paste a trip link',
    pasteTripLinkPlaceholder: 'Paste a shared link here',
    openTrip: 'Open trip',
    invalidTripLink: 'This link is invalid or does not belong to this app.',
    tabExp: 'Expenses', tabBal: 'Balances', tabStats: 'Stats', tabHist: 'History', tabMem: 'Members',
    addExpense: 'Add expense', editExpense: 'Edit expense',
    title: 'Description', amount: 'Total (₫)', category: 'Category', datetime: 'Date & time',
    mainPayer: 'Paid by', multiPayer: 'Multiple payers', payAmounts: 'Amount each person paid',
    participants: 'Who shares this expense', splitMode: 'Split method',
    equal: 'Equally per member/household', perHead: 'By headcount (bigger households pay more)', custom: 'Custom amounts',
    receipt: 'Receipt photo', note: 'Note', total: 'Total spent', perPerson: 'Each person owes',
    noExpenses: 'No expenses yet.', paidBy: 'paid by',
    name: 'Name', people: 'People in household', peopleNote: 'Note (names of household members)',
    addMember: 'Add member', editMember: 'Edit member', persons: 'people',
    owesTo: 'pays', settledAll: 'Everyone is settled up 🎉',
    markPaid: 'Mark paid', remind: 'Remind', payments: 'Payments made',
    byCategory: 'By category', byPerson: 'By person', paid: 'Paid', owedShare: 'Share owed',
    history: 'Edit history', readOnly: 'View-only mode', changeBg: 'Change background',
    confirmDel: 'Are you sure you want to delete?',
    deleteFailed: 'Could not delete the trip. Check your connection and try again.',
    errPayers: 'Payers must add up to the total.',
    errCustom: 'Custom amounts must add up to the total.',
    errParts: 'Pick at least 1 participant.', errName: 'Please enter a name.', errAmount: 'Invalid amount.',
    memberInUse: 'This member is used in expenses and cannot be removed.',
    gets: 'is owed', owes: 'owes', even: 'settled',
    notFound: 'Trip not found. You need internet to open a link for the first time.',
    remindText: (trip: any, a: any, b: any, amt: any) => `Reminder for "${trip}": ${a} pays ${b} ${amt}. Thanks!`,
    deleteTrip: 'Delete trip',
    adjustBg: 'Adjust background', pickImage: 'Choose another photo', dragHint: 'Drag the photo to move it, use the slider to zoom', zoom: 'Zoom', apply: 'Apply', resetFrame: 'Reset',
    remaining: 'Remaining', exceeded: 'Over by', sharedWith: 'Shared with', people_n: (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`,
    spentPerPerson: 'Average spend per person', expenses_n: (n: number) => `${n} expenses`, noHistory: 'No edits yet.',
    logTripNew: (n: any) => `Created trip "${n}"`,
    logExpAdd: (n: any, a: any) => `Added "${n}" (${a})`, logExpEdit: (n: any, a: any) => `Edited "${n}" (${a})`,
    logExpDel: (n: any) => `Deleted "${n}"`,
    logMemAdd: (n: any) => `Added member "${n}"`, logMemEdit: (n: any) => `Edited member "${n}"`, logMemDel: (n: any) => `Removed member "${n}"`,
    logPay: (a: any, b: any, amt: any) => `${a} paid ${b} ${amt}`, logPayDel: (a: any, b: any, amt: any) => `Undid payment ${a} → ${b} ${amt}`,
    logBg: 'Changed background',
    cat_food: 'Food', cat_transport: 'Transport', cat_stay: 'Lodging', cat_fun: 'Activities', cat_shop: 'Shopping', cat_other: 'Other',
  },
};

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  toggleTheme: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, ...args: any[]) => string;
}

const Ctx = createContext<I18n>(null as unknown as I18n);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('lang') === 'en' ? 'en' : 'vi'));
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme');
    const initialTheme =
      storedTheme === 'light' || storedTheme === 'dark'
        ? storedTheme
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    document.documentElement.dataset.theme = initialTheme;
    return initialTheme;
  });
  const setLang = useCallback((l: Lang) => {
    localStorage.setItem('lang', l);
    document.documentElement.lang = l;
    setLangState(l);
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      document.documentElement.dataset.theme = next;
      return next;
    });
  }, []);
  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      theme,
      toggleTheme,
      t: (key, ...args) => {
        const v = D[lang][key] ?? D.vi[key] ?? key;
        return typeof v === 'function' ? v(...args) : v;
      },
    }),
    [lang, setLang, theme, toggleTheme]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
