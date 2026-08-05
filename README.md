# OS QUEST 11 — Khám phá hệ điều hành

Website học tập tương tác bằng tiếng Việt dành cho học sinh lớp 11 Trường THCS và THPT Đinh Thiện Lý. Nội dung bám sát hai bài **Hệ điều hành** và **Thực hành sử dụng hệ điều hành**.

## Bản bàn giao duy nhất

Toàn bộ **source code, bản build `dist/`, tài liệu hướng dẫn, test và cấu hình GitHub Pages** nằm trong cùng một thư mục dự án. Thầy chỉ cần giữ và chia sẻ **một tệp ZIP duy nhất**.

Dự án được xây dựng dưới dạng **website tĩnh dùng ES Modules, không phụ thuộc thư viện JavaScript bên ngoài**. Hình Internet và video YouTube là học liệu bổ sung; các sơ đồ cốt lõi vẫn được lưu cục bộ. Cách này giúp:

- chạy ngay trên GitHub Pages;
- `npm install` không cần tải package;
- không phụ thuộc backend để vận hành các nhiệm vụ cốt lõi;
- dễ sao chép, chỉnh sửa và lưu trữ lâu dài.

## Tính năng đã hoàn thành

- Trang **Kiến thức nền** gồm 8 chủ đề ngắn, ví dụ thực tế, từ khóa, hình ảnh có ghi nguồn và video YouTube được tuyển chọn.
- Video được tải theo yêu cầu sau khi học sinh bấm phát; mỗi video có gợi ý đoạn xem hoặc nhiệm vụ quan sát.
- Mỗi nhiệm vụ có quy trình trực quan: **Học nhanh → Quan sát → Thực hành → Nhận XP** và một câu kiểm tra 1 phút.
- Trang chủ có lời chào cá nhân, lộ trình gợi ý hôm nay và trợ lý “Coach OS”.
- Trang **Nguồn học liệu** tổng hợp video, hình ảnh, liên kết nguồn và giấy phép/ghi chú.
- Mỗi nhiệm vụ luôn hiển thị phần lý thuyết liên quan trước hoạt động thực hành.
- 8 nhiệm vụ tương tác, mở khóa tuần tự.
- XP, 5 cấp độ và 7 huy hiệu.
- Timeline Windows và Linux.
- Hoạt động nhận diện giao diện đồ họa.
- Mô hình người dùng → ứng dụng → hệ điều hành → phần cứng.
- File Explorer Lab dùng dữ liệu ảo: tạo thư mục, đổi tên, sao chép, di chuyển, xóa, khôi phục, chọn nhiều, menu chuột phải, mở bằng ứng dụng và hoàn tác.
- System Utilities Lab: Check, Scan, Optimize, Repair và ghép tiện ích với mục đích.
- Mobile OS Lab: danh bạ, lịch, nhắc việc và quản lí ứng dụng.
- Escape Room gồm 5 trạm.
- Ngân hàng 40 câu đã viết lại theo câu hoàn chỉnh, nêu rõ yêu cầu chọn một đáp án, nhiều đáp án hoặc Đúng/Sai; mỗi lượt chọn ngẫu nhiên 15 câu.
- Sau khi nộp bài, học sinh nhận giải thích và đáp án đúng đối với câu làm sai.
- Lưu tiến trình bằng localStorage; xuất, nhập JSON và xóa dữ liệu có xác nhận.
- Chứng chỉ A4 ngang; chỉ mở khi đủ điều kiện; hỗ trợ **In / lưu PDF** bằng hộp thoại in của trình duyệt.
- Responsive desktop/mobile, dark mode, chữ lớn, giảm chuyển động và focus state rõ ràng.
- GitHub Actions tự động kiểm thử, build và deploy.

## Kiến trúc thư mục

```text
assets/
  app.mjs          # giao diện, router và toàn bộ hoạt động tương tác
  core.mjs         # tiến trình, XP, chấm điểm, chứng chỉ, localStorage
  missions.mjs     # 8 nhiệm vụ, cấp độ và huy hiệu
  questions.mjs    # ngân hàng 40 câu rõ nghĩa
  theory.mjs       # kiến thức nền, kiểm tra nhanh, hình và video
  media/            # sơ đồ SVG cục bộ dùng cả khi mạng không ổn định
  style.css        # design system và responsive
scripts/
  dev-server.mjs   # máy chủ local dùng Node.js thuần
  build.mjs        # tạo thư mục dist
  lint.mjs         # kiểm tra JavaScript cơ bản
  format-check.mjs
tests/
  core.test.mjs
.github/workflows/deploy.yml
index.html
```

## Chạy nhanh trên Windows

Giải nén dự án rồi nháy đúp tệp `CHAY_WEBSITE_WINDOWS.bat`. Trình duyệt sẽ mở tại `http://localhost:5173`. Máy cần cài Node.js 20 trở lên.

