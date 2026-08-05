# KIỂM TRA CÂU HỎI VÀ ĐÁP ÁN — OS QUEST 11 V7.3

## 1. Phạm vi kiểm tra

Toàn bộ nội dung hỏi – đáp của hệ thống đã được rà soát, gồm:

- 40 câu trong ngân hàng kiểm tra cuối khóa.
- 8 câu “Kiểm tra 1 phút” trước các nhiệm vụ.
- 4 câu khởi động nhanh trên trang chủ.
- 5 câu tại Boss Stage.
- Khóa đáp án của 8 nhiệm vụ tương tác: phân loại chức năng, timeline, nhận diện giao diện, mô hình bốn tầng, quản lí tệp, tiện ích và thiết bị di động.

Căn cứ đối chiếu là hai tài liệu:

1. **Bài 1 – Hệ điều hành**, trang 5–9 của tài liệu.
2. **Bài 2 – Thực hành sử dụng hệ điều hành**, trang 10–14 của tài liệu.

## 2. Các nhóm kiến thức đã đối chiếu

| Nhóm câu hỏi | Nội dung đối chiếu trong tài liệu |
|---|---|
| Q01–Q05 | Năm nhóm chức năng của hệ điều hành; giao diện; Plug and Play |
| Q06–Q11 | Mốc Windows; UNIX, Linux 1991, Linux 1.0 năm 1994; Red Hat, SUSE, Ubuntu |
| Q12–Q16, Q38 | Cửa sổ, biểu tượng, Taskbar, Status bar, GUI và CLI |
| Q17–Q20, Q39–Q40 | Quan hệ Người dùng → Ứng dụng → Hệ điều hành → Phần cứng; dịch vụ tìm, mở, ghi tệp; điều phối tài nguyên |
| Q21–Q26 | Nháy đúp, nháy phải, Copy, Move, Move to Trash, quản lí tệp và thư mục |
| Q27–Q31 | Nén tệp, kiểm tra đĩa, Optimize/Defragment, gỡ phần mềm không cần thiết |
| Q32–Q37 | Cảm ứng, cảm biến, Wi-Fi, 3G/4G/5G, Bluetooth, NFC, Danh bạ, Lịch và quản lí ứng dụng |

## 3. Những nội dung đã chỉnh sau khi đối chiếu

- **Q11:** bỏ Debian vì danh sách trong tài liệu gồm Red Hat, SUSE và Ubuntu.
- **Q19:** thay tình huống máy in/driver bằng dịch vụ tìm và mở tệp, đúng với ví dụ được trình bày trong bài.
- **Q24:** dùng đúng lệnh “Move to Trash” xuất hiện trong hình giao diện Ubuntu.
- **Q36:** bỏ tiêu chí dung lượng/quyền truy cập vì tài liệu chỉ yêu cầu xem ứng dụng đã cài và xóa ứng dụng không cần thiết.
- **Q37:** thêm “Cổng VGA” làm phương án nhiễu để câu chọn nhiều luôn có ít nhất một phương án sai.
- **Q39:** chuyển sang nhận định về việc ứng dụng sử dụng dịch vụ hệ điều hành khi ghi dữ liệu vào tệp.
- **Q40:** dùng đúng cách diễn đạt “tổ chức thực hiện chương trình và điều phối tài nguyên”, không hỏi tên thành phần nội bộ ngoài phạm vi bài.
- **Nhiệm vụ 2 và sơ đồ timeline:** bỏ toàn bộ tham chiếu Debian.
- **Nhiệm vụ 4:** thay driver và bộ lập lịch bằng dịch vụ quản lí tệp, tìm/mở tệp và điều phối tài nguyên.
- **Nhiệm vụ 7:** đổi cách phân loại thành “đặc trưng nổi bật của thiết bị di động” và “chức năng chung”, tránh các trường hợp có thể thuộc cả máy tính và điện thoại.
- **Boss Stage trạm 5:** thay câu hỏi về dung lượng/quyền bằng yêu cầu xem ứng dụng đã cài và xóa ứng dụng không cần thiết.

## 4. Quy tắc chất lượng đã được kiểm thử tự động

Hệ thống có tệp kiểm thử `tests/content-audit.test.mjs` để kiểm tra:

- Đủ đúng 40 câu và không trùng mã câu hỏi.
- Mọi chỉ số đáp án đều hợp lệ.
- Câu một đáp án chỉ có một đáp án đúng.
- Câu nhiều đáp án luôn có ít nhất hai đáp án đúng và ít nhất một phương án nhiễu.
- Câu Đúng/Sai có đúng hai phương án “Đúng” và “Sai”.
- Không có phương án bị lặp trong cùng một câu.
- Đáp án đúng không phải phương án dài nhất một cách nổi bật.
- Có giải thích và gợi ý cho từng câu cuối khóa.
- Các mốc 1985, 1990, 1995, 2001, 2009, 2012, 2015, 2021; Linux 1991 và 1994 được kiểm tra bằng test.
- Không còn dữ kiện Debian hoặc yêu cầu “dung lượng, quyền truy cập và mức cần thiết” trong phần câu hỏi.
- Khóa đáp án của các nhiệm vụ tương tác có tập giá trị hợp lệ và không trùng lặp.

## 5. Luồng học liền mạch sau nhiệm vụ

Sau khi hoàn thành một nhiệm vụ, hệ thống hiện ngay hộp kết quả gồm:

- Điểm và số sao đạt được.
- XP nhận được.
- Thông báo rương thưởng mới nếu có.
- Tên nhiệm vụ tiếp theo đã được mở khóa.
- Nút chính **“Tiếp tục nhiệm vụ kế tiếp”**.
- Tùy chọn **“Ở lại xem kết quả”** hoặc **“Về bản đồ”**.

Ở nhiệm vụ cuối, nút chính được đổi thành **“Vào Boss Stage”**. Khi học sinh chọn tiếp tục, hệ thống mở thẳng cutscene của chương kế tiếp, không phải quay lại trang chủ.

## 6. Kết quả kiểm thử

- `npm run build`: đạt.
- `npm run lint`: đạt.
- `npm test`: **15/15 test đạt**.
