import { missions, badges, levels } from './missions.mjs'
import { questions } from './questions.mjs'
import {
  createInitialProgress,
  getLevel,
  isMissionUnlocked,
  completeMissionState,
  canTakeFinal,
  canTakeQuiz,
  canIssueCertificate,
  calculateQuizPercent,
  selectRandom,
  generateCertificateCode,
  loadProgress,
  saveProgress,
  validateProgress,
  STORAGE_KEY,
} from './core.mjs'

let progress = loadProgress()
let pendingToast = ''
const app = document.querySelector('#app')

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char])
}

function applySettings() {
  document.documentElement.dataset.theme = progress.settings.theme
  document.documentElement.dataset.motion = progress.settings.reducedMotion ? 'reduced' : 'full'
  document.documentElement.dataset.text = progress.settings.largeText ? 'large' : 'normal'
}

function persist() {
  saveProgress(progress)
  applySettings()
}

function setToast(message) {
  pendingToast = message
}

function showToast(message) {
  let toast = document.querySelector('.toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.className = 'toast'
    document.body.append(toast)
  }
  toast.textContent = message
  toast.classList.add('show')
  clearTimeout(showToast.timer)
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 3200)
}

function navItem(href, icon, label, active = false, disabled = false, complete = false) {
  if (disabled) return `<span class="nav-item nav-disabled"><span>🔒</span><span>${esc(label)}</span></span>`
  return `<a class="nav-item ${active ? 'active' : ''}" href="#${href}"><span>${icon}</span><span>${esc(label)}</span>${complete ? '<b>✓</b>' : ''}</a>`
}

function shell(content, route) {
  const completed = missions.filter((mission) => progress.missions[mission.id]?.completed).length
  const percent = Math.round(completed / missions.length * 100)
  const level = getLevel(progress.totalXp)
  const sidebar = missions.map((mission) => navItem(`/mission/${mission.id}`, mission.icon, `${mission.id}. ${mission.title}`, route === `/mission/${mission.id}`, !isMissionUnlocked(progress, mission.id), progress.missions[mission.id]?.completed)).join('')
  app.innerHTML = `
    <a class="skip-link" href="#main-content">Bỏ qua điều hướng</a>
    <div class="app-shell">
      <aside class="sidebar">
        <a href="#/" class="brand"><span class="brand-mark">OS</span><span><strong>OS QUEST 11</strong><small>Khám phá hệ điều hành</small></span></a>
        <nav class="mission-nav" aria-label="Nhiệm vụ">
          ${sidebar}
          ${navItem('/final', '🚨', 'Escape Room', route === '/final')}
          ${navItem('/quiz', '📝', 'Kiểm tra cuối khóa', route === '/quiz')}
          ${navItem('/certificate', '🎓', 'Chứng chỉ', route === '/certificate')}
        </nav>
        <div class="sidebar-progress"><div class="progress-label"><span>Hành trình</span><strong>${percent}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div><div class="xp-line"><strong>${progress.totalXp} XP</strong><span>${esc(level.name)}</span></div></div>
      </aside>
      <div class="main-column">
        <header class="topbar"><div><strong>${progress.totalXp} XP</strong><span class="topbar-level"> · ${esc(level.name)}</span></div><div class="top-actions"><button class="icon-button" id="themeToggle" aria-label="Đổi chế độ sáng tối">${progress.settings.theme === 'light' ? '🌙' : '☀️'}</button><button class="icon-button" id="textToggle" aria-label="Bật chữ lớn">A+</button><a class="button button-small button-ghost" href="#/progress">Tiến trình</a></div></header>
        <main id="main-content" class="content">${content}</main>
        <footer class="site-footer"><span>OS Quest 11 · Giáo viên: Nguyễn Đình Vương</span><a href="#/privacy">Quyền riêng tư</a></footer>
      </div>
    </div>`
  document.querySelector('#themeToggle')?.addEventListener('click', () => {
    progress.settings.theme = progress.settings.theme === 'light' ? 'dark' : 'light'
    persist(); renderRoute()
  })
  document.querySelector('#textToggle')?.addEventListener('click', () => {
    progress.settings.largeText = !progress.settings.largeText
    persist(); renderRoute()
  })
  if (pendingToast) { showToast(pendingToast); pendingToast = '' }
}

function missionHeader(id, body) {
  const mission = missions[id]
  const done = progress.missions[id]?.completed
  return `<section class="mission-page">
    <div class="mission-hero card"><div class="mission-icon">${mission.icon}</div><div><span class="eyebrow">NHIỆM VỤ ${id}</span><h1>${esc(mission.title)}</h1><p>${esc(mission.subtitle)}</p><div class="chip-row"><span class="chip">+${mission.xp} XP</span><span class="chip">${mission.estimatedMinutes} phút</span>${done ? '<span class="chip chip-success">Đã hoàn thành</span>' : ''}</div></div></div>
    ${body}
    <div class="mission-footer card"><a class="button button-ghost" href="#/">← Bản đồ nhiệm vụ</a><button class="button button-ghost" id="resetMission">Đặt lại nhiệm vụ</button></div>
  </section>`
}

function bindMissionReset(id) {
  document.querySelector('#resetMission')?.addEventListener('click', () => {
    if (!confirm('Đặt lại nhiệm vụ này và thu hồi XP đã nhận?')) return
    const old = progress.missions[id]
    progress.totalXp = Math.max(0, progress.totalXp - (old?.xpEarned || 0))
    progress.missions[id] = { completed: false, score: 0, xpEarned: 0, attempts: 0 }
    const missionBadges = badges.filter((badge) => badge.missionId === id).map((badge) => badge.id)
    progress.badges = progress.badges.filter((badge) => !missionBadges.includes(badge))
    persist(); setToast('Đã đặt lại nhiệm vụ.'); renderRoute()
  })
}

function finishMission(id, score = 100) {
  const first = !progress.missions[id]?.completed
  progress = completeMissionState(progress, id, score)
  persist()
  setToast(first ? `Hoàn thành nhiệm vụ ${id}! +${missions[id].xp} XP` : `Đã cập nhật kết quả nhiệm vụ ${id}.`)
  renderRoute()
}

