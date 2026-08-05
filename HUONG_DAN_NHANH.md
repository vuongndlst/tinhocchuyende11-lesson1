# HƯỚNG DẪN NHANH — OS QUEST 11

## 1. Một hệ thống duy nhất

Tệp ZIP bàn giao chứa toàn bộ dự án:

- `assets/`: nội dung, câu hỏi, lý thuyết và mã tương tác;
- `dist/`: bản production đã build sẵn;
- `tests/`: kiểm thử tự động;
- `.github/workflows/deploy.yml`: triển khai GitHub Pages;
- `README.md`: hướng dẫn chỉnh sửa chi tiết.

Không cần giữ hai tệp Source và Dist riêng biệt nữa.

## 2. Chạy trên máy Windows

1. Cài Node.js 20 trở lên.
2. Giải nén tệp ZIP.
3. Nháy đúp `CHAY_WEBSITE_WINDOWS.bat`.
4. Mở địa chỉ `http://localhost:5173` nếu trình duyệt chưa tự mở.

## 3. Đưa lên GitHub Pages

1. Tạo một repository GitHub mới.
2. Tải toàn bộ nội dung trong thư mục dự án lên nhánh `main`.
3. Vào **Settings → Pages**.
4. Chọn **Source: GitHub Actions**.
5. Chờ workflow hoàn tất.

## 4. Chỉnh nội dung

- Lý thuyết: `assets/theory.mjs`
- Câu hỏi: `assets/questions.mjs`
- Nhiệm vụ và huy hiệu: `assets/missions.mjs`
- Giao diện và hoạt động: `assets/app.mjs`
- Màu sắc: `assets/style.css`

Sau khi chỉnh sửa, chạy `npm run build` để cập nhật thư mục `dist/`.
