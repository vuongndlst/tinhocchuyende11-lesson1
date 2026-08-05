export const theorySections = [
  {
    id: 'overview',
    missionIds: [0],
    icon: '⏻',
    title: 'Hệ điều hành là gì?',
    summary: 'Hệ điều hành là phần mềm nền tảng giúp người dùng và ứng dụng khai thác phần cứng của thiết bị một cách thuận tiện, an toàn và hiệu quả.',
    bullets: [
      'Tiếp nhận yêu cầu từ người dùng và từ phần mềm ứng dụng.',
      'Điều phối CPU, bộ nhớ và các thiết bị ngoại vi.',
      'Tổ chức dữ liệu bằng tệp và thư mục.',
      'Cung cấp giao diện để người dùng thao tác với máy tính.',
    ],
    example: 'Khi em mở một tệp, hệ điều hành tìm tệp trong bộ nhớ lưu trữ, chọn ứng dụng phù hợp và hiển thị nội dung trên màn hình.',
    check: 'Nếu không có hệ điều hành, người dùng sẽ phải can thiệp trực tiếp vào rất nhiều hoạt động của phần cứng.',
    keywords: ['Operating System', 'phần mềm nền tảng', 'tài nguyên'],
    quickCheck: {
      prompt: 'Trong mô hình hệ thống, thành phần nào nằm giữa ứng dụng và phần cứng?',
      options: ['Người dùng cuối', 'Hệ điều hành', 'Phần mềm ứng dụng khác'],
      correct: 1,
      explanation: 'Hệ điều hành cung cấp dịch vụ để ứng dụng khai thác phần cứng.',
    },
    media: {
      images: [
        { src: 'assets/media/overview-diagram.svg', alt: 'Sơ đồ bốn tầng: người dùng, phần mềm ứng dụng, hệ điều hành và phần cứng.', caption: 'Sơ đồ tổng quát cho thấy hệ điều hành là lớp trung gian giữa phần mềm và phần cứng.', sourceName: 'OS Quest 11', license: 'Tự thiết kế' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Windows_11_screenshot.png', fallback: 'assets/media/overview-diagram.svg', alt: 'Ảnh chụp giao diện Windows 11 với nhiều cửa sổ và menu Start.', caption: 'Một ví dụ thực tế về giao diện hệ điều hành trên máy tính cá nhân.', sourceName: 'Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Windows_11_screenshot.png', license: 'Theo trang mô tả tệp' },
      ],
      videos: [
        { youtubeId: 'pVzRTmdd9j0', title: 'What is an Operating System as Fast As Possible', channel: 'Techquickie', description: 'Video ngắn khoảng 5 phút, phù hợp để khởi động chủ đề.', note: 'Bật phụ đề tự động; tập trung vào vai trò quản lí tài nguyên và thiết bị.' },
      ],
    },
  },
  {
    id: 'functions',
    missionIds: [1],
    icon: '🧠',
    title: 'Năm nhóm chức năng chính',
    summary: 'Các công việc của hệ điều hành có thể được sắp xếp thành năm nhóm chức năng.',
    bullets: [
      'Quản lí thiết bị: CPU, bộ nhớ và thiết bị ngoại vi.',
      'Quản lí lưu trữ dữ liệu: tệp và thư mục.',
      'Tổ chức thực hiện chương trình và điều phối tài nguyên.',
      'Cung cấp môi trường giao tiếp với người dùng.',
      'Cung cấp các tiện ích giúp sử dụng máy tính hiệu quả hơn.',
    ],
    example: 'Nhận tín hiệu từ bàn phím thuộc quản lí thiết bị; tạo thư mục thuộc quản lí dữ liệu; hiển thị cửa sổ thuộc giao tiếp với người dùng.',
    check: 'Một công việc có thể liên quan đến nhiều thành phần, nhưng em nên xếp theo mục đích chính được nhấn mạnh trong tình huống.',
    keywords: ['thiết bị', 'dữ liệu', 'chương trình', 'giao diện', 'tiện ích'],
    quickCheck: {
      prompt: 'Tạo một thư mục mới thuộc nhóm chức năng nào?',
      options: ['Quản lí dữ liệu', 'Quản lí thiết bị', 'Giao tiếp người dùng'],
      correct: 0,
      explanation: 'Thư mục được dùng để tổ chức dữ liệu trong bộ nhớ lưu trữ.',
    },
    media: {
      images: [
        { src: 'assets/media/os-functions-map.svg', alt: 'Sơ đồ 5 nhóm chức năng chính của hệ điều hành.', caption: 'Mỗi nhóm chức năng có một nhiệm vụ riêng nhưng đều phục vụ việc vận hành hệ thống.', sourceName: 'OS Quest 11', license: 'Tự thiết kế' },
      ],
      videos: [
        { youtubeId: '26QPDBe-NB8', title: 'Operating Systems: Crash Course Computer Science #18', channel: 'CrashCourse', description: 'Video hoạt hình giải thích lịch sử và chức năng của hệ điều hành.', note: 'Có thể xem chọn lọc 0:00–5:30 cho phần vai trò và điều phối tài nguyên.', start: 0 },
      ],
    },
  },
  {
    id: 'history',
    missionIds: [2],
    icon: '◷',
    title: 'Windows, Linux và xu hướng phát triển',
    summary: 'Hệ điều hành máy tính cá nhân phát triển theo hướng ngày càng trực quan, dễ sử dụng và tự nhận biết thiết bị tốt hơn.',
    bullets: [
      'Windows: 1985, 1990, 1995, 2001, 2009, 2012, 2015 và 2021 là các mốc tiêu biểu trong bài học.',
      'Linux có nguồn gốc tư tưởng từ UNIX; Linus Torvalds phát triển Linux từ năm 1991.',
      'Linux 1.0 được công bố năm 1994.',
      'Linux là hệ điều hành mã nguồn mở; các bản phân phối tiêu biểu gồm Red Hat, SUSE và Ubuntu.',
    ],
    example: 'Windows nhấn mạnh hệ sinh thái máy tính cá nhân; Linux được phát triển bởi cộng đồng và được dùng trên máy tính, máy chủ cùng nhiều thiết bị khác.',
    check: 'Mã nguồn mở không đồng nghĩa với “luôn miễn phí”; trọng tâm là quyền tiếp cận, sử dụng và phát triển mã nguồn theo giấy phép.',
    keywords: ['Windows', 'Linux', 'UNIX', 'open source'],
    quickCheck: {
      prompt: 'Linux bắt đầu được Linus Torvalds phát triển vào năm nào?',
      options: ['1985', '1991', '1994'],
      correct: 1,
      explanation: 'Linux bắt đầu được phát triển từ năm 1991; Linux 1.0 được công bố năm 1994.',
    },
    media: {
      images: [
        { src: 'assets/media/timeline-windows-linux.svg', alt: 'Dòng thời gian gồm các mốc quan trọng của Windows và Linux.', caption: 'Sơ đồ giúp ghi nhớ thứ tự các mốc quan trọng.', sourceName: 'OS Quest 11', license: 'Tự thiết kế' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Ubuntu_26.04_LTS_desktop.png', fallback: 'assets/media/timeline-windows-linux.svg', alt: 'Ảnh chụp màn hình desktop Ubuntu 26.04 LTS.', caption: 'Giao diện desktop của một bản phân phối Linux hiện đại.', sourceName: 'Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ubuntu_26.04_LTS_desktop.png', license: 'GPL / free software screenshot' },
      ],
      videos: [
        { youtubeId: '26QPDBe-NB8', title: 'Operating Systems: Crash Course Computer Science #18', channel: 'CrashCourse', description: 'Phần sau video trình bày UNIX, Windows và ảnh hưởng đến các hệ điều hành hiện đại.', note: 'Gợi ý xem từ khoảng 9:00 để tập trung vào UNIX, Windows và hệ điều hành hiện đại.', start: 540 },
      ],
    },
  },
  {
    id: 'interface',
    missionIds: [3],
    icon: '🖥️',
    title: 'Giao diện hệ điều hành',
    summary: 'Giao diện là môi trường giúp người dùng gửi lệnh và nhận phản hồi từ máy tính.',
    bullets: [
      'Giao diện dòng lệnh (CLI) yêu cầu nhập câu lệnh bằng văn bản.',
      'Giao diện đồ họa (GUI) sử dụng cửa sổ, biểu tượng, con trỏ và các nút lệnh.',
      'Thanh công việc giúp mở hoặc chuyển nhanh giữa các ứng dụng.',
      'Thanh trạng thái hiển thị thông tin về trạng thái hoạt động của hệ thống.',
      'Cửa sổ thường có các nút thu nhỏ, phóng to và đóng.',
    ],
    example: 'Nháy vào biểu tượng thư mục để mở File Explorer là một thao tác trên giao diện đồ họa.',
    check: 'GUI thường trực quan hơn, nhưng CLI vẫn hữu ích trong nhiều công việc quản trị và tự động hóa.',
    keywords: ['GUI', 'CLI', 'cửa sổ', 'Taskbar', 'Status bar'],
    quickCheck: {
      prompt: 'Đặc điểm nào phù hợp nhất với giao diện CLI?',
      options: ['Nhập câu lệnh bằng văn bản', 'Chọn lệnh bằng biểu tượng đồ họa', 'Kéo thả cửa sổ bằng con trỏ chuột'],
      correct: 0,
      explanation: 'CLI sử dụng các câu lệnh dạng văn bản để giao tiếp với hệ điều hành.',
    },
    media: {
      images: [
        { src: 'assets/media/gui-cli-compare.svg', alt: 'Bảng so sánh giao diện đồ họa và giao diện dòng lệnh.', caption: 'GUI và CLI đều hữu ích trong những tình huống khác nhau.', sourceName: 'OS Quest 11', license: 'Tự thiết kế' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Linux_command-line._Bash._GNOME_Terminal._screenshot.png', fallback: 'assets/media/gui-cli-compare.svg', alt: 'Ảnh chụp giao diện dòng lệnh Bash trong GNOME Terminal.', caption: 'Ví dụ thực tế về giao diện dòng lệnh trên Linux.', sourceName: 'Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Linux_command-line._Bash._GNOME_Terminal._screenshot.png', license: 'GPL' },
      ],
      videos: [
        { youtubeId: 'psDpbWscPuE', title: 'User Operating System Interface', channel: 'Neso Academy', description: 'Giải thích hai kiểu giao diện CLI và GUI.', note: 'Video bằng tiếng Anh; học sinh nên bật phụ đề và ghi lại 2 điểm khác nhau.' },
      ],
    },
  },
  {
    id: 'layers',
    missionIds: [4],
    icon: '⇄',
    title: 'Quan hệ giữa người dùng, ứng dụng, hệ điều hành và phần cứng',
    summary: 'Hệ điều hành nằm giữa phần mềm ứng dụng và phần cứng, cung cấp các dịch vụ để ứng dụng khai thác thiết bị.',
    bullets: [
      'Người dùng thao tác với phần mềm ứng dụng.',
      'Ứng dụng gửi yêu cầu đến hệ điều hành.',
      'Hệ điều hành quản lí tài nguyên và thiết bị để thực hiện yêu cầu.',
      'Phần cứng thực hiện hoạt động vật lí như xử lí, lưu trữ và hiển thị dữ liệu.',
    ],
    example: 'Khi mở tệp: người dùng chọn tệp → ứng dụng gửi yêu cầu → hệ điều hành tìm kiếm và mở tệp trong bộ nhớ ngoài.',
    check: 'Phần mềm ứng dụng không tự điều khiển trực tiếp việc đọc, ghi dữ liệu mà sử dụng các dịch vụ do hệ điều hành cung cấp.',
    keywords: ['người dùng', 'ứng dụng', 'hệ điều hành', 'phần cứng', 'dịch vụ hệ điều hành'],
    quickCheck: {
      prompt: 'Khi ứng dụng muốn tìm và mở một tệp, thành phần nào cung cấp dịch vụ thực hiện yêu cầu đó?',
      options: ['Hệ điều hành', 'Chỉ màn hình', 'Tệp hình nền'],
      correct: 0,
      explanation: 'Hệ điều hành cung cấp các dịch vụ tìm kiếm và mở tệp cho phần mềm ứng dụng.',
    },
    media: {
      images: [
        { src: 'assets/media/layers-print-flow.svg', alt: 'Sơ đồ luồng xử lí yêu cầu mở tệp dữ liệu.', caption: 'Ví dụ mở tệp giúp thấy rõ vai trò cầu nối của hệ điều hành.', sourceName: 'OS Quest 11', license: 'Tự thiết kế' },
      ],
      videos: [
        { youtubeId: 'pVzRTmdd9j0', title: 'What is an Operating System as Fast As Possible', channel: 'Techquickie', description: 'Phần giữa video mô tả system call, driver và quản lí bộ nhớ.', note: 'Gợi ý xem từ khoảng 0:45 đến 2:30.', start: 45 },
      ],
    },
  },
  {
    id: 'files',
    missionIds: [5],
    icon: '📁',
    title: 'Quản lí tệp và thư mục',
    summary: 'Trình quản lí tệp giúp người dùng tổ chức dữ liệu theo cấu trúc thư mục và thực hiện các thao tác an toàn.',
    bullets: [
      'Mở, tạo mới và đổi tên tệp hoặc thư mục.',
      'Sao chép để tạo thêm một bản; di chuyển để đổi vị trí.',
      'Xóa và khôi phục từ Thùng rác khi còn có thể.',
      'Nháy phải để mở menu ngữ cảnh phù hợp với đối tượng.',
      'Chọn ứng dụng phù hợp để mở từng loại tệp.',
    ],
    example: 'Muốn giữ tệp gốc trong Documents và có thêm một bản trong USB, em cần sao chép thay vì di chuyển.',
    check: 'Trong phòng lab, mọi tệp đều là dữ liệu mô phỏng; website không truy cập tệp thật trên thiết bị.',
    keywords: ['tệp', 'thư mục', 'sao chép', 'di chuyển', 'Thùng rác'],
    quickCheck: {
      prompt: 'Muốn giữ tệp gốc và tạo thêm một bản ở USB, em chọn thao tác nào?',
      options: ['Di chuyển', 'Sao chép', 'Đổi tên'],
      correct: 1,
      explanation: 'Sao chép tạo thêm bản mới và giữ nguyên bản gốc.',
    },
    media: {
      images: [
        { src: 'assets/media/file-management-workflow.svg', alt: 'Sơ đồ các thao tác quản lí tệp và thư mục.', caption: 'Sơ đồ nhắc nhanh sự khác nhau giữa sao chép, di chuyển và xóa.', sourceName: 'OS Quest 11', license: 'Tự thiết kế' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Windows_11_Explorer_Screenshot_2025-04-21_180801.png', fallback: 'assets/media/file-management-workflow.svg', alt: 'Ảnh chụp giao diện Windows Explorer với thông tin ổ đĩa.', caption: 'Một ví dụ về trình quản lí tệp và vùng lưu trữ trên Windows.', sourceName: 'Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Windows_11_Explorer_Screenshot_2025-04-21_180801.png', license: 'Theo trang mô tả tệp' },
      ],
      videos: [
        { youtubeId: 'KN8YgJnShPM', title: 'Files & File Systems: Crash Course Computer Science #20', channel: 'CrashCourse', description: 'Giải thích cách máy tính tổ chức tệp và hệ thống tệp.', note: 'Video mở rộng; học sinh có thể xem 0:00–4:00 trước khi vào File Explorer Lab.' },
      ],
    },
  },
  {
    id: 'utilities',
    missionIds: [6],
    icon: '🛠️',
    title: 'Tiện ích hệ điều hành',
    summary: 'Tiện ích là các công cụ hỗ trợ bảo trì, tổ chức dữ liệu và nâng cao hiệu quả sử dụng thiết bị.',
    bullets: [
      'Chụp màn hình; gõ tiếng Việt; nén và giải nén tệp.',
      'Kiểm tra hoặc quét để phát hiện một số lỗi liên quan đến lưu trữ.',
      'Gỡ phần mềm không còn cần thiết.',
      'Tối ưu hóa hoặc hợp mảnh minh họa cách tổ chức dữ liệu trên ổ đĩa.',
    ],
    example: 'Nén nhiều tệp thành một gói .zip giúp lưu trữ và chia sẻ thuận tiện hơn.',
    check: 'Không thực hiện hợp mảnh một cách máy móc trên mọi loại ổ đĩa; hoạt động trong website chỉ là mô phỏng giáo dục.',
    keywords: ['utility', 'Check', 'Scan', 'Optimize', 'Repair'],
    quickCheck: {
      prompt: 'Tiện ích nào phù hợp để đóng gói nhiều tệp thành một tệp .zip?',
      options: ['Chụp màn hình', 'Nén tệp', 'Kiểm tra ổ đĩa'],
      correct: 1,
      explanation: 'Tiện ích nén tệp giúp đóng gói dữ liệu thành một gói như .zip.',
    },
    media: {
      images: [
        { src: 'assets/media/utilities-disk-illustration.svg', alt: 'Minh họa tổ chức dữ liệu trên ổ đĩa và ý nghĩa của các tiện ích kiểm tra.', caption: 'Hình dùng để giải thích nguyên lí, không khuyến khích thao tác máy móc trên ổ đĩa thật.', sourceName: 'OS Quest 11', license: 'Tự thiết kế' },
      ],
      videos: [],
    },
  },
  {
    id: 'mobile',
    missionIds: [7],
    icon: '📱',
    title: 'Hệ điều hành cho thiết bị di động',
    summary: 'Hệ điều hành di động được tối ưu cho thao tác cảm ứng, cảm biến, kết nối không dây và các tiện ích cá nhân.',
    bullets: [
      'Hỗ trợ chạm, vuốt, kéo và nhiều cảm biến.',
      'Ưu tiên kết nối Wi‑Fi, mạng di động, Bluetooth và NFC.',
      'Tích hợp danh bạ, lịch, nhắc việc và quản lí ứng dụng.',
      'Android và iOS là hai hệ điều hành di động phổ biến được nêu trong bài học.',
    ],
    example: 'Trong mục quản lí ứng dụng, người dùng có thể xem các ứng dụng đã cài và xóa ứng dụng không cần thiết.',
    check: 'Chỉ dùng dữ liệu giả trong mô phỏng; không nhập số điện thoại hoặc thông tin cá nhân thật.',
    keywords: ['Android', 'iOS', 'cảm ứng', 'cảm biến', 'NFC'],
    quickCheck: {
      prompt: 'Đặc điểm nào nổi bật trên hệ điều hành di động?',
      options: ['Tối ưu cho cảm ứng và cảm biến', 'Chỉ điều khiển bằng bàn phím cơ học', 'Không hỗ trợ các kết nối không dây'],
      correct: 0,
      explanation: 'Hệ điều hành di động được tối ưu cho thao tác cảm ứng, cảm biến và kết nối không dây.',
    },
    media: {
      images: [
        { src: 'assets/media/mobile-os-features.svg', alt: 'Minh họa một điện thoại thông minh và các đặc điểm chính của hệ điều hành di động.', caption: 'Thiết bị di động chú trọng cảm ứng, kết nối không dây và tiện ích cá nhân.', sourceName: 'OS Quest 11', license: 'Tự thiết kế' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Android_17_Homescreen.png', fallback: 'assets/media/mobile-os-features.svg', alt: 'Ảnh chụp màn hình chính Android 17.', caption: 'Một ví dụ thực tế về giao diện hệ điều hành di động.', sourceName: 'Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Android_17_Homescreen.png', license: 'Apache License / free software screenshot' },
      ],
      videos: [
        { youtubeId: 'sxwWEbdxkhw', title: 'Android operating system explained simply and briefly', channel: 'm3 [Erklärung und mehr]', description: 'Video dưới 4 phút giới thiệu ngắn gọn về hệ điều hành Android.', note: 'Bật phụ đề tự động; chú ý các đặc điểm cảm ứng, ứng dụng và hệ sinh thái.' },
      ],
    },
  },
]

export function getTheoryForMission(missionId) {
  return theorySections.find((section) => section.missionIds.includes(missionId))
}