function renderDashboard() {
  const completed = missions.filter((mission) => progress.missions[mission.id]?.completed).length
  const percent = Math.round(completed / 8 * 100)
  const level = getLevel(progress.totalXp)
  const next = missions.find((mission) => isMissionUnlocked(progress, mission.id) && !progress.missions[mission.id]?.completed)
  const cards = missions.map((mission) => {
    const unlocked = isMissionUnlocked(progress, mission.id)
    const done = progress.missions[mission.id]?.completed
    return `<article class="mission-card ${done ? 'completed' : ''} ${!unlocked ? 'locked' : ''}"><div class="mission-card-top"><span class="mission-number">${done ? '✓' : unlocked ? mission.id : '🔒'}</span><span class="mission-card-icon">${mission.icon}</span></div><h3>${esc(mission.title)}</h3><p>${esc(mission.subtitle)}</p><div class="mission-card-meta"><span>+${mission.xp} XP</span><span>${mission.estimatedMinutes} phút</span></div>${unlocked ? `<a class="card-link" href="#/mission/${mission.id}">${done ? 'Ôn lại' : 'Bắt đầu'} →</a>` : '<span class="card-link disabled">Hoàn thành nhiệm vụ trước</span>'}</article>`
  }).join('')
  const badgeCards = badges.map((badge) => `<div class="badge-card ${progress.badges.includes(badge.id) ? 'earned' : ''}"><span>${progress.badges.includes(badge.id) ? badge.icon : '◌'}</span><div><strong>${esc(badge.name)}</strong><small>${esc(badge.description)}</small></div></div>`).join('')
  const content = `<div class="dashboard-page">
    <section class="dashboard-hero"><div><span class="eyebrow">TRƯỜNG THCS VÀ THPT ĐINH THIỆN LÝ</span><h1>OS QUEST 11</h1><p class="hero-subtitle">Khám phá hệ điều hành qua nhiệm vụ, mô phỏng và thử thách thực tế.</p><div class="hero-actions"><a class="button" href="#${next ? `/mission/${next.id}` : '/final'}">${next ? `Tiếp tục nhiệm vụ ${next.id}` : 'Vào Escape Room'} →</a><a class="button button-ghost" href="#mission-map">Xem bản đồ</a></div><div class="hero-meta"><span>8 nhiệm vụ</span><span>•</span><span>Khoảng 60 phút</span><span>•</span><span>Chứng chỉ cuối khóa</span></div></div>
      <div class="command-card"><div class="command-grid"><div><span>XP</span><strong>${progress.totalXp}</strong></div><div><span>Cấp độ</span><strong>${esc(level.name)}</strong></div><div><span>Nhiệm vụ</span><strong>${completed}/8</strong></div><div><span>Quiz tốt nhất</span><strong>${progress.quizBestScore}%</strong></div></div><div class="progress-label"><span>Tiến trình toàn khóa</span><strong>${percent}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div><div class="system-diagram"><div>👤 Người dùng</div><span>↓</span><div>🧩 Ứng dụng</div><span>↓</span><div class="os-layer">⚙️ Hệ điều hành</div><span>↓</span><div>🔩 Phần cứng</div></div></div>
    </section>
    <section class="learning-strip card"><div><span>01</span><p><strong>Quan sát</strong> giao diện, dòng thời gian và sơ đồ.</p></div><div><span>02</span><p><strong>Thao tác</strong> trên File Explorer và điện thoại mô phỏng.</p></div><div><span>03</span><p><strong>Giải thích</strong> vai trò cầu nối của hệ điều hành.</p></div></section>
    <section id="mission-map" class="section-block"><div class="section-heading"><div><span class="eyebrow">BẢN ĐỒ HÀNH TRÌNH</span><h2>Tám nhiệm vụ chính</h2></div><p>Nhiệm vụ sau mở khi em hoàn thành nhiệm vụ trước. Chế độ giáo viên có thể mở toàn bộ.</p></div><div class="mission-map-grid">${cards}</div></section>
    <section class="endgame-grid"><article class="card endgame-card"><span class="eyebrow">THỬ THÁCH TỔNG HỢP</span><h2>Escape Room</h2><p>Vượt qua năm trạm để khôi phục phòng máy.</p><a class="button button-ghost" href="#/final">Vào Escape Room</a></article><article class="card endgame-card ${canIssueCertificate(progress) ? 'ready' : ''}"><span class="eyebrow">ĐÍCH ĐẾN</span><h2>Chứng chỉ OS Master</h2><p>Hoàn thành nhiệm vụ, đạt từ 80% và tối thiểu 750 XP.</p><a class="button button-ghost" href="#/certificate">Kiểm tra điều kiện</a></article></section>
    <section class="section-block"><div class="section-heading"><div><span class="eyebrow">HUY HIỆU</span><h2>Bộ sưu tập của em</h2></div></div><div class="badge-grid">${badgeCards}</div></section>
  </div>`
  shell(content, '/')
}

function renderMission0() {
  const tasks = ['Mở ứng dụng','Quản lí bộ nhớ','Nhận bàn phím và chuột','Lưu tệp','Hiển thị cửa sổ','Kết nối máy in','Điều phối CPU','Viết nội dung thay người dùng']
  const correct = new Set(tasks.slice(0, 7))
  const body = `<div class="card lesson-note"><strong>Tình huống:</strong> Em bật máy nhưng không có màn hình nền, biểu tượng, cửa sổ, trình quản lí tệp hay cách đơn giản để mở ứng dụng.</div><div class="card activity-card"><h2>Hệ điều hành đang làm gì?</h2><div class="option-grid">${tasks.map((task, index) => `<label class="select-card"><input type="checkbox" value="${index}"><span>${esc(task)}</span></label>`).join('')}</div><button class="button" id="checkM0">Kiểm tra lựa chọn</button><div id="m0Feedback"></div></div>`
  shell(missionHeader(0, body), '/mission/0'); bindMissionReset(0)
  document.querySelectorAll('.select-card input').forEach((input) => input.addEventListener('change', () => input.closest('.select-card').classList.toggle('selected', input.checked)))
  document.querySelector('#checkM0').addEventListener('click', () => {
    const selected = [...document.querySelectorAll('.select-card input:checked')].map((input) => tasks[Number(input.value)])
    const perfect = selected.length === correct.size && selected.every((item) => correct.has(item))
    document.querySelector('#m0Feedback').innerHTML = perfect ? '<div class="feedback feedback-success"><strong>Chính xác!</strong> Hệ điều hành giúp khai thác máy tính dễ dàng, an toàn và hiệu quả hơn.</div>' : '<div class="feedback feedback-warning">Chưa hoàn toàn đúng. Chọn các hoạt động liên quan đến tài nguyên, thiết bị, tệp và giao diện; không chọn việc viết nội dung thay người dùng.</div>'
    if (perfect) setTimeout(() => finishMission(0), 500)
  })
}

function renderMission1() {
  const items = [
    ['Điều phối CPU','program'],['Quản lí RAM','device'],['Nhận tín hiệu bàn phím','device'],['Tạo thư mục','data'],['Mở chương trình','program'],['Hiển thị cửa sổ','interface'],['Kết nối máy in','device'],['Nén tệp','utility'],
  ]
  const categories = [['','Chọn nhóm chức năng'],['device','Quản lí thiết bị'],['data','Quản lí dữ liệu'],['program','Chương trình và tài nguyên'],['interface','Giao tiếp người dùng'],['utility','Tiện ích hệ thống']]
  const rows = items.map(([name], index) => `<label class="match-row"><strong>${esc(name)}</strong><select data-index="${index}">${categories.map(([value,label]) => `<option value="${value}">${label}</option>`).join('')}</select></label>`).join('')
  const body = `<div class="card lesson-note">Hệ điều hành có năm nhóm chức năng chính. Chọn nhóm phù hợp cho từng công việc.</div><div class="card activity-card"><h2>Phân loại chức năng</h2><div class="matching-list">${rows}</div><button class="button" id="checkM1">Chấm kết quả</button><div id="m1Feedback"></div></div>`
  shell(missionHeader(1, body), '/mission/1'); bindMissionReset(1)
  document.querySelector('#checkM1').addEventListener('click', () => {
    const selects = [...document.querySelectorAll('select[data-index]')]
    const score = selects.filter((select) => select.value === items[Number(select.dataset.index)][1]).length
    document.querySelector('#m1Feedback').innerHTML = score === items.length ? '<div class="feedback feedback-success">Đúng 8/8. Năm nhóm chức năng đã được kích hoạt.</div>' : `<div class="feedback feedback-warning">Đúng ${score}/8. Gợi ý: CPU thuộc điều phối chương trình; RAM và thiết bị ngoại vi thuộc quản lí thiết bị; nén tệp là tiện ích.</div>`
    if (score === items.length) setTimeout(() => finishMission(1), 500)
  })
}

