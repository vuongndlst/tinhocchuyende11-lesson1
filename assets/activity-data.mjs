export const dailyChallenges = [
  {
    id: 'warm-1',
    title: 'Nhiệm vụ 30 giây',
    prompt: 'Nếu em muốn có thêm một bản sao của tệp mà vẫn giữ bản gốc, em chọn thao tác nào?',
    options: ['Di chuyển tệp', 'Sao chép tệp', 'Xóa tệp gốc', 'Nén tệp dữ liệu'],
    correct: 1,
    explanation: 'Sao chép tạo thêm một bản mới và giữ nguyên bản gốc.',
  },
  {
    id: 'warm-2',
    title: 'Câu đố khởi động',
    prompt: 'Thành phần nào nằm giữa phần mềm ứng dụng và phần cứng?',
    options: ['Hệ điều hành', 'Phần mềm danh bạ', 'Ứng dụng trình duyệt', 'Một tệp hình ảnh'],
    correct: 0,
    explanation: 'Hệ điều hành là lớp trung gian giữa ứng dụng và phần cứng.',
  },
  {
    id: 'warm-3',
    title: 'Khởi động nhanh',
    prompt: 'Giao diện nào trực quan hơn với đa số người dùng mới?',
    options: ['CLI', 'GUI', 'BIOS', 'Driver'],
    correct: 1,
    explanation: 'GUI dùng cửa sổ, biểu tượng và nút bấm nên thường dễ làm quen hơn.',
  },
  {
    id: 'warm-4',
    title: 'Mini check-in',
    prompt: 'Cặp hệ điều hành di động phổ biến nhất trong bài học là gì?',
    options: ['DOS và UNIX', 'Android và iOS', 'Windows và Linux', 'ChromeOS và Ubuntu'],
    correct: 1,
    explanation: 'Android và iOS là hai hệ điều hành di động phổ biến.',
  },
]

export const bossStations = [
  {
    prompt: 'Điều phối CPU cho nhiều chương trình thuộc nhóm nào?',
    options: [
      'Quản lí tệp và thư mục trong các thiết bị lưu trữ ngoài',
      'Tổ chức chương trình và điều phối tài nguyên',
      'Cung cấp các tiện ích nâng cao hiệu quả sử dụng máy tính',
    ],
    correct: 1,
    hint: 'CPU là tài nguyên cần được hệ điều hành điều phối cho các tiến trình.',
  },
  {
    prompt: 'Thứ tự nào mô tả đúng luồng từ người dùng đến thiết bị vật lí?',
    options: [
      'Ứng dụng → Người dùng → Phần cứng → Hệ điều hành',
      'Người dùng → Phần cứng → Ứng dụng → Hệ điều hành',
      'Người dùng → Ứng dụng → Hệ điều hành → Phần cứng',
    ],
    correct: 2,
    hint: 'Hệ điều hành nằm giữa ứng dụng và phần cứng.',
  },
  {
    prompt: 'Cấu trúc nào hợp lí để lưu lí thuyết và thực hành?',
    options: [
      'HeDieuHanh/LyThuyet và HeDieuHanh/ThucHanh',
      'Desktop/TatCaTaiLieuKhongPhanLoai/TheoNgay',
      'LyThuyet/HeDieuHanh/ThucHanh/LyThuyet',
    ],
    correct: 0,
    hint: 'Dùng một thư mục chủ đề và hai thư mục con riêng cho lí thuyết và thực hành.',
  },
  {
    prompt: 'Muốn đóng gói nhiều tệp thành một tệp .zip, em chọn tiện ích nào?',
    options: ['Chụp màn hình hiện tại', 'Nén tệp và thư mục', 'Kiểm tra vùng lưu trữ'],
    correct: 1,
    hint: 'Nén tệp dùng để đóng gói dữ liệu thành tệp như .zip.',
  },
  {
    prompt: 'Trong phần quản lí ứng dụng trên thiết bị di động, thao tác nào phù hợp với yêu cầu của bài học?',
    options: [
      'Xem ứng dụng đã cài và xóa ứng dụng không cần thiết',
      'Xem danh bạ đã lưu và xóa những số điện thoại không còn dùng',
      'Xem lịch đã tạo và xóa những lời nhắc không còn cần thiết',
    ],
    correct: 0,
    hint: 'Bài học yêu cầu xem các ứng dụng đã cài và xóa ứng dụng không cần thiết.',
  },
]

