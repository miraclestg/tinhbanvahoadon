# Tình Bạn Và Hóa Đơn (React + TypeScript + Tailwind + shadcn/ui)

Cùng tính năng và cùng định dạng dữ liệu Firestore với bản 1 (chuyến đi cũ vẫn mở được), giao diện làm lại theo phong cách shadcn/ui.

## Chạy
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # ra thư mục dist/ để đưa lên hosting
npm run preview
```
Cần Node 18+.

## Có gì mới
- **Căn chỉnh ảnh nền**: nút "Căn chỉnh ảnh nền" trên ảnh bìa. Kéo ảnh để di chuyển, kéo thanh trượt hoặc chụm hai ngón để phóng to. Khung căn chỉnh có cùng tỉ lệ 16:9 với ảnh bìa và thẻ ngoài danh sách nên ảnh hiển thị đúng như bạn thấy lúc canh. Mở lại nút đó để chỉnh tiếp, hoặc chọn ảnh khác.
- Giao diện kiểu shadcn/ui: hộp thoại dạng bottom sheet trên iPhone, avatar, badge, thanh thống kê, chế độ sáng/tối tự động.
- TypeScript chặt (`strict`), tách logic (`src/lib`) khỏi giao diện (`src/components`).

## Cấu trúc
| Đường dẫn | Vai trò |
|---|---|
| `src/firebase-config.ts` | Cấu hình Firebase của bạn |
| `src/lib/calc.ts` | Tính phần chia, số dư, rút gọn nợ, thống kê |
| `src/lib/store.ts` | IndexedDB (offline) + Firestore (đồng bộ) |
| `src/lib/trips.tsx` | State toàn app: chuyến đi, quyền chỉnh sửa, đồng bộ |
| `src/lib/i18n.tsx` | Tiếng Việt / English |
| `src/components/ui/*` | Thành phần kiểu shadcn (Button, Dialog, Tabs, ...) |
| `src/components/BgCropper.tsx` | Căn chỉnh ảnh nền |
| `src/components/TripView.tsx`, `TripTabs.tsx` | Màn hình chuyến đi |

Khi chuyến đi bị xóa trên Firestore, thiết bị người xem sẽ xóa bản sao IndexedDB và khóa chỉnh sửa khi nhận được cập nhật từ máy chủ. Thiết bị đang offline chỉ xóa bản sao sau khi kết nối lại và đồng bộ.

Các thành phần trong `src/components/ui` được viết tay theo đúng mẫu của shadcn/ui (Radix + Tailwind + cva). Nếu muốn thêm thành phần khác, chạy `npx shadcn@latest init` rồi `npx shadcn@latest add <tên>`; alias `@/` đã cấu hình sẵn.

## Đưa lên mạng (cần https cho iPhone)
Kéo-thả thư mục `dist/` lên Netlify, hoặc dùng Firebase Hosting / GitHub Pages. Vì dùng đường dẫn dạng `#/t/...` và `base: './'`, không cần cấu hình rewrite.
Trên iPhone: mở bằng Safari, Chia sẻ, **Thêm vào Màn hình chính**.

## Firestore rules
Dán `firestore.rules` vào Firebase Console, mục Firestore Database, tab Rules.

## Lưu ý
- Link chỉnh sửa chứa khóa bí mật, chỉ giữ cho trưởng nhóm.
- Khi tạo chuyến đi, người tạo có thể chọn tên thành viên của mình; tên này được giữ riêng cho người tạo và lựa chọn trên thiết bị chỉ cho phép đánh dấu đã trả những khoản người đó nhận lại. Người xem chỉ chọn được tên chưa được người khác chọn; sau lần xác nhận đầu, tên đã chọn được lưu trên thiết bị. Nếu cần xác nhận lại trên thiết bị khác, câu hỏi/câu trả lời sẽ xác minh thành viên.
- Xác nhận thành viên bằng câu hỏi bảo mật chỉ khóa thao tác trong giao diện. Câu trả lời được lưu dưới dạng SHA-256 cùng chuyến đi; người có link vẫn có thể bỏ qua giao diện hoặc dò câu trả lời. Không dùng chức năng này như một cơ chế bảo mật.
- Firestore Rules cho phép người biết ID chuyến đi đọc/ghi dữ liệu; không chia sẻ link với người không tin cậy.
- Ảnh bìa lưu chung trong tài liệu chuyến đi (khoảng 80–150 KB), ảnh hóa đơn lưu riêng.