function renderMission2() {
  const windows = [['Windows 1','1985'],['Windows 3','1990'],['Windows 95','1995'],['Windows XP','2001'],['Windows 7','2009'],['Windows 8','2012'],['Windows 10','2015'],['Windows 11','2021']]
  const years = windows.map(([,year]) => year)
  const body = `<div class="card lesson-note">Ghép phiên bản Windows với năm phát hành và xác nhận thứ tự phát triển Linux.</div><div class="card activity-card"><h2>Timeline Windows</h2><div class="timeline-list">${windows.map(([name], index) => `<div class="timeline-row"><strong>${name}</strong><select data-win="${index}"><option value="">Chọn năm</option>${years.map((year) => `<option>${year}</option>`).join('')}</select></div>`).join('')}</div></div><div class="card activity-card"><h2>Dòng phát triển Linux</h2><ol class="order-list"><li><span>UNIX (1969)</span></li><li><span>Linux do Linus Torvalds phát triển (1991)</span></li><li><span>Linux 1.0 công bố (1994)</span></li><li><span>Các bản phân phối: Red Hat, Debian, Ubuntu, SUSE</span></li></ol><label class="select-card"><input id="linuxConfirm" type="checkbox"><span>Tôi xác nhận thứ tự: UNIX → Linux 1991 → Linux 1.0 năm 1994 → các bản phân phối.</span></label><br><button class="button" id="checkM2">Kiểm tra timeline</button><div id="m2Feedback"></div></div>`
  shell(missionHeader(2, body), '/mission/2'); bindMissionReset(2)
  document.querySelector('#linuxConfirm').addEventListener('change', (event) => event.target.closest('.select-card').classList.toggle('selected', event.target.checked))
  document.querySelector('#checkM2').addEventListener('click', () => {
    const score = [...document.querySelectorAll('[data-win]')].filter((select) => select.value === windows[Number(select.dataset.win)][1]).length
    const linux = document.querySelector('#linuxConfirm').checked
    document.querySelector('#m2Feedback').innerHTML = score === 8 && linux ? '<div class="feedback feedback-success">Timeline chính xác. Em đã nắm các mốc cốt lõi của Windows và Linux.</div>' : `<div class="feedback feedback-warning">Windows đúng ${score}/8 mốc; xác nhận Linux: ${linux ? 'đã chọn' : 'chưa chọn'}.</div>`
    if (score === 8 && linux) setTimeout(() => finishMission(2), 500)
  })
}

function renderMission3() {
  const targets = [['icon','Biểu tượng'],['window','Cửa sổ ứng dụng'],['min','Nút thu nhỏ'],['max','Nút phóng to'],['close','Nút đóng'],['taskbar','Thanh công việc'],['status','Thanh trạng thái']]
  let current = 0
  const body = `<div class="card lesson-note">Click đúng thành phần được yêu cầu trên desktop mô phỏng.</div><div class="card activity-card"><div class="activity-heading"><div><h2>Truy tìm thành phần</h2><p>Hãy click vào: <strong id="targetName">${targets[0][1]}</strong></p></div><span class="score-badge"><span id="m3Count">0</span>/7</span></div><div class="desktop-sim"><button class="desktop-icon hotspot" data-id="icon">📄<small>Bài học</small></button><div class="sim-window hotspot" data-id="window"><div class="window-title"><span>OS Notes</span><div><button class="hotspot" data-id="min">—</button><button class="hotspot" data-id="max">□</button><button class="hotspot" data-id="close">×</button></div></div><div class="window-body"><div class="fake-line wide"></div><div class="fake-line"></div><div class="fake-line short"></div></div></div><button class="sim-taskbar hotspot" data-id="taskbar">◉　📁　🌐</button><button class="sim-status hotspot" data-id="status">Wi‑Fi · 14:30</button></div><div id="m3Feedback"></div><div class="compare-panel"><div><strong>GUI</strong><p>Giao diện đồ họa dùng cửa sổ, biểu tượng và con trỏ.</p></div><div class="terminal-mini"><span>$ open lesson.txt</span><span>Loading...</span></div><div><strong>CLI</strong><p>Giao diện dòng lệnh dùng câu lệnh văn bản.</p></div></div></div>`
  shell(missionHeader(3, body), '/mission/3'); bindMissionReset(3)
  document.querySelectorAll('.hotspot').forEach((element) => element.addEventListener('click', (event) => {
    event.stopPropagation()
    const expected = targets[current]
    if (element.dataset.id === expected[0]) {
      current += 1
      document.querySelector('#m3Count').textContent = current
      document.querySelector('#m3Feedback').innerHTML = `<div class="feedback feedback-success">Đúng: ${expected[1]}</div>`
      if (current === targets.length) setTimeout(() => finishMission(3), 600)
      else document.querySelector('#targetName').textContent = targets[current][1]
    } else document.querySelector('#m3Feedback').innerHTML = '<div class="feedback feedback-warning">Chưa đúng vị trí. Hãy quan sát và thử lại.</div>'
  }))
}

function renderMission4() {
  const cards = [['Trình duyệt','app'],['Phần mềm soạn thảo','app'],['Trò chơi','app'],['CPU','hardware'],['RAM','hardware'],['Bàn phím','hardware'],['Máy in','hardware'],['Dịch vụ quản lí tệp','os'],['Trình điều khiển thiết bị','os'],['Bộ lập lịch tiến trình','os']]
  const options = [['','Chọn tầng'],['app','Phần mềm ứng dụng'],['os','Hệ điều hành'],['hardware','Phần cứng']]
  const body = `<div class="card lesson-note"><strong>Thông điệp:</strong> Hệ điều hành là môi trường để phần mềm ứng dụng khai thác hiệu quả phần cứng.</div><div class="card activity-card"><h2>Mô hình bốn tầng</h2><div class="layer-stack static-stack"><div>👤 <strong>Người dùng</strong></div><div>🧩 <strong>Phần mềm ứng dụng</strong></div><div>⚙️ <strong>Hệ điều hành</strong></div><div>🔩 <strong>Phần cứng</strong></div></div><div class="matching-list">${cards.map(([name], index) => `<label><strong>${esc(name)}</strong><select data-layer="${index}">${options.map(([value,label]) => `<option value="${value}">${label}</option>`).join('')}</select></label>`).join('')}</div><button class="button" id="checkM4">Kiểm tra mô hình</button><div id="m4Feedback"></div></div>`
  shell(missionHeader(4, body), '/mission/4'); bindMissionReset(4)
  document.querySelector('#checkM4').addEventListener('click', () => {
    const score = [...document.querySelectorAll('[data-layer]')].filter((select) => select.value === cards[Number(select.dataset.layer)][1]).length
    document.querySelector('#m4Feedback').innerHTML = score === cards.length ? '<div class="feedback feedback-success">Mô hình chính xác! Ứng dụng dùng dịch vụ của hệ điều hành để làm việc với phần cứng.</div>' : `<div class="feedback feedback-warning">Đúng ${score}/10. CPU, RAM và thiết bị thuộc phần cứng; driver và bộ lập lịch thuộc hệ điều hành.</div>`
    if (score === cards.length) setTimeout(() => finishMission(4), 500)
  })
}

