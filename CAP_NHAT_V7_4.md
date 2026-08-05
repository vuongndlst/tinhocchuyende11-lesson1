# OS QUEST 11 – Cập nhật V7.4

## Lỗi đã sửa

1. Trung tâm điều hành không còn gây nhầm ở mức 6/8:
   - Viết lại toàn bộ 8 tình huống theo ngữ cảnh rõ ràng.
   - Hiển thị chú giải cho 5 nhóm chức năng.
   - Chỉ rõ đáp án đúng ngay tại từng dòng có viền cam.
   - Hai tình huống dễ nhầm được đổi thành:
     - Phân chia thời gian CPU cho các chương trình đang chạy → Tổ chức chương trình và điều phối tài nguyên.
     - Tự động nhận biết máy in mới bằng Plug & Play → Quản lí thiết bị, CPU và bộ nhớ.

2. Popup hoàn thành nhiệm vụ:
   - Được xóa khỏi DOM trước khi chuyển trang.
   - Nút tiếp tục chuyển thẳng sang chặng kế tiếp.
   - Mọi popup tạm thời được dọn khi URL thay đổi.

3. Trang chủ:
   - Sửa màu tiêu đề, mô tả và nút trên nền sáng.
   - Không còn chữ trắng trên nền trắng.

4. Landing page theo từng chặng:
   - Mỗi nhiệm vụ mở bằng một trang giới thiệu riêng.
   - Hiển thị câu chuyện, mục tiêu, kiến thức cần dùng, thời lượng và XP.
   - Sau landing page, học sinh mới vào nội dung nhiệm vụ.

5. Cache trình duyệt:
   - Thêm phiên bản `v=7.4.0` vào CSS, ứng dụng và các module dữ liệu.
   - Thêm thẻ no-cache để giảm tình trạng trình duyệt tiếp tục dùng bản cũ.
   - Footer hiển thị `OS Quest 11 V7.4` để giáo viên kiểm tra đúng phiên bản.

## Kiểm tra

- `npm run build`
- `npm test` – 18/18
- `npm run lint`