export const mission1Items = [
  ['Phân chia thời gian CPU cho các chương trình đang chạy', 'program'],
  ['Quản lí bộ nhớ chính (RAM) để hệ thống sử dụng', 'device'],
  ['Tiếp nhận dữ liệu từ bàn phím', 'device'],
  ['Tạo thư mục để tổ chức tệp', 'data'],
  ['Nạp và tổ chức thực hiện một chương trình', 'program'],
  ['Hiển thị cửa sổ, biểu tượng và con trỏ', 'interface'],
  ['Tự động nhận biết máy in mới bằng Plug & Play', 'device'],
  ['Nén nhiều tệp thành gói .zip', 'utility'],
]

export const mission1Categories = [
  ['', 'Chọn nhóm chức năng'],
  ['device', 'Quản lí thiết bị, CPU và bộ nhớ'],
  ['data', 'Quản lí lưu trữ dữ liệu'],
  ['program', 'Tổ chức chương trình và điều phối tài nguyên'],
  ['interface', 'Cung cấp môi trường giao tiếp với người dùng'],
  ['utility', 'Cung cấp tiện ích hệ thống'],
]

export const windowsTimeline = [
  ['Windows 1', '1985'],
  ['Windows 3', '1990'],
  ['Windows 95', '1995'],
  ['Windows XP', '2001'],
  ['Windows 7', '2009'],
  ['Windows 8', '2012'],
  ['Windows 10', '2015'],
  ['Windows 11', '2021'],
]

export const mission3Targets = [
  ['icon', 'Biểu tượng'],
  ['window', 'Cửa sổ ứng dụng'],
  ['min', 'Nút thu nhỏ'],
  ['max', 'Nút phóng to'],
  ['close', 'Nút đóng'],
  ['taskbar', 'Thanh công việc'],
  ['status', 'Thanh trạng thái'],
]

export const mission4LayerCards = [
  ['Trình duyệt', 'app'],
  ['Phần mềm soạn thảo', 'app'],
  ['Trò chơi', 'app'],
  ['CPU', 'hardware'],
  ['RAM', 'hardware'],
  ['Bàn phím', 'hardware'],
  ['Máy in', 'hardware'],
  ['Dịch vụ quản lí tệp', 'os'],
  ['Dịch vụ tìm và mở tệp', 'os'],
  ['Điều phối tài nguyên cho ứng dụng', 'os'],
]

export const mission6UtilityMatches = [
  ['Chụp màn hình', 'Lưu hình ảnh đang hiển thị'],
  ['Nén tệp', 'Đóng gói và thường giảm dung lượng'],
  ['Giải nén tệp', 'Mở dữ liệu từ gói nén'],
  ['Gỡ ứng dụng', 'Loại phần mềm không cần thiết'],
  ['Quét lỗi', 'Tìm lỗi lưu trữ'],
  ['Gõ tiếng Việt', 'Nhập văn bản có dấu'],
]

export const mission7Features = [
  ['Thao tác vuốt, chạm', 'mobile'],
  ['Kết nối NFC', 'mobile'],
  ['Cảm biến vị trí', 'mobile'],
  ['Kết nối mạng di động 5G', 'mobile'],
  ['Danh bạ và gọi nhanh', 'mobile'],
  ['Đặt lịch, nhắc việc', 'mobile'],
  ['Quản lí tệp', 'common'],
  ['Chạy phần mềm ứng dụng', 'common'],
  ['Quản lí bộ nhớ', 'common'],
]