## Chạy local bằng Terminal

Yêu cầu Node.js 20 trở lên, khuyến nghị Node.js 22.

```bash
npm install
npm run dev
```

Mở địa chỉ:

```text
http://localhost:5173
```

## Kiểm thử và build

```bash
npm run lint
npm run test
npm run build
npm run preview
```

Bản production được tạo trong `dist/`.

## Deploy GitHub Pages

1. Tạo repository GitHub và đưa toàn bộ dự án lên nhánh `main`.
2. Vào **Settings → Pages → Build and deployment**.
3. Chọn **Source: GitHub Actions**.
4. Workflow `.github/workflows/deploy.yml` sẽ chạy test, build và deploy tự động.

Website dùng hash routing (`#/mission/1`, `#/quiz`...), vì vậy không xảy ra lỗi 404 khi làm mới trang trên GitHub Pages.

## Vị trí giáo viên có thể chỉnh sửa

- Tên, XP, thời lượng, cấp độ và huy hiệu: `assets/missions.mjs`.
- Ngân hàng câu hỏi, đáp án, giải thích và gợi ý: `assets/questions.mjs`.
- Toàn bộ kiến thức nền hiển thị trước nhiệm vụ: `assets/theory.mjs`.
- Nội dung hoạt động và chứng chỉ: `assets/app.mjs`.
- Điều kiện cấp chứng chỉ: hàm `canIssueCertificate()` trong `assets/core.mjs`.
- Màu sắc, kích thước và responsive: `assets/style.css`.
- Tên giáo viên và trường: tìm `Nguyễn Đình Vương` hoặc `ĐINH THIỆN LÝ` trong `assets/app.mjs`.
- Logo chứng chỉ: thay khối `.logo-placeholder` trong phần chứng chỉ.

## Điều kiện chứng chỉ mặc định

- Hoàn thành 8/8 nhiệm vụ.
- Vượt qua Escape Room.
- Điểm bài kiểm tra tốt nhất từ 80%.
- Tổng XP tối thiểu 750.

## Quyền riêng tư

- Không dùng camera hoặc microphone.
- Không yêu cầu số điện thoại thật.
- Các tệp, liên hệ và ứng dụng trong mô phỏng là dữ liệu ảo.
- Tên hiển thị, lớp và dữ liệu học tập chỉ lưu trong localStorage cho đến khi người dùng chủ động xuất tệp JSON.
- Ảnh Wikimedia được tải từ nguồn ngoài; trình phát YouTube chỉ tải sau khi người học bấm phát.
- `.env.example` được giữ để nhà trường có thể tích hợp Supabase sau này; bản hiện tại không đồng bộ tiến trình lên máy chủ.

## Học liệu bên ngoài

- Danh sách nguồn và giấy phép/ghi chú nằm trong `NGUON_HOC_LIEU.md` và trang `#/sources`.
- Video YouTube và ảnh Internet cần kết nối mạng; sơ đồ SVG nội bộ vẫn hiển thị khi mạng yếu.
- Giáo viên nên xem trước video vì phụ đề tự động và trạng thái cho phép nhúng có thể thay đổi.

## Giới hạn còn tồn tại

- Nút chứng chỉ sử dụng chức năng in của trình duyệt; học sinh chọn **Save as PDF / Lưu dưới dạng PDF** để tạo tệp PDF có tiếng Việt đầy đủ.
- Supabase Auth và đồng bộ tiến trình chưa bật vì cần schema, tài khoản dự án và chính sách RLS của nhà trường.
- Âm thanh chưa được thêm để tránh tự phát và giảm tải trang.

## Điểm mới của V7

- Học sinh phải nhập đúng **họ tên và lớp** trước khi truy cập hệ thống.
- Hồ sơ người học tự động điền vào chứng chỉ cuối khóa.
- Mỗi nhiệm vụ có cutscene với mascot Byte.
- Nhiệm vụ được hiển thị theo thang 1–3 sao.
- Boss Stage có 3 pha và thanh năng lượng động.

> Lưu ý: họ tên và lớp được lưu cục bộ bằng `localStorage` trong cấu hình mặc định.

## Cập nhật V7.2

- Học sinh bắt buộc nhập họ tên và lớp trước khi truy cập nội dung học.
- Sau khi hoàn thành nhiệm vụ, hệ thống hiện hộp kết quả và nút chuyển thẳng sang nhiệm vụ kế tiếp; nhiệm vụ cuối chuyển sang Boss Stage.
- Toàn bộ câu hỏi, phương án và khóa đáp án đã được đối chiếu lại với hai bài học nguồn.
- Dữ liệu câu hỏi hoạt động được tập trung tại `assets/activity-data.mjs`.
- Kiểm tra chất lượng nội dung nằm tại `tests/content-audit.test.mjs`.
- Báo cáo rà soát chi tiết: `KIEM_TRA_CAU_HOI_DAP_AN.md`.