function renderMission5() {
  let nodes = [
    {id:'documents',name:'Documents',kind:'folder',parent:null},{id:'downloads',name:'Downloads',kind:'folder',parent:null},{id:'desktop',name:'Desktop',kind:'folder',parent:null},
    {id:'baitap',name:'BaiTap',kind:'folder',parent:'documents'},{id:'hinhanh',name:'HinhAnh',kind:'folder',parent:'documents'},{id:'duan',name:'DuAn',kind:'folder',parent:'documents'},
    {id:'bai1',name:'Bai1.txt',kind:'file',parent:'documents',type:'txt'},{id:'huongdan',name:'HuongDan.pdf',kind:'file',parent:'documents',type:'pdf'},{id:'giaodien',name:'GiaoDien.png',kind:'file',parent:'documents',type:'png'},{id:'nhan',name:'Nhan.txt',kind:'file',parent:'documents',type:'txt'},
  ]
  let history = []
  let current = 'documents'
  let selected = []
  let target = 'documents'
  let contextUsed = false
  let openedCorrectly = false
  let deletedNhanOnce = false
  let restoredNhan = false
  const body = `<div class="card lesson-note"><strong>Mô phỏng an toàn:</strong> Dữ liệu dưới đây hoàn toàn ảo. Website không truy cập hoặc thay đổi tệp thật trên thiết bị.</div><div class="file-lab-layout"><div class="card explorer-window"><div class="explorer-toolbar"><button id="newFolder">＋ Thư mục mới</button><button id="renameFile">Đổi tên</button><button id="copyFile">Sao chép</button><button id="moveFile">Di chuyển</button><button id="deleteFile">Xóa</button><button id="openFile">Mở bằng…</button><button id="undoFile">↶ Hoàn tác</button></div><div class="explorer-target"><label>Đích sao chép/di chuyển <select id="targetFolder"></select></label></div><div class="explorer-body"><aside id="folderTree"></aside><section class="file-pane" id="filePane"></section></div><div id="fileFeedback"></div></div><aside class="card task-panel"><h2>Bảng nhiệm vụ</h2><ol id="fileTasks"></ol><div class="score-summary"><strong id="fileCount">0/10 bước</strong><span>Thao tác trực tiếp</span></div><button class="button" id="finishM5" disabled>Nhận 200 XP</button></aside></div>`
  shell(missionHeader(5, body), '/mission/5'); bindMissionReset(5)

  const icon = (node) => node.kind === 'folder' ? '📁' : node.type === 'pdf' ? '📕' : node.type === 'png' ? '🖼️' : '📄'
  const snapshot = () => history.push(JSON.parse(JSON.stringify(nodes)))
  const feedback = (text) => { document.querySelector('#fileFeedback').innerHTML = `<div class="feedback feedback-info">${esc(text)}</div>` }
  const nodeBy = (name) => nodes.find((node) => node.name === name && !node.deleted)
  const statuses = () => {
    const main = nodeBy('HeDieuHanh')
    const ly = main && nodes.find((node) => node.name === 'LyThuyet' && node.parent === main.id && !node.deleted)
    const th = main && nodes.find((node) => node.name === 'ThucHanh' && node.parent === main.id && !node.deleted)
    return [
      Boolean(main), Boolean(ly && th), Boolean(nodeBy('HeDieuHanh.txt')),
      Boolean(ly && nodes.find((node) => node.name === 'HuongDan.pdf' && node.parent === ly.id && !node.deleted)),
      Boolean(th && nodes.find((node) => node.name === 'GiaoDien.png' && node.parent === th.id && !node.deleted)),
      deletedNhanOnce, restoredNhan, selected.length >= 2, contextUsed, openedCorrectly,
    ]
  }
  const tasks = ['Tạo HeDieuHanh trong Documents','Tạo LyThuyet và ThucHanh bên trong','Đổi Bai1.txt thành HeDieuHanh.txt','Sao chép HuongDan.pdf vào LyThuyet','Di chuyển GiaoDien.png vào ThucHanh','Xóa Nhan.txt','Khôi phục Nhan.txt từ Thùng rác','Chọn ít nhất hai đối tượng','Mở menu nháy phải','Mở tệp bằng ứng dụng phù hợp']

  function updateTasks() {
    const values = statuses()
    document.querySelector('#fileTasks').innerHTML = tasks.map((task, index) => `<li class="${values[index] ? 'done' : ''}"><span>${values[index] ? '✓' : index + 1}</span>${task}</li>`).join('')
    const count = values.filter(Boolean).length
    document.querySelector('#fileCount').textContent = `${count}/10 bước`
    document.querySelector('#finishM5').disabled = count < 10
  }

  function renderExplorer() {
    const folders = nodes.filter((node) => node.kind === 'folder' && !node.deleted)
    document.querySelector('#targetFolder').innerHTML = folders.map((folder) => `<option value="${folder.id}" ${target === folder.id ? 'selected' : ''}>${esc(folder.name)}</option>`).join('')
    const trash = nodes.filter((node) => node.deleted)
    document.querySelector('#folderTree').innerHTML = `<button data-folder="root">🖥️ Máy tính</button>${nodes.filter((node) => node.kind === 'folder' && node.parent === null).map((folder) => `<button data-folder="${folder.id}">${icon(folder)} ${esc(folder.name)}</button>`).join('')}<details><summary>🗑️ Thùng rác (${trash.length})</summary>${trash.map((node) => `<button data-restore="${node.id}">↺ ${esc(node.name)}</button>`).join('')}</details>`
    const visible = nodes.filter((node) => !node.deleted && node.parent === (current === 'root' ? null : current))
    const currentNode = nodes.find((node) => node.id === current)
    document.querySelector('#filePane').innerHTML = `<div class="breadcrumb"><button data-folder="root">Máy tính</button><span>›</span><strong>${current === 'root' ? 'Gốc' : esc(currentNode?.name || '')}</strong></div>${currentNode?.parent ? `<button class="up-button" data-folder="${currentNode.parent}">↑ Lên một cấp</button>` : ''}<div class="file-grid">${visible.map((node) => `<div class="file-item ${selected.includes(node.id) ? 'selected' : ''}" data-node="${node.id}"><input aria-label="Chọn ${esc(node.name)}" type="checkbox" ${selected.includes(node.id) ? 'checked' : ''}><span>${icon(node)}</span><strong>${esc(node.name)}</strong><small>${node.kind === 'folder' ? 'Thư mục' : node.type.toUpperCase()}</small></div>`).join('')}</div>`
    document.querySelectorAll('[data-folder]').forEach((button) => button.addEventListener('click', () => { current = button.dataset.folder; selected = []; renderExplorer(); updateTasks() }))
    document.querySelectorAll('[data-restore]').forEach((button) => button.addEventListener('click', () => {
      snapshot(); nodes = nodes.map((node) => node.id === button.dataset.restore ? {...node,deleted:false,parent:'documents'} : node); if (button.dataset.restore === 'nhan') restoredNhan = true; feedback('Đã khôi phục đối tượng về Documents.'); renderExplorer(); updateTasks()
    }))
    document.querySelectorAll('.file-item').forEach((item) => {
      const checkbox = item.querySelector('input')
      checkbox.addEventListener('change', () => { selected = checkbox.checked ? [...new Set([...selected,item.dataset.node])] : selected.filter((id) => id !== item.dataset.node); renderExplorer(); updateTasks() })
      item.addEventListener('dblclick', () => { const node = nodes.find((entry) => entry.id === item.dataset.node); if (node.kind === 'folder') { current = node.id; selected = []; renderExplorer() } else feedback(`Nháy đúp sẽ mở ${node.name} bằng ứng dụng mặc định.`) })
      item.addEventListener('contextmenu', (event) => { event.preventDefault(); contextUsed = true; selected = [item.dataset.node]; feedback('Menu ngữ cảnh: Mở, Sao chép, Di chuyển, Đổi tên, Xóa…'); renderExplorer(); updateTasks() })
    })
    updateTasks()
  }

  document.querySelector('#targetFolder').addEventListener('change', (event) => { target = event.target.value })
  document.querySelector('#newFolder').addEventListener('click', () => {
    const name = prompt('Tên thư mục mới:')?.trim(); if (!name || current === 'root') return
    snapshot(); nodes.push({id:`folder-${Date.now()}`,name,kind:'folder',parent:current}); feedback(`Đã tạo thư mục “${name}”.`); renderExplorer()
  })
  document.querySelector('#renameFile').addEventListener('click', () => {
    if (selected.length !== 1) return feedback('Hãy chọn đúng một đối tượng để đổi tên.')
    const old = nodes.find((node) => node.id === selected[0]); const name = prompt('Tên mới:', old.name)?.trim(); if (!name) return
    snapshot(); old.name = name; feedback(`Đã đổi tên thành “${name}”.`); renderExplorer()
  })
  document.querySelector('#copyFile').addEventListener('click', () => {
    if (!selected.length) return feedback('Hãy chọn đối tượng cần sao chép.')
    snapshot(); const copies = nodes.filter((node) => selected.includes(node.id)).map((node) => ({...node,id:`${node.id}-copy-${Date.now()}-${Math.random()}`,parent:target,deleted:false})); nodes.push(...copies); feedback(`Đã sao chép ${copies.length} đối tượng; bản gốc vẫn được giữ.`); renderExplorer()
  })
  document.querySelector('#moveFile').addEventListener('click', () => {
    if (!selected.length) return feedback('Hãy chọn đối tượng cần di chuyển.')
    snapshot(); nodes = nodes.map((node) => selected.includes(node.id) ? {...node,parent:target} : node); selected=[]; feedback('Đã di chuyển đối tượng.'); renderExplorer()
  })
  document.querySelector('#deleteFile').addEventListener('click', () => {
    if (!selected.length) return feedback('Hãy chọn đối tượng cần xóa.')
    if (selected.includes('nhan')) deletedNhanOnce = true
    snapshot(); nodes = nodes.map((node) => selected.includes(node.id) ? {...node,deleted:true} : node); selected=[]; feedback('Đã chuyển vào Thùng rác.'); renderExplorer()
  })
  document.querySelector('#openFile').addEventListener('click', () => {
    const chosen = nodes.filter((node) => selected.includes(node.id)); if (chosen.length !== 1 || chosen[0].kind !== 'file') return feedback('Hãy chọn đúng một tệp.')
    const expected = chosen[0].type === 'txt' ? 'text editor' : chosen[0].type === 'pdf' ? 'pdf reader' : 'image viewer'
    const appName = prompt(`Nhập ứng dụng phù hợp: Text Editor, PDF Reader hoặc Image Viewer`)?.trim().toLowerCase()
    if (appName === expected) { openedCorrectly=true; feedback(`Đã mở bằng ${expected}.`) } else feedback(`Chưa phù hợp. Tệp ${chosen[0].type.toUpperCase()} cần ${expected}.`); updateTasks()
  })
  document.querySelector('#undoFile').addEventListener('click', () => { const previous = history.pop(); if (!previous) return feedback('Chưa có thao tác để hoàn tác.'); nodes=previous; feedback('Đã hoàn tác thao tác gần nhất.'); renderExplorer() })
  document.querySelector('#finishM5').addEventListener('click', () => finishMission(5))
  renderExplorer()
}

function renderMission6() {
  const matches = [['Chụp màn hình','Lưu hình ảnh đang hiển thị'],['Nén tệp','Đóng gói và thường giảm dung lượng'],['Giải nén tệp','Mở dữ liệu từ gói nén'],['Gỡ ứng dụng','Loại phần mềm không cần thiết'],['Quét lỗi','Tìm lỗi lưu trữ'],['Gõ tiếng Việt','Nhập văn bản có dấu']]
  const purposes = matches.map(([,purpose]) => purpose)
  const body = `<div class="card lesson-note"><strong>Lưu ý:</strong> Đây là mô phỏng giáo dục; không thay đổi ổ đĩa thật và không khuyến khích hợp mảnh máy móc trên mọi loại ổ đĩa.</div><div class="card activity-card"><h2>Mô phỏng ổ đĩa</h2><div class="disk-lab"><div class="disk-visual" id="diskVisual">${Array.from({length:24},(_,i)=>`<span class="block block-${i%5}"></span>`).join('')}<div class="disk-center" id="diskCenter">DISK</div></div><div class="utility-controls">${[['check','Check','Kiểm tra cấu trúc'],['scan','Scan','Quét lỗi'],['optimize','Optimize','Tổ chức lại dữ liệu'],['repair','Repair','Minh họa sửa lỗi']].map(([id,name,note])=>`<button data-util="${id}"><strong>${name}</strong><small>${note}</small></button>`).join('')}</div></div><div id="utilFeedback"></div></div><div class="card activity-card"><h2>Ghép tiện ích với mục đích</h2><div class="matching-list">${matches.map(([name],index)=>`<label><strong>${name}</strong><select data-util-match="${index}"><option value="">Chọn mục đích</option>${purposes.map((purpose)=>`<option>${purpose}</option>`).join('')}</select></label>`).join('')}</div><button class="button" id="checkM6">Kiểm tra phòng lab</button><div id="m6Feedback"></div></div>`
  shell(missionHeader(6, body), '/mission/6'); bindMissionReset(6)
  const used = new Set()
  document.querySelectorAll('[data-util]').forEach((button)=>button.addEventListener('click',()=>{
    used.add(button.dataset.util); const disk=document.querySelector('#diskVisual'); disk.className=`disk-visual stage-${button.dataset.util}`; document.querySelector('#diskCenter').textContent=button.dataset.util.toUpperCase(); document.querySelector('#utilFeedback').innerHTML=`<div class="feedback feedback-info">${esc(button.querySelector('small').textContent)} — đây chỉ là hoạt ảnh minh họa.</div>`
  }))
  document.querySelector('#checkM6').addEventListener('click',()=>{
    const score=[...document.querySelectorAll('[data-util-match]')].filter((select)=>select.value===matches[Number(select.dataset.utilMatch)][1]).length
    const all=used.size===4
    document.querySelector('#m6Feedback').innerHTML=score===6&&all?'<div class="feedback feedback-success">Đúng 6/6 và đã thử đủ bốn công cụ.</div>':`<div class="feedback feedback-warning">Ghép đúng ${score}/6; đã thử ${used.size}/4 công cụ.</div>`
    if(score===6&&all)setTimeout(()=>finishMission(6),500)
  })
}

function renderMission7() {
  let contactDone=false, calendarDone=false, appDone=false
  const features=[['Thao tác cảm ứng','mobile'],['Kết nối NFC','mobile'],['Quản lí tệp','both'],['Chạy nhiều ứng dụng','both'],['Quản lí bộ nhớ','both'],['Cảm biến vị trí','mobile'],['Kết nối máy in','pc'],['Nhắc việc','both'],['Quản lí ứng dụng','both']]
  const body=`<div class="card lesson-note">Không nhập dữ liệu cá nhân thật. Số điện thoại và liên hệ trong mô phỏng là dữ liệu giả.</div><div class="mobile-lab-layout"><div class="phone-shell"><div class="phone-status">14:37 <span>▮▮▮ 5G 🔋</span></div><div class="phone-screen"><div class="phone-tabs"><button data-tab="contacts" class="active">👥 Danh bạ</button><button data-tab="calendar">📅 Lịch</button><button data-tab="apps">⚙️ Ứng dụng</button></div><div class="phone-app" id="phoneApp"></div></div><div class="phone-home"></div></div><div class="card mobile-tasks"><h2>Chuỗi thử thách</h2><div class="task-checks" id="mobileChecks"></div><div id="mobileFeedback"></div></div></div><div class="card activity-card"><h2>Phân loại tính năng</h2><div class="feature-table">${features.map(([name],index)=>`<label><strong>${name}</strong><select data-feature="${index}"><option value="">Chọn nhóm</option><option value="pc">Máy tính cá nhân</option><option value="mobile">Thiết bị di động</option><option value="both">Cả hai</option></select></label>`).join('')}</div><button class="button" id="finishM7">Kiểm tra và hoàn thành</button><div id="m7Feedback"></div></div>`
  shell(missionHeader(7,body),'/mission/7');bindMissionReset(7)
  let active='contacts'
  const setFeedback=(text)=>document.querySelector('#mobileFeedback').innerHTML=`<div class="feedback feedback-info">${esc(text)}</div>`
  function checks(){document.querySelector('#mobileChecks').innerHTML=`<div class="${contactDone?'done':''}"><span>${contactDone?'✓':'1'}</span><p>Thêm Nguyễn Minh An vào Nhóm dự án và tìm “An”.</p></div><div class="${calendarDone?'done':''}"><span>${calendarDone?'✓':'2'}</span><p>Tạo lịch họp nhóm và nhắc lặp lại.</p></div><div class="${appDone?'done':''}"><span>${appDone?'✓':'3'}</span><p>Gỡ ứng dụng không cần thiết chiếm nhiều dung lượng.</p></div>`}
  function renderPhone(){
    const container=document.querySelector('#phoneApp')
    if(active==='contacts')container.innerHTML=`<h3>Danh bạ</h3><input id="contactSearch" placeholder="Tìm liên hệ"><button class="phone-primary" id="addContact">＋ Thêm Nguyễn Minh An</button><div id="contactResult"></div>`
    if(active==='calendar')container.innerHTML=`<h3>Lịch và nhắc việc</h3><button class="phone-primary" id="addEvent">＋ Tạo lịch họp nhóm</button><div id="eventResult"></div>`
    if(active==='apps')container.innerHTML=`<h3>Quản lí ứng dụng</h3><div class="app-row"><div><strong>Game Demo</strong><small>980 MB · Quyền: Vị trí, Danh bạ, Microphone</small></div><button id="removeApp">Gỡ</button></div><div class="app-row"><div><strong>Bản đồ</strong><small>420 MB · Cần thiết</small></div><button disabled>Cần thiết</button></div>`
    document.querySelector('#addContact')?.addEventListener('click',()=>{setFeedback('Đã thêm Nguyễn Minh An vào Nhóm dự án. Hãy nhập “An” vào ô tìm kiếm.');document.querySelector('#contactResult').innerHTML='<div class="contact-list"><div><span>👤</span><div><strong>Nguyễn Minh An</strong><small>0900 000 111 · Nhóm dự án</small></div><button>☎</button></div></div>'})
    document.querySelector('#contactSearch')?.addEventListener('input',(event)=>{if(event.target.value.toLowerCase().includes('an')){contactDone=true;checks();setFeedback('Đã tìm thấy Nguyễn Minh An.')}})
    document.querySelector('#addEvent')?.addEventListener('click',()=>{calendarDone=true;checks();document.querySelector('#eventResult').innerHTML='<div class="event-card"><strong>Họp nhóm OS Quest</strong><span>10/08/2026 · 15:30</span><small>Nhắc lặp lại: Có</small></div>';setFeedback('Đã tạo lịch và nhắc việc lặp lại.')})
    document.querySelector('#removeApp')?.addEventListener('click',()=>{appDone=true;checks();document.querySelector('#removeApp').closest('.app-row').remove();setFeedback('Đã gỡ Game Demo sau khi xem dung lượng và quyền truy cập.')})
  }
  document.querySelectorAll('[data-tab]').forEach((button)=>button.addEventListener('click',()=>{active=button.dataset.tab;document.querySelectorAll('[data-tab]').forEach((item)=>item.classList.toggle('active',item===button));renderPhone()}))
  document.querySelector('#finishM7').addEventListener('click',()=>{const score=[...document.querySelectorAll('[data-feature]')].filter((select)=>select.value===features[Number(select.dataset.feature)][1]).length;const done=contactDone&&calendarDone&&appDone&&score===9;document.querySelector('#m7Feedback').innerHTML=done?'<div class="feedback feedback-success">Hoàn thành toàn bộ Mobile OS Lab.</div>':`<div class="feedback feedback-warning">Danh bạ ${contactDone?'✓':'○'} · Lịch ${calendarDone?'✓':'○'} · Ứng dụng ${appDone?'✓':'○'} · Phân loại ${score}/9.</div>`;if(done)setTimeout(()=>finishMission(7),500)})
  checks();renderPhone()
}

function renderFinal() {
  if (!canTakeFinal(progress) && !progress.settings.unlockAll) {
    shell('<div class="gate-page card"><span class="gate-icon">🔒</span><h1>Escape Room chưa mở</h1><p>Hoàn thành đủ 8 nhiệm vụ chính trước khi vào phòng máy.</p><a class="button" href="#/">Trở về bản đồ</a></div>', '/final'); return
  }
  const stations=[
    ['Điều phối CPU cho nhiều chương trình thuộc nhóm nào?',['Quản lí chương trình và tài nguyên','Quản lí dữ liệu','Tiện ích cá nhân'],0,'CPU cần được chia thời gian giữa các tiến trình.'],
    ['Thứ tự đúng từ người dùng đến thiết bị vật lí?',['Người dùng → Ứng dụng → Hệ điều hành → Phần cứng','Người dùng → Phần cứng → Ứng dụng → Hệ điều hành','Ứng dụng → Người dùng → Phần cứng → Hệ điều hành'],0,'Hệ điều hành nằm giữa ứng dụng và phần cứng.'],
    ['Cấu trúc nào hợp lí để lưu lí thuyết và thực hành?',['HeDieuHanh/LyThuyet và HeDieuHanh/ThucHanh','Tất cả tệp để trên Desktop','LyThuyet/HeDieuHanh/ThucHanh/LyThuyet'],0,'Dùng một thư mục chủ đề và hai thư mục con.'],
    ['Muốn đóng gói tệp thành .zip, chọn tiện ích nào?',['Nén tệp','Chụp màn hình','Kiểm tra ổ đĩa'],0,'Tên tiện ích mô tả trực tiếp mục đích.'],
    ['Trước khi gỡ ứng dụng, nên kiểm tra gì?',['Dung lượng, mức sử dụng, quyền và mức cần thiết','Chỉ màu biểu tượng','Số liên hệ trong danh bạ'],0,'Quyết định cần dựa trên nhu cầu và tác động.'],
  ]
  const content=`<div class="challenge-page"><section class="challenge-hero card"><div><span class="eyebrow">THỬ THÁCH CUỐI</span><h1>Escape Room: Giải cứu phòng máy</h1><p>Hoàn thành năm trạm để khôi phục hệ thống.</p></div><div class="alarm-orb">🚨</div></section><div class="station-grid">${stations.map(([prompt,options],index)=>`<article class="card station-card" data-station-card="${index}"><div class="station-top"><span>${index+1}</span><h2>Trạm ${index+1}</h2></div><p>${prompt}</p><div class="radio-list">${options.map((option,opt)=>`<label><input type="radio" name="station-${index}" value="${opt}"><span>${option}</span></label>`).join('')}</div><button class="button button-small button-ghost" data-check-station="${index}">Kiểm tra trạm</button><div data-station-feedback="${index}"></div></article>`).join('')}</div><div class="card challenge-submit"><div><strong id="stationCount">0/5 trạm đã giải đúng</strong><p>Gợi ý xuất hiện sau hai lần kiểm tra sai.</p></div><button class="button" id="finishFinal">Khôi phục hệ thống</button></div><div id="finalFeedback"></div></div>`
  shell(content,'/final')
  const solved=new Set();const attempts={}
  document.querySelectorAll('[data-check-station]').forEach((button)=>button.addEventListener('click',()=>{
    const index=Number(button.dataset.checkStation);attempts[index]=(attempts[index]||0)+1
    const selected=document.querySelector(`input[name="station-${index}"]:checked`)
    const feedback=document.querySelector(`[data-station-feedback="${index}"]`)
    if(selected&&Number(selected.value)===stations[index][2]){solved.add(index);button.closest('.station-card').classList.add('solved');feedback.innerHTML='<div class="feedback feedback-success">Đã giải đúng trạm.</div>'}
    else feedback.innerHTML=`<div class="feedback feedback-warning">Chưa đúng.${attempts[index]>=2?` Gợi ý: ${stations[index][3]}`:''}</div>`
    document.querySelector('#stationCount').textContent=`${solved.size}/5 trạm đã giải đúng`
  }))
  document.querySelector('#finishFinal').addEventListener('click',()=>{
    if(solved.size===5){if(!progress.finalChallengeCompleted){progress.finalChallengeCompleted=true;progress.totalXp+=80}persist();setToast('Phòng máy đã khôi phục! +80 XP');renderRoute()}
    else document.querySelector('#finalFeedback').innerHTML=`<div class="feedback feedback-warning">Còn ${5-solved.size} trạm chưa hoàn thành.</div>`
  })
}

let activeQuiz=null
function renderQuiz() {
  if(!canTakeQuiz(progress)&&!progress.settings.unlockAll){shell('<div class="gate-page card"><span class="gate-icon">📝</span><h1>Bài kiểm tra chưa mở</h1><p>Hoàn thành 8 nhiệm vụ và Escape Room để bắt đầu.</p><a class="button" href="#/">Trở về bản đồ</a></div>','/quiz');return}
  if(!activeQuiz)activeQuiz=selectRandom(questions,15)
  const topicNames={functions:'Chức năng',history:'Windows & Linux',interface:'Giao diện',layers:'Mô hình hệ thống',files:'Tệp & thư mục',utilities:'Tiện ích',mobile:'Di động'}
  const content=`<div class="quiz-page"><section class="quiz-header card"><div><span class="eyebrow">BÀI ĐÁNH GIÁ CUỐI KHÓA</span><h1>15 câu hỏi ngẫu nhiên</h1><p>Điều kiện đạt: từ 80%. Câu nhiều đáp án được ghi rõ.</p></div><div class="quiz-counter"><strong id="answeredCount">0/15</strong><span>đã trả lời</span></div></section><div id="quizQuestions">${activeQuiz.map((q,index)=>`<article class="card question-card" data-question="${q.id}"><div class="question-meta"><span>Câu ${index+1}</span><span>${topicNames[q.topic]}</span><span>${q.level}</span>${q.type==='multiple'?'<span>Chọn nhiều</span>':''}</div><h2>${q.prompt}</h2><div class="quiz-options">${q.options.map((option,opt)=>`<label><input type="${q.type==='multiple'?'checkbox':'radio'}" name="${q.id}" value="${opt}"><span>${String.fromCharCode(65+opt)}</span><p>${option}</p></label>`).join('')}</div><div class="review-slot"></div></article>`).join('')}</div><div class="card quiz-submit"><div><strong id="quizStatus">Hãy trả lời đủ 15 câu</strong><p>Câu hỏi được chọn từ ngân hàng 40 câu.</p></div><button class="button" id="submitQuiz" disabled>Nộp bài</button></div><div id="quizResult"></div></div>`
  shell(content,'/quiz')
  const update=()=>{const answered=activeQuiz.filter((q)=>document.querySelectorAll(`input[name="${q.id}"]:checked`).length>0).length;document.querySelector('#answeredCount').textContent=`${answered}/15`;document.querySelector('#submitQuiz').disabled=answered<15}
  document.querySelectorAll('.quiz-options input').forEach((input)=>input.addEventListener('change',()=>{input.closest('.quiz-options').querySelectorAll('label').forEach((label)=>label.classList.toggle('selected',label.querySelector('input').checked));update()}))
  document.querySelector('#submitQuiz').addEventListener('click',()=>{
    const answers={};activeQuiz.forEach((q)=>answers[q.id]=[...document.querySelectorAll(`input[name="${q.id}"]:checked`)].map((input)=>Number(input.value)))
    const score=calculateQuizPercent(activeQuiz,answers);progress.quizBestScore=Math.max(progress.quizBestScore,score);progress.quizAttempts+=1
    if(score>=80&&canTakeQuiz(progress)&&!progress.badges.includes('os-master'))progress.badges.push('os-master')
    persist()
    const weak=[]
    activeQuiz.forEach((q)=>{const selected=[...(answers[q.id]||[])].sort().join(',');const correct=[...q.correct].sort().join(',');const card=document.querySelector(`[data-question="${q.id}"]`);const ok=selected===correct;card.classList.add(ok?'correct':'incorrect');card.querySelector('.review-slot').innerHTML=`<div class="feedback ${ok?'feedback-success':'feedback-info'}"><strong>${ok?'Đúng.':'Cần ôn lại.'}</strong> ${q.explanation}</div>`;if(!ok)weak.push(topicNames[q.topic])})
    document.querySelector('#quizResult').innerHTML=`<div class="card result-panel"><div class="result-ring ${score>=80?'pass':'retry'}"><strong>${score}%</strong><span>${score>=80?'Đạt':'Cần ôn'}</span></div><div><h2>${score>=80?'Em đã đạt yêu cầu!':'Chưa đạt 80% — tiếp tục ôn tập.'}</h2><p>Điểm tốt nhất: <strong>${progress.quizBestScore}%</strong>. Nhóm cần xem lại: ${[...new Set(weak)].join(', ')||'Không có'}.</p><div class="hero-actions"><button class="button" id="retryQuiz">Làm lượt mới</button>${score>=80?'<a class="button button-ghost" href="#/certificate">Đến chứng chỉ</a>':''}</div></div></div>`
    document.querySelector('#submitQuiz').disabled=true;document.querySelectorAll('.quiz-options input').forEach((input)=>input.disabled=true)
    document.querySelector('#retryQuiz').addEventListener('click',()=>{activeQuiz=null;renderRoute();window.scrollTo({top:0,behavior:'smooth'})})
  })
}

function renderCertificate() {
  const eligible=canIssueCertificate(progress)
  const done=missions.filter((mission)=>progress.missions[mission.id]?.completed).length
  const cert=progress.certificate
  const certificateMarkup=cert?`<section class="certificate-sheet" id="certificateSheet"><div class="certificate-border"><div class="logo-placeholder">LOGO<br><small>PLACEHOLDER</small></div><span class="certificate-kicker">TRƯỜNG THCS VÀ THPT ĐINH THIỆN LÝ</span><h2>CHỨNG NHẬN HOÀN THÀNH</h2><p>Chứng nhận học sinh</p><h1>${esc(cert.fullName)}</h1><p class="class-line">Lớp <strong>${esc(cert.className)}</strong>${cert.studentCode?` · Mã học sinh ${esc(cert.studentCode)}`:''}</p><p>đã hoàn thành khóa học tương tác</p><h3>“KHÁM PHÁ HỆ ĐIỀU HÀNH – OS QUEST 11”</h3><p>và đạt yêu cầu về kiến thức, kĩ năng sử dụng hệ điều hành.</p><div class="certificate-stats"><span>Điểm cuối khóa <strong>${progress.quizBestScore}%</strong></span><span>Tổng XP <strong>${progress.totalXp}</strong></span><span>Ngày hoàn thành <strong>${new Date(cert.issuedAt).toLocaleDateString('vi-VN')}</strong></span></div><div class="certificate-bottom"><div><small>Mã chứng chỉ</small><strong>${cert.certificateCode}</strong></div><div class="signature"><span>Giáo viên</span><strong>Nguyễn Đình Vương</strong></div></div></div></section><div class="certificate-actions card"><button class="button" id="printCertificate">In / lưu PDF</button><button class="button button-ghost" id="downloadCertData">Tải thông tin chứng chỉ</button></div>`:''
  const content=`<div class="certificate-page"><section class="certificate-header card"><div><span class="eyebrow">ĐÍCH ĐẾN OS QUEST 11</span><h1>Nhận chứng chỉ hoàn thành</h1><p>Chứng chỉ chỉ mở khi em đủ các điều kiện.</p></div><span class="certificate-medal">🎓</span></section><div class="certificate-layout"><aside class="card requirement-card"><h2>Điều kiện</h2><ul><li class="${done===8?'done':''}"><span>${done===8?'✓':'○'}</span>Hoàn thành nhiệm vụ <strong>${done}/8</strong></li><li class="${progress.finalChallengeCompleted?'done':''}"><span>${progress.finalChallengeCompleted?'✓':'○'}</span>Escape Room</li><li class="${progress.quizBestScore>=80?'done':''}"><span>${progress.quizBestScore>=80?'✓':'○'}</span>Quiz ≥ 80% <strong>${progress.quizBestScore}%</strong></li><li class="${progress.totalXp>=750?'done':''}"><span>${progress.totalXp>=750?'✓':'○'}</span>XP ≥ 750 <strong>${progress.totalXp}</strong></li></ul>${!eligible?'<div class="feedback feedback-warning">Em chưa đủ điều kiện nhận chứng chỉ.</div>':''}</aside><section class="card certificate-form"><h2>Thông tin chứng chỉ</h2><label>Họ và tên<input id="certName" value="${esc(cert?.fullName||'')}" ${cert?'disabled':''}></label><label>Lớp<input id="certClass" value="${esc(cert?.className||'')}" ${cert?'disabled':''}></label><label>Mã học sinh <small>(không bắt buộc)</small><input id="certCode" value="${esc(cert?.studentCode||'')}" ${cert?'disabled':''}></label>${!cert?`<button class="button" id="createCertificate" ${eligible?'':'disabled'}>Tạo chứng chỉ</button>`:'<div class="feedback feedback-success">Chứng chỉ đã được tạo và lưu cục bộ.</div>'}<div id="certFeedback"></div></section></div>${certificateMarkup}</div>`
  shell(content,'/certificate')
  document.querySelector('#createCertificate')?.addEventListener('click',()=>{const name=document.querySelector('#certName').value.trim();const cls=document.querySelector('#certClass').value.trim();if(!name||!cls){document.querySelector('#certFeedback').innerHTML='<div class="feedback feedback-warning">Hãy nhập họ tên và lớp.</div>';return}progress.certificate={fullName:name,className:cls,studentCode:document.querySelector('#certCode').value.trim(),certificateCode:generateCertificateCode(),issuedAt:new Date().toISOString()};persist();setToast('Đã tạo chứng chỉ.');renderRoute()})
  document.querySelector('#printCertificate')?.addEventListener('click',()=>window.print())
  document.querySelector('#downloadCertData')?.addEventListener('click',()=>downloadText(`OS11-${cert.certificateCode}.json`,JSON.stringify({certificate:cert,quizBestScore:progress.quizBestScore,totalXp:progress.totalXp},null,2),'application/json'))
}

function downloadText(filename,text,type='text/plain') {const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url)}

function renderProgress() {
  const missionRows=missions.map((mission)=>{const state=progress.missions[mission.id];return `<div><span>${state.completed?'✓':mission.icon}</span><div><strong>${mission.id}. ${mission.title}</strong><small>${state.completed?`Hoàn thành · ${state.score}% · ${state.xpEarned} XP`:'Chưa hoàn thành'}</small></div></div>`}).join('')
  const content=`<div class="progress-page"><section class="progress-header card"><div><span class="eyebrow">BẢNG ĐIỀU KHIỂN</span><h1>Tiến trình và cài đặt</h1><p>Dữ liệu được lưu bằng localStorage trên trình duyệt.</p></div><div class="big-xp"><strong>${progress.totalXp}</strong><span>XP</span></div></section><div class="progress-layout"><section class="card"><h2>Tiến trình nhiệm vụ</h2><div class="progress-mission-list">${missionRows}</div></section><section class="card settings-card"><h2>Trợ năng và chế độ giáo viên</h2>${[['theme','Chế độ tối',progress.settings.theme==='dark'],['reducedMotion','Giảm chuyển động',progress.settings.reducedMotion],['largeText','Chữ lớn',progress.settings.largeText],['unlockAll','Mở toàn bộ nhiệm vụ',progress.settings.unlockAll]].map(([key,label,checked])=>`<label class="toggle-row"><span><strong>${label}</strong></span><input type="checkbox" data-setting="${key}" ${checked?'checked':''}></label>`).join('')}</section></div><section class="card data-card"><h2>Sao lưu dữ liệu</h2><div class="data-actions"><button class="button" id="exportProgress">Xuất JSON</button><button class="button button-ghost" id="importProgress">Nhập JSON</button><input type="file" id="progressFile" accept="application/json" hidden><button class="button button-danger" id="resetAll">Xóa toàn bộ tiến trình</button></div><div id="progressFeedback"></div></section></div>`
  shell(content,'/progress')
  document.querySelectorAll('[data-setting]').forEach((input)=>input.addEventListener('change',()=>{const key=input.dataset.setting;if(key==='theme')progress.settings.theme=input.checked?'dark':'light';else progress.settings[key]=input.checked;persist();renderRoute()}))
  document.querySelector('#exportProgress').addEventListener('click',()=>downloadText(`os-quest-11-progress-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(progress,null,2),'application/json'))
  document.querySelector('#importProgress').addEventListener('click',()=>document.querySelector('#progressFile').click())
  document.querySelector('#progressFile').addEventListener('change',async(event)=>{const file=event.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(!validateProgress(parsed))throw new Error();progress=parsed;persist();setToast('Đã khôi phục tiến trình.');renderRoute()}catch{document.querySelector('#progressFeedback').innerHTML='<div class="feedback feedback-warning">Tệp không đúng định dạng OS Quest 11.</div>'}})
  document.querySelector('#resetAll').addEventListener('click',()=>{if(!confirm('Xóa toàn bộ tiến trình, XP, huy hiệu và chứng chỉ?'))return;localStorage.removeItem(STORAGE_KEY);progress=createInitialProgress();persist();setToast('Đã xóa toàn bộ tiến trình.');location.hash='#/'})
}

function renderPrivacy() {shell('<article class="card text-page"><span class="eyebrow">QUYỀN RIÊNG TƯ</span><h1>Dữ liệu được sử dụng như thế nào?</h1><p>OS Quest 11 không yêu cầu camera, microphone hoặc số điện thoại thật. Các mô phỏng sử dụng dữ liệu ảo.</p><h2>Lưu cục bộ</h2><p>Tiến trình, XP, huy hiệu, điểm và chứng chỉ được lưu trong localStorage trên trình duyệt. Dữ liệu không tự động gửi ra bên ngoài.</p><h2>Supabase tùy chọn</h2><p>Dự án có sẵn biến môi trường để nhà trường tích hợp Supabase sau khi xây dựng schema và chính sách RLS. Website cơ bản không phụ thuộc máy chủ.</p></article>','/privacy')}

function renderRoute() {
  applySettings()
  const route=(location.hash.slice(1)||'/').split('?')[0]
  if(route==='/')return renderDashboard()
  if(route.startsWith('/mission/')){const id=Number(route.split('/').pop());if(!Number.isInteger(id)||id<0||id>7||!isMissionUnlocked(progress,id)){location.hash='#/';return}return [renderMission0,renderMission1,renderMission2,renderMission3,renderMission4,renderMission5,renderMission6,renderMission7][id]()}
  if(route==='/final')return renderFinal()
  if(route==='/quiz')return renderQuiz()
  if(route==='/certificate')return renderCertificate()
  if(route==='/progress')return renderProgress()
  if(route==='/privacy')return renderPrivacy()
  shell('<div class="gate-page card"><span class="gate-icon">404</span><h1>Không tìm thấy trang</h1><a class="button" href="#/">Về trang chủ</a></div>',route)
}

window.addEventListener('hashchange',()=>{window.scrollTo({top:0});renderRoute()})
applySettings();renderRoute()
