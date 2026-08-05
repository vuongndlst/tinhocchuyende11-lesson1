import { missions, badges, levels } from './missions.mjs?v=7.4.0'
import { questions } from './questions.mjs?v=7.4.0'
import { theorySections, getTheoryForMission } from './theory.mjs?v=7.4.0'
import { dailyChallenges, bossStations, mission1Items, mission1Categories, windowsTimeline, mission3Targets, mission4LayerCards, mission6UtilityMatches, mission7Features } from './activity-data.mjs?v=7.4.0'
import {
  createInitialProgress,
  hasLearnerProfile,
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
} from './core.mjs?v=7.4.0'

let progress = loadProgress()
progress.learner ||= { name: '', className: '', role: '', avatar: '' }
progress.learningChecks ||= {}
progress.openedChests ||= {}
progress.rewards ||= []
progress.settings.sound ??= true
let pendingToast = ''
let pendingCelebration = null
const app = document.querySelector('#app')

const CAMPAIGN_STAGES = [
  { id: 0, title: 'Khởi động trung tâm điều khiển', story: 'Byte vừa phát hiện phòng máy mất kết nối với các chức năng cơ bản. Em cần khôi phục vai trò của hệ điều hành.' },
  { id: 1, title: 'Sắp xếp 5 module chức năng', story: 'Hệ thống chỉ hoạt động ổn khi các nhóm chức năng được gắn đúng module.' },
  { id: 2, title: 'Mở khóa dòng thời gian hệ điều hành', story: 'Kho dữ liệu lịch sử bị đảo lộn. Hãy khôi phục những cột mốc Windows và Linux.' },
  { id: 3, title: 'Giải mã giao diện điều khiển', story: 'Bảng điều khiển bị rối. Em cần phân biệt rõ GUI và CLI để kích hoạt đúng giao diện.' },
  { id: 4, title: 'Khôi phục kết nối giữa các tầng hệ thống', story: 'Ứng dụng, hệ điều hành và phần cứng đang giao tiếp sai cách. Em cần chỉnh lại luồng lệnh.' },
  { id: 5, title: 'Dọn dẹp kho tệp bí mật', story: 'Kho lưu trữ dữ liệu trở nên lộn xộn. Hãy dùng đúng thao tác tệp và thư mục.' },
  { id: 6, title: 'Sửa bộ công cụ tiện ích', story: 'Một số tiện ích hỗ trợ đang bị khóa. Em cần chọn đúng công cụ để sửa hệ thống.' },
  { id: 7, title: 'Bảo vệ trạm di động', story: 'Thiết bị di động là lớp phòng thủ cuối cùng trước Boss Stage. Khôi phục toàn bộ tính năng của chúng.' },
]

const CHEST_REWARDS = [
  { tier: 2, id: 'reward-byte', icon: '🤖', title: 'Thẻ đồng đội Byte', description: 'Byte tin tưởng trao cho em quyền truy cập bản đồ bí mật của hệ thống.' },
  { tier: 4, id: 'reward-boost', icon: '⚡', title: 'Boost Card', description: 'Em đã đủ tự tin để học nhanh hơn với những thử thách ngắn và phản hồi tức thì.' },
  { tier: 6, id: 'reward-hacker', icon: '🧩', title: 'Puzzle Decoder', description: 'Em mở khóa tư duy xâu chuỗi, rất hữu ích trước Escape Room.' },
  { tier: 8, id: 'reward-crown', icon: '👑', title: 'OS Crown', description: 'Phần thưởng cho người học đã hoàn thành toàn bộ hành trình nhiệm vụ chính.' },
]

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


function cleanupTransientUi() {
  document.querySelectorAll('#missionCompleteOverlay, .cutscene-overlay, .celebration-burst').forEach((element) => element.remove())
  document.body.classList.remove('modal-open')
}

function queueCelebration(title, emoji = '✨') {
  pendingCelebration = { title, emoji }
}

function showCelebration({ title, emoji = '✨' }) {
  if (document.documentElement.dataset.motion === 'reduced') return
  const burst = document.createElement('div')
  burst.className = 'celebration-burst'
  const particles = Array.from({ length: 18 }, (_, index) => `<span style="--i:${index}">${emoji}</span>`).join('')
  burst.innerHTML = `<div class="celebration-card"><strong>${emoji} ${esc(title)}</strong><small>Tiếp tục chinh phục hành trình OS Quest 11!</small></div><div class="celebration-particles">${particles}</div>`
  document.body.append(burst)
  requestAnimationFrame(() => burst.classList.add('show'))
  setTimeout(() => {
    burst.classList.remove('show')
    setTimeout(() => burst.remove(), 500)
  }, 2400)
}

function getMissionStreak() {
  let streak = 0
  for (const mission of missions) {
    if (progress.missions[mission.id]?.completed) streak += 1
    else break
  }
  return streak
}

let audioCtx = null
function playSound(kind = 'success') {
  if (!progress.settings.sound) return
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return
  audioCtx ||= new AudioCtx()
  const patterns = {
    success: [[740, 0.08], [932, 0.08], [1174, 0.16]],
    chest: [[523, 0.08], [659, 0.08], [784, 0.12], [1046, 0.2]],
    start: [[440, 0.08], [523, 0.08], [659, 0.12]],
    soft: [[392, 0.05], [523, 0.09]],
  }
  const pattern = patterns[kind] || patterns.success
  let when = audioCtx.currentTime + 0.01
  pattern.forEach(([freq, dur], index) => {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = index % 2 === 0 ? 'sine' : 'triangle'
    osc.frequency.setValueAtTime(freq, when)
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.linearRampToValueAtTime(0.05, when + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur)
    osc.connect(gain).connect(audioCtx.destination)
    osc.start(when)
    osc.stop(when + dur + 0.02)
    when += dur * 0.95
  })
}

function getAvailableChestRewards() {
  const completed = missions.filter((mission) => progress.missions[mission.id]?.completed).length
  return CHEST_REWARDS.filter((reward) => completed >= reward.tier && !progress.openedChests?.[reward.tier])
}


function getNextUnlockedMissionId(currentId) {
  const candidates = missions
    .filter((mission) => mission.id > currentId && isMissionUnlocked(progress, mission.id))
    .sort((a, b) => a.id - b.id)
  const unfinished = candidates.find((mission) => !progress.missions[mission.id]?.completed)
  return unfinished?.id ?? candidates[0]?.id ?? null
}

function unlockRewardChest(tier) {
  const reward = CHEST_REWARDS.find((item) => item.tier === tier)
  if (!reward || progress.openedChests?.[tier]) return
  progress.openedChests ||= {}
  progress.rewards ||= []
  progress.openedChests[tier] = reward.id
  if (!progress.rewards.some((item) => item.id === reward.id)) {
    progress.rewards.push({ ...reward, unlockedAt: new Date().toISOString() })
  }
  persist()
  playSound('chest')
  queueCelebration(`Mở Rương Thưởng ${tier / 2}!`, reward.icon)
  setToast(`Em đã nhận: ${reward.title}.`)
  renderRoute()
}


function getMissionStars(state) {
  if (!state?.completed) return 0
  if (state.score >= 90) return 3
  if (state.score >= 75) return 2
  return 1
}

function renderStars(count, label = 'Mức hoàn thành') {
  return `<span class="mission-stars" aria-label="${esc(label)}: ${count}/3 sao">${[1, 2, 3].map((star) => `<span class="${star <= count ? 'earned' : ''}">★</span>`).join('')}</span>`
}

function renderEntryGate() {
  const roleChoices = ['OS Explorer', 'File Ranger', 'System Builder', 'Command Hero']
  const avatarChoices = ['🧑‍🚀', '🤖', '🧠', '🛠️']
  app.innerHTML = `<main class="entry-gate">
    <section class="entry-gate-visual">
      <div class="entry-brand"><span class="brand-mark">OS</span><div><strong>OS QUEST 11</strong><small>Khám phá hệ điều hành</small></div></div>
      <div class="entry-story"><span class="eyebrow">V7 · PLAYER REGISTRATION</span><h1>Phòng máy cần xác nhận thành viên trước khi khởi động.</h1><p>Họ tên và lớp giúp hệ thống lưu đúng tiến trình, hiển thị hồ sơ cá nhân và tự điền thông tin chứng chỉ cuối khóa.</p></div>
      <div class="entry-mascot"><img src="assets/media/byte-mascot.svg" alt="Mascot Byte"><div><strong>Byte:</strong><p>“Hãy nhập đúng họ tên và lớp của em. Sau bước này, bản đồ nhiệm vụ mới được mở!”</p></div></div>
      <div class="entry-features"><span>🔒 Chỉ lưu trên trình duyệt</span><span>🎮 8 nhiệm vụ tương tác</span><span>🎓 Tự điền chứng chỉ</span></div>
    </section>
    <section class="entry-form-panel">
      <form class="entry-form card" id="entryForm" novalidate>
        <div><span class="eyebrow">BƯỚC BẮT BUỘC</span><h2>Đăng ký người học</h2><p>Học sinh cần điền đầy đủ hai trường bắt buộc trước khi vào hệ thống.</p></div>
        <label>Họ và tên học sinh <span>*</span><input id="entryName" maxlength="80" autocomplete="name" placeholder="Ví dụ: Nguyễn Minh An" required></label>
        <label>Lớp <span>*</span><input id="entryClass" maxlength="20" autocomplete="organization" placeholder="Ví dụ: 11A1" required></label>
        <label>Vai trò trong hành trình<select id="entryRole">${roleChoices.map((role) => `<option>${role}</option>`).join('')}</select></label>
        <fieldset class="entry-avatar-picker"><legend>Chọn biểu tượng nhân vật</legend>${avatarChoices.map((avatar, index) => `<label class="avatar-choice ${index === 0 ? 'selected' : ''}"><input type="radio" name="entryAvatar" value="${avatar}" ${index === 0 ? 'checked' : ''}><span>${avatar}</span></label>`).join('')}</fieldset>
        <label class="entry-agreement"><input id="entryAgreement" type="checkbox" required><span>Tôi xác nhận đã nhập đúng họ tên và lớp của mình.</span></label>
        <button class="button entry-submit" type="submit">Xác nhận và mở hệ thống →</button>
        <div id="entryFeedback" aria-live="polite"></div>
        <small class="entry-privacy">Dữ liệu được lưu cục bộ bằng localStorage và không tự động gửi ra ngoài.</small>
      </form>
    </section>
  </main>`
  document.querySelectorAll('.entry-avatar-picker input').forEach((input) => input.addEventListener('change', () => {
    document.querySelectorAll('.entry-avatar-picker .avatar-choice').forEach((label) => label.classList.toggle('selected', label.querySelector('input').checked))
  }))
  document.querySelector('#entryForm').addEventListener('submit', (event) => {
    event.preventDefault()
    const name = document.querySelector('#entryName').value.trim().replace(/\s+/g, ' ')
    const className = document.querySelector('#entryClass').value.trim().replace(/\s+/g, ' ')
    const agreement = document.querySelector('#entryAgreement').checked
    const feedback = document.querySelector('#entryFeedback')
    if (name.length < 3 || className.length < 2 || !agreement) {
      feedback.innerHTML = '<div class="feedback feedback-warning">Hãy nhập đầy đủ họ tên, lớp và xác nhận thông tin trước khi tiếp tục.</div>'
      return
    }
    progress.learner = {
      name,
      className,
      role: document.querySelector('#entryRole').value,
      avatar: document.querySelector('input[name="entryAvatar"]:checked')?.value || '🧑‍🚀',
      registeredAt: new Date().toISOString(),
    }
    progress.learningChecks['profile-registered'] = true
    persist()
    playSound('start')
    queueCelebration(`Chào mừng ${name}!`, progress.learner.avatar)
    setToast(`Hồ sơ lớp ${className} đã được tạo.`)
    location.hash = '#/'
    renderRoute()
  })
}

function navItem(href, icon, label, active = false, disabled = false, complete = false) {
  if (disabled) return `<span class="nav-item nav-disabled"><span>🔒</span><span>${esc(label)}</span></span>`
  return `<a class="nav-item ${active ? 'active' : ''}" href="#${href}"><span>${icon}</span><span>${esc(label)}</span>${complete ? '<b>✓</b>' : ''}</a>`
}

function getRouteCoach(route) {
  if (route === '/') return { icon: '🤖', title: 'Coach OS', text: 'Bắt đầu bằng Kiến thức nền hoặc nhiệm vụ đang mở. Mỗi nhiệm vụ gồm: học nhanh → xem minh họa → làm thử thách.' }
  if (route === '/theory') return { icon: '📘', title: 'Mẹo học', text: 'Không cần học thuộc từng câu. Hãy chú ý từ khóa, sơ đồ và ví dụ thực tế.' }
  if (route.startsWith('/mission/')) return { icon: '🧭', title: 'Đang làm nhiệm vụ', text: 'Đọc phần Học nhanh, làm câu kiểm tra 1 phút rồi mới bắt đầu thử thách.' }
  if (route === '/quiz') return { icon: '📝', title: 'Trước khi nộp', text: 'Đọc kĩ yêu cầu chọn một hay nhiều đáp án. Có thể đánh dấu câu chưa chắc và quay lại.' }
  return { icon: '💡', title: 'Gợi ý', text: 'Tiến trình được lưu tự động trên trình duyệt này.' }
}

function bindGlobalInteractions(route) {
  document.querySelectorAll('[data-youtube-id]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.youtubeId
    const start = Number(button.dataset.youtubeStart || 0)
    const frame = document.createElement('iframe')
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&cc_load_policy=1${start ? `&start=${start}` : ''}`
    frame.title = button.dataset.youtubeTitle || 'Video YouTube minh họa'
    frame.loading = 'lazy'
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
    frame.allowFullscreen = true
    button.replaceWith(frame)
  }))
  document.querySelectorAll('img[data-fallback]').forEach((image) => image.addEventListener('error', () => {
    if (image.dataset.fallback && image.src !== image.dataset.fallback) image.src = image.dataset.fallback
  }, { once: true }))
  document.querySelectorAll('[data-quick-check]').forEach((group) => {
    const id = group.dataset.quickCheck
    group.querySelectorAll('button[data-answer]').forEach((button) => button.addEventListener('click', () => {
      const correct = Number(group.dataset.correct)
      const chosen = Number(button.dataset.answer)
      const feedback = group.querySelector('.quick-check-feedback')
      group.querySelectorAll('button[data-answer]').forEach((item) => item.disabled = true)
      button.classList.add(chosen === correct ? 'answer-correct' : 'answer-wrong')
      group.querySelector(`button[data-answer="${correct}"]`)?.classList.add('answer-correct')
      if (chosen === correct) {
        progress.learningChecks[id] = true
        persist()
        feedback.innerHTML = `<strong>Chính xác!</strong> ${esc(group.dataset.explanation)} <button class="button button-small" data-start-practice>Bắt đầu thực hành ↓</button>`
      } else feedback.innerHTML = `<strong>Chưa đúng.</strong> ${esc(group.dataset.explanation)} Em có thể tiếp tục thực hành và quay lại ôn sau.`
      group.querySelector('[data-start-practice]')?.addEventListener('click', () => document.querySelector('.activity-card, .lesson-note')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }))
  })
  document.querySelector('#coachToggle')?.addEventListener('click', () => document.querySelector('#coachPanel')?.classList.toggle('open'))
  document.querySelector('#closeCoach')?.addEventListener('click', () => document.querySelector('#coachPanel')?.classList.remove('open'))
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
          ${navItem('/theory', '📘', 'Kiến thức nền', route === '/theory')}
          ${sidebar}
          ${navItem('/final', '🚨', 'Escape Room', route === '/final')}
          ${navItem('/quiz', '📝', 'Kiểm tra cuối khóa', route === '/quiz')}
          ${navItem('/certificate', '🎓', 'Chứng chỉ', route === '/certificate')}
          ${navItem('/sources', '🔗', 'Nguồn học liệu', route === '/sources')}
        </nav>
        <div class="sidebar-progress"><div class="progress-label"><span>Hành trình</span><strong>${percent}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div><div class="xp-line"><strong>${progress.totalXp} XP</strong><span>${esc(level.name)}</span></div></div>
      </aside>
      <div class="main-column">
        <header class="topbar"><div><strong>${progress.totalXp} XP</strong><span class="topbar-level"> · ${esc(level.name)}</span></div><div class="top-actions"><button class="icon-button" id="themeToggle" aria-label="Đổi chế độ sáng tối">${progress.settings.theme === 'light' ? '🌙' : '☀️'}</button><button class="icon-button" id="textToggle" aria-label="Bật chữ lớn">A+</button><button class="icon-button" id="soundToggle" aria-label="Bật hoặc tắt âm thanh">${progress.settings.sound ? '🔊' : '🔈'}</button><a class="button button-small button-ghost" href="#/progress">Tiến trình</a></div></header>
        <main id="main-content" class="content">${content}</main>
        <footer class="site-footer"><span>OS Quest 11 V7.4 · Giáo viên: Nguyễn Đình Vương</span><span><a href="#/sources">Nguồn học liệu</a> · <a href="#/privacy">Quyền riêng tư</a></span></footer>
      </div>
    </div>
    ${(() => { const coach = getRouteCoach(route); return `<button class="coach-toggle" id="coachToggle" aria-label="Mở trợ lý học tập">${coach.icon}</button><aside class="coach-panel" id="coachPanel"><button id="closeCoach" aria-label="Đóng">×</button><strong>${coach.title}</strong><p>${coach.text}</p></aside>` })()}`
  document.querySelector('#themeToggle')?.addEventListener('click', () => {
    progress.settings.theme = progress.settings.theme === 'light' ? 'dark' : 'light'
    persist(); renderRoute()
  })
  document.querySelector('#textToggle')?.addEventListener('click', () => {
    progress.settings.largeText = !progress.settings.largeText
    persist(); renderRoute()
  })
  document.querySelector('#soundToggle')?.addEventListener('click', () => {
    progress.settings.sound = !progress.settings.sound
    if (progress.settings.sound) playSound('soft')
    persist(); renderRoute()
  })
  bindGlobalInteractions(route)
  if (pendingToast) { showToast(pendingToast); pendingToast = '' }
  if (pendingCelebration) { showCelebration(pendingCelebration); pendingCelebration = null }
}

function renderMediaGallery(media = {}, compact = false) {
  const images = media.images || []
  const videos = media.videos || []
  if (!images.length && !videos.length) return ''
  const imageCards = images.map((item) => `<figure class="media-card media-image ${compact ? 'compact' : ''}"><img src="${esc(item.src)}" ${item.fallback ? `data-fallback="${esc(item.fallback)}"` : ''} alt="${esc(item.alt || '')}" loading="lazy"><figcaption><span>${esc(item.caption || '')}</span><small>Nguồn: ${item.sourceUrl ? `<a href="${esc(item.sourceUrl)}" target="_blank" rel="noopener">${esc(item.sourceName || 'Xem nguồn')}</a>` : esc(item.sourceName || 'OS Quest 11')}${item.license ? ` · ${esc(item.license)}` : ''}</small></figcaption></figure>`).join('')
  const videoCards = videos.map((item) => {
    const watchUrl = `https://www.youtube.com/watch?v=${item.youtubeId}${item.start ? `&t=${item.start}s` : ''}`
    return `<figure class="media-card media-video ${compact ? 'compact' : ''}"><button class="youtube-placeholder" data-youtube-id="${esc(item.youtubeId)}" data-youtube-title="${esc(item.title)}" data-youtube-start="${item.start || 0}" aria-label="Phát video ${esc(item.title)}"><img src="https://i.ytimg.com/vi/${esc(item.youtubeId)}/hqdefault.jpg" alt="Ảnh thu nhỏ video ${esc(item.title)}" loading="lazy"><span class="youtube-play">▶</span><span class="youtube-duration">YouTube</span></button><figcaption><strong>${esc(item.title)}</strong><span>${esc(item.description || '')}</span>${item.note ? `<em>Gợi ý học: ${esc(item.note)}</em>` : ''}<small>Kênh: ${esc(item.channel || 'YouTube')} · <a href="${watchUrl}" target="_blank" rel="noopener">Mở trên YouTube</a></small></figcaption></figure>`
  }).join('')
  return `<section class="media-gallery ${compact ? 'compact' : ''}"><div class="media-gallery-title"><strong>Quan sát và khám phá</strong><span>Video chỉ tải khi em bấm phát.</span></div><div class="media-grid">${imageCards}${videoCards}</div></section>`
}

function renderTheoryBeforeMission(id) {
  const theory = getTheoryForMission(id)
  if (!theory) return ''
  const quick = theory.quickCheck
  const checkDone = Boolean(progress.learningChecks[theory.id])
  return `<section class="card theory-before-mission" aria-labelledby="theory-mission-${id}">
    <div class="lesson-stepper" aria-label="Quy trình nhiệm vụ"><span class="active"><b>1</b> Học nhanh</span><span><b>2</b> Quan sát</span><span><b>3</b> Thực hành</span><span><b>4</b> Nhận XP</span></div>
    <div class="theory-heading"><div class="theory-icon">${theory.icon}</div><div><span class="eyebrow">HỌC NHANH TRƯỚC KHI THỰC HÀNH</span><h2 id="theory-mission-${id}">${esc(theory.title)}</h2><p>${esc(theory.summary)}</p></div></div>
    <div class="theory-grid"><div><h3>Kiến thức cần nhớ</h3><ul>${theory.bullets.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div><div class="theory-side"><div><strong>Ví dụ</strong><p>${esc(theory.example)}</p></div><div><strong>Điểm cần lưu ý</strong><p>${esc(theory.check)}</p></div></div></div>
    ${renderMediaGallery(theory.media, true)}
    ${quick ? `<section class="quick-check ${checkDone ? 'completed' : ''}" data-quick-check="${esc(theory.id)}" data-correct="${quick.correct}" data-explanation="${esc(quick.explanation)}"><div><span class="quick-check-icon">${checkDone ? '✓' : '?'}</span><div><span class="eyebrow">KIỂM TRA 1 PHÚT</span><h3>${esc(quick.prompt)}</h3></div></div><div class="quick-check-options">${quick.options.map((option, index) => `<button type="button" data-answer="${index}" ${checkDone ? 'disabled' : ''}><span>${String.fromCharCode(65 + index)}</span>${esc(option)}</button>`).join('')}</div><div class="quick-check-feedback">${checkDone ? '<strong>Đã hoàn thành.</strong> Em có thể bắt đầu phần thực hành.' : 'Chọn một phương án để kiểm tra nhanh.'}</div></section>` : ''}
    <div class="keyword-row"><strong>Từ khóa:</strong>${theory.keywords.map((word) => `<span>${esc(word)}</span>`).join('')}</div>
    <a class="inline-link" href="#/theory">Xem toàn bộ phần kiến thức nền →</a>
  </section>`
}

function renderMissionLanding(id) {
  const mission = missions[id]
  const stage = CAMPAIGN_STAGES.find((item) => item.id === id)
  const completed = missions.filter((item) => progress.missions[item.id]?.completed).length
  const theory = getTheoryForMission(id)
  const content = `<div class="stage-landing-page">
    <section class="stage-landing-hero card">
      <div class="stage-landing-copy">
        <span class="eyebrow">CHẶNG ${id + 1}/8 · LANDING PAGE</span>
        <h1>${esc(stage?.title || mission.title)}</h1>
        <p>${esc(stage?.story || mission.subtitle)}</p>
        <div class="stage-landing-meta"><span>${mission.icon} ${esc(mission.title)}</span><span>⏱ ${mission.estimatedMinutes} phút</span><span>⚡ +${mission.xp} XP</span><span>📈 Đã xong ${completed}/8</span></div>
        <div class="hero-actions"><button class="button" id="enterMissionStage" data-stage-id="${id}">Bắt đầu chặng ${id + 1} →</button><a class="button button-ghost" href="#/">Về bản đồ</a></div>
      </div>
      <div class="stage-landing-mascot"><img src="assets/media/byte-mascot.svg" alt="Mascot Byte"><blockquote>“${id === 0 ? 'Hãy giúp tớ khôi phục những chức năng đầu tiên của hệ thống.' : 'Module mới đã xuất hiện. Hãy đọc tín hiệu và hoàn thành nhiệm vụ.'}”</blockquote></div>
    </section>
    <section class="stage-landing-grid">
      <article class="card"><span class="stage-card-icon">🎯</span><h2>Mục tiêu</h2><p>${esc(mission.subtitle)}</p></article>
      <article class="card"><span class="stage-card-icon">📘</span><h2>Kiến thức cần dùng</h2><p>${esc(theory?.summary || 'Đọc phần học nhanh trước khi thực hành.')}</p></article>
      <article class="card"><span class="stage-card-icon">🎁</span><h2>Phần thưởng</h2><p>Nhận ${mission.xp} XP, sao nhiệm vụ và tiến gần hơn tới rương thưởng.</p></article>
    </section>
  </div>`
  shell(content, `/mission/${id}`)
  document.querySelector('#enterMissionStage')?.addEventListener('click', () => {
    progress.learningChecks[`stage-landing-${id}`] = true
    progress.learningChecks[`cutscene-${id}`] = true
    persist()
    playSound('start')
    renderRoute()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

function missionHeader(id, body) {
  const mission = missions[id]
  const missionState = progress.missions[id]
  const done = missionState?.completed
  const completed = missions.filter((item) => progress.missions[item.id]?.completed).length
  const stage = CAMPAIGN_STAGES.find((item) => item.id === id)
  const stars = getMissionStars(missionState)
  const nextMissionId = getNextUnlockedMissionId(id)
  const nextMission = nextMissionId !== null ? missions.find((item) => item.id === nextMissionId) : null
  const nextStepCard = done ? `<section class="card mission-next-step" id="nextMissionStep"><div class="mission-next-step__icon">🚀</div><div class="mission-next-step__content"><span class="eyebrow">BƯỚC TIẾP THEO</span><h2>${nextMission ? `Sẵn sàng qua nhiệm vụ ${nextMission.id}: ${esc(nextMission.title)}` : 'Em đã hoàn thành chặng nhiệm vụ này!'}</h2><p>${nextMission ? 'Em có thể đi tiếp ngay để giữ mạch học tập. Chặng mới sẽ mở bằng một landing page ngắn trước khi vào nhiệm vụ.' : 'Tất cả nhiệm vụ chính đã xong. Đây là lúc em bước vào Boss Stage hoặc quay lại ôn tập.'}</p><div class="hero-actions mission-next-actions">${nextMission ? `<a class="button" href="#/mission/${nextMission.id}">Qua nhiệm vụ kế tiếp →</a>` : '<a class="button" href="#/final">Vào Boss Stage →</a>'}<a class="button button-ghost" href="#/">Về bản đồ nhiệm vụ</a></div></div></section>` : ''
  return `<section class="mission-page mission-page-plus">
    <div class="mission-hero card mission-hero-plus"><div class="mission-icon">${mission.icon}</div><div><span class="eyebrow">NHIỆM VỤ ${id}</span><h1>${esc(mission.title)}</h1><p>${esc(mission.subtitle)}</p><div class="chip-row"><span class="chip">+${mission.xp} XP</span><span class="chip">${mission.estimatedMinutes} phút</span><span class="chip">Tiến độ ${completed}/8</span>${done ? '<span class="chip chip-success">Đã hoàn thành</span>' : ''}</div>${done ? `<div class="mission-star-result"><span>Kết quả:</span>${renderStars(stars)}</div>` : ''}</div></div>
    <section class="mission-story-banner card"><img src="assets/media/byte-mascot.svg" alt="Mascot Byte"><div><span class="eyebrow">CHƯƠNG TRUYỆN</span><h2>${esc(stage?.title || 'Nhiệm vụ')}</h2><p>${esc(stage?.story || 'Hãy hoàn thành thử thách này để tiến sâu hơn trong hành trình.')}</p></div></section>
    <section class="mission-brief-grid">
      <article class="card mission-brief"><span>🎯</span><div><strong>Mục tiêu nhiệm vụ</strong><p>Đọc nhanh phần gợi ý, quan sát minh họa rồi hoàn thành thử thách tương tác để nhận XP.</p></div></article>
      <article class="card mission-brief"><span>⭐</span><div><strong>Xếp hạng 3 sao</strong><p>Hoàn thành nhiệm vụ với điểm từ 90% để nhận đủ ba sao trên bản đồ hành trình.</p></div></article>
      <article class="card mission-brief"><span>💬</span><div><strong>Mẹo nhỏ</strong><p>Nếu thấy khó, hãy dùng Coach OS ở góc phải và quay lại phần “Học nhanh”.</p></div></article>
    </section>
    ${renderTheoryBeforeMission(id)}
    ${body}
    ${nextStepCard}
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

function showMissionCompleteFlow(id, score, first, hasChest) {
  document.querySelector('#missionCompleteOverlay')?.remove()
  const mission = missions[id]
  const missionState = progress.missions[id]
  const stars = getMissionStars(missionState)
  const nextMissionId = getNextUnlockedMissionId(id)
  const nextMission = nextMissionId !== null ? missions.find((item) => item.id === nextMissionId) : null
  const destination = nextMission ? `#/mission/${nextMission.id}` : '#/final'
  const destinationLabel = nextMission ? `Tiếp tục nhiệm vụ ${nextMission.id}` : 'Vào Boss Stage'
  const overlay = document.createElement('div')
  overlay.className = 'mission-complete-overlay'
  overlay.id = 'missionCompleteOverlay'
  overlay.innerHTML = `<section class="mission-complete-dialog" role="dialog" aria-modal="true" aria-labelledby="missionCompleteTitle">
    <button class="mission-complete-close" type="button" data-stay-current aria-label="Đóng và ở lại nhiệm vụ">×</button>
    <div class="mission-complete-badge">${mission.icon}</div>
    <span class="eyebrow">${first ? 'NHIỆM VỤ ĐÃ HOÀN THÀNH' : 'KẾT QUẢ ĐÃ CẬP NHẬT'}</span>
    <h1 id="missionCompleteTitle">${esc(mission.title)}</h1>
    <div class="mission-complete-stars">${renderStars(stars)}</div>
    <div class="mission-complete-stats"><span><strong>${score}%</strong> kết quả</span><span><strong>+${first ? mission.xp : 0} XP</strong> nhận được</span>${hasChest ? '<span><strong>🎁 Rương mới</strong> đã mở khóa</span>' : ''}</div>
    <p>${nextMission ? `Byte đã mở khóa chương tiếp theo: <strong>${nextMission.id}. ${esc(nextMission.title)}</strong>.` : 'Byte xác nhận toàn bộ tám module đã ổn định. Em đã sẵn sàng đối đầu Boss Glitch.'}</p>
    <a class="button mission-continue-button" href="${destination}" data-continue-next>${destinationLabel} →</a>
    <div class="mission-complete-secondary"><button class="button button-ghost" type="button" data-stay-current>Ở lại xem kết quả</button><a class="button button-ghost" href="#/">Về bản đồ</a></div>
  </section>`
  document.body.append(overlay)
  document.body.classList.add('modal-open')
  requestAnimationFrame(() => overlay.classList.add('show'))
  overlay.querySelector('[data-continue-next]')?.addEventListener('click', (event) => {
    event.preventDefault()
    playSound('start')
    overlay.classList.remove('show')
    document.body.classList.remove('modal-open')
    setTimeout(() => {
      overlay.remove()
      if (location.hash === destination) renderRoute()
      else location.hash = destination
    }, 180)
  })
  overlay.querySelector('.mission-complete-secondary a[href="#/"]')?.addEventListener('click', (event) => {
    event.preventDefault()
    overlay.remove()
    document.body.classList.remove('modal-open')
    location.hash = '#/'
  })
  overlay.querySelectorAll('[data-stay-current]').forEach((button) => button.addEventListener('click', () => {
    overlay.classList.remove('show')
    document.body.classList.remove('modal-open')
    setTimeout(() => {
      overlay.remove()
      document.querySelector('#nextMissionStep')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 260)
  }))
  setTimeout(() => overlay.querySelector('[data-continue-next]')?.focus(), 180)
}

function finishMission(id, score = 100) {
  const first = !progress.missions[id]?.completed
  progress = completeMissionState(progress, id, score)
  persist()
  const newChest = getAvailableChestRewards()[0]
  if (first) {
    playSound('success')
    queueCelebration(`Hoàn thành nhiệm vụ ${id} · +${missions[id].xp} XP`, missions[id].icon)
  }
  setToast(first ? `Hoàn thành nhiệm vụ ${id}! +${missions[id].xp} XP${newChest ? ' · Có rương thưởng mới!' : ''}` : `Đã cập nhật kết quả nhiệm vụ ${id}.`)
  renderRoute()
  setTimeout(() => showMissionCompleteFlow(id, score, first, Boolean(newChest)), first ? 850 : 180)
}


function renderDashboard() {
  const completed = missions.filter((mission) => progress.missions[mission.id]?.completed).length
  const percent = Math.round(completed / 8 * 100)
  const level = getLevel(progress.totalXp)
  const next = missions.find((mission) => isMissionUnlocked(progress, mission.id) && !progress.missions[mission.id]?.completed)
  const streak = getMissionStreak()
  const learnerName = progress.learner?.name?.trim()
  const learnerClass = progress.learner?.className?.trim()
  const learnerAvatar = progress.learner?.avatar || '🧑‍🚀'
  const learnerRole = progress.learner?.role || 'OS Explorer'
  const roleChoices = ['OS Explorer', 'File Ranger', 'System Builder', 'Command Hero']
  const avatarChoices = ['🧑‍🚀', '🤖', '🧠', '🛠️']
  const dailyChallenge = dailyChallenges[completed % dailyChallenges.length]
  const dailyDone = Boolean(progress.learningChecks[dailyChallenge.id])
  const quests = [
    { label: 'Cá nhân hóa hồ sơ', done: Boolean(learnerName), cta: '#/' },
    { label: next ? `Hoàn thành nhiệm vụ ${next.id}` : 'Hoàn tất Escape Room', done: next ? false : progress.finalChallengeCompleted, cta: next ? `#/mission/${next.id}` : '#/final' },
    { label: 'Mở ít nhất 1 huy hiệu', done: progress.badges.length > 0, cta: '#mission-map' },
    { label: 'Đạt quiz ≥ 80%', done: progress.quizBestScore >= 80, cta: '#/quiz' },
  ]
  const availableChests = getAvailableChestRewards()
  const rewardCards = (progress.rewards || []).map((reward) => `<article class="reward-card"><span>${reward.icon}</span><div><strong>${esc(reward.title)}</strong><p>${esc(reward.description)}</p></div></article>`).join('')
  const storyMap = CAMPAIGN_STAGES.map((stage) => {
    const done = progress.missions[stage.id]?.completed
    const current = next?.id === stage.id
    return `<article class="story-node ${done ? 'done' : ''} ${current ? 'current' : ''}"><div class="story-node-badge">${done ? '✓' : stage.id + 1}</div><div><strong>${esc(stage.title)}</strong><p>${esc(stage.story)}</p></div></article>`
  }).join('')
  const cards = missions.map((mission) => {
    const unlocked = isMissionUnlocked(progress, mission.id)
    const done = progress.missions[mission.id]?.completed
    const stateText = done ? 'Đã chinh phục' : unlocked ? 'Sẵn sàng khám phá' : 'Khóa'
    return `<article class="mission-card ${done ? 'completed' : ''} ${!unlocked ? 'locked' : ''}"><div class="mission-card-top"><span class="mission-number">${done ? '✓' : unlocked ? mission.id : '🔒'}</span><span class="mission-card-icon">${mission.icon}</span></div><div class="mission-card-state">${stateText}</div><h3>${esc(mission.title)}</h3><p>${esc(mission.subtitle)}</p>${done ? renderStars(getMissionStars(progress.missions[mission.id])) : '<span class="mission-stars preview"><span>★</span><span>★</span><span>★</span></span>'}<div class="mission-card-meta"><span>+${mission.xp} XP</span><span>${mission.estimatedMinutes} phút</span></div>${unlocked ? `<a class="card-link" href="#/mission/${mission.id}">${done ? 'Chơi lại để ôn' : 'Bắt đầu nhiệm vụ'} →</a>` : '<span class="card-link disabled">Hoàn thành nhiệm vụ trước</span>'}</article>`
  }).join('')
  const badgeCards = badges.map((badge) => `<div class="badge-card ${progress.badges.includes(badge.id) ? 'earned' : ''}"><span>${progress.badges.includes(badge.id) ? badge.icon : '◌'}</span><div><strong>${esc(badge.name)}</strong><small>${esc(badge.description)}</small></div></div>`).join('')
  const learnerCard = learnerName ? `
    <section class="learner-welcome card learner-pro-card">
      <div class="learner-pro-head">
        <div class="learner-avatar big">${learnerAvatar}</div>
        <div><span class="eyebrow">TRẠM CHỈ HUY CỦA EM</span><h2>${esc(learnerName)}${learnerClass ? ` · Lớp ${esc(learnerClass)}` : ''}</h2><p>${esc(learnerRole)} · ${next ? `Mục tiêu kế tiếp: ${next.id}. ${esc(next.title)}` : 'Em đã hoàn thành các nhiệm vụ chính và sẵn sàng cho đích cuối.'}</p></div>
      </div>
      <div class="profile-pills"><span>🔥 Chuỗi hoàn thành: <strong>${streak}</strong></span><span>🏅 Huy hiệu: <strong>${progress.badges.length}</strong></span><span>🚀 XP hiện tại: <strong>${progress.totalXp}</strong></span><span>🎁 Rương đã mở: <strong>${Object.keys(progress.openedChests || {}).length}</strong></span></div>
      <div class="learner-actions"><a class="button" href="#${next ? `/mission/${next.id}` : '/final'}">${next ? 'Tiếp tục hành trình' : 'Vào thử thách cuối'} →</a><button class="button button-ghost button-small" id="editLearner">Đổi hồ sơ</button></div>
    </section>` : `
    <section class="learner-welcome card onboarding-card advanced">
      <div class="learner-avatar big">🪪</div>
      <div><span class="eyebrow">TẠO NHÂN VẬT HỌC TẬP</span><h2>Hãy tạo hồ sơ nhà thám hiểm công nghệ</h2><p>Chọn tên, vai trò và biểu tượng để website chào em theo phong cách game học tập.</p></div>
      <form class="learner-form" id="learnerForm">
        <label>Tên hiển thị<input id="learnerName" maxlength="50" placeholder="Ví dụ: Minh An" autocomplete="off"></label>
        <label>Lớp <small>(không bắt buộc)</small><input id="learnerClass" maxlength="20" placeholder="Ví dụ: 11A1" autocomplete="off"></label>
        <label>Vai trò<select id="learnerRole">${roleChoices.map((role) => `<option>${role}</option>`).join('')}</select></label>
        <div class="avatar-picker"><span>Chọn biểu tượng</span>${avatarChoices.map((avatar, index) => `<label class="avatar-choice ${index === 0 ? 'selected' : ''}"><input type="radio" name="learnerAvatar" value="${avatar}" ${index === 0 ? 'checked' : ''}><span>${avatar}</span></label>`).join('')}</div>
        <button class="button" type="submit">Khởi động hành trình</button>
      </form>
    </section>`
  const content = `<div class="dashboard-page dashboard-plus dashboard-v6">
    <section class="dashboard-hero dashboard-hero-plus dashboard-hero-v6">
      <div>
        <span class="eyebrow">MISSION CONTROL · OS QUEST 11</span>
        <h1>Phòng máy đang mất ổn định — em có sẵn sàng trở thành OS Master?</h1>
        <p class="hero-subtitle">Theo chân mascot Byte để khôi phục 8 module hệ thống, mở rương thưởng, chinh phục Boss Stage và nhận chứng chỉ cuối hành trình.</p>
        <div class="hero-actions"><a class="button" href="#/theory">Khởi động ở khu học nhanh →</a><a class="button button-ghost" href="#${next ? `/mission/${next.id}` : '/final'}">${next ? `Vào nhiệm vụ ${next.id}` : 'Đến đích cuối'}</a></div>
        <div class="hero-meta hero-meta-plus"><span>🎮 Cảm giác học như game</span><span>🤖 Có mascot đồng hành</span><span>🎁 Có rương thưởng mở khóa</span></div>
      </div>
      <div class="command-card command-card-plus"><div class="command-grid"><div><span>XP</span><strong>${progress.totalXp}</strong></div><div><span>Cấp độ</span><strong>${esc(level.name)}</strong></div><div><span>Nhiệm vụ</span><strong>${completed}/8</strong></div><div><span>Quiz tốt nhất</span><strong>${progress.quizBestScore}%</strong></div></div><div class="progress-label"><span>Tiến trình toàn khóa</span><strong>${percent}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div><div class="energy-strip"><span>🔥 Streak ${streak}</span><span>🏅 ${progress.badges.length} huy hiệu</span><span>🎓 Đích: OS Master</span></div></div>
    </section>
    ${learnerCard}
    <section class="storyline-grid">
      <article class="card mascot-card">
        <div class="mascot-head"><img src="assets/media/byte-mascot.svg" alt="Mascot Byte của OS Quest 11"><div><span class="eyebrow">BYTE SPEAKS</span><h2>“Chúng ta cần khôi phục phòng máy trước khi Boss Glitch quay lại!”</h2><p>${next ? `Gợi ý của Byte: Hãy bắt đầu với nhiệm vụ ${next.id} để sửa module tiếp theo.` : 'Byte báo rằng toàn bộ 8 module đã ổn định. Hãy vào thử thách cuối để khóa an toàn hệ thống.'}</p></div></div>
        <div class="mascot-actions"><a class="button button-ghost" href="#${next ? `/mission/${next.id}` : '/final'}">Làm theo Byte →</a><a class="button button-ghost" href="#/theory">Ôn nhanh cùng Byte</a></div>
      </article>
      <article class="card chapter-card">
        <div class="section-heading compact"><div><span class="eyebrow">CHIẾN DỊCH 8 CHƯƠNG</span><h2>Bản đồ câu chuyện</h2></div></div>
        <div class="story-map">${storyMap}</div>
      </article>
    </section>
    <section class="engagement-grid">
      <article class="card spark-card ${dailyDone ? 'done' : ''}">
        <div class="spark-head"><span class="spark-icon">⚡</span><div><span class="eyebrow">${esc(dailyChallenge.title)}</span><h2>${esc(dailyChallenge.prompt)}</h2></div></div>
        <div class="spark-options">${dailyChallenge.options.map((option, index) => `<button type="button" data-daily-answer="${index}" ${dailyDone ? 'disabled' : ''}><span>${String.fromCharCode(65 + index)}</span>${esc(option)}</button>`).join('')}</div>
        <div id="dailyFeedback" class="spark-feedback">${dailyDone ? '<strong>Đã mở khóa!</strong> Em đã hoàn thành câu khởi động hôm nay.' : 'Trả lời nhanh để khởi động não bộ trước khi vào nhiệm vụ.'}</div>
      </article>
      <article class="card quest-board">
        <div class="section-heading compact"><div><span class="eyebrow">CHECKLIST HÔM NAY</span><h2>4 việc nhỏ giúp học hứng thú hơn</h2></div></div>
        <div class="quest-list">${quests.map((quest) => `<a class="quest-item ${quest.done ? 'done' : ''}" href="${quest.cta}"><span>${quest.done ? '✓' : '○'}</span><div><strong>${esc(quest.label)}</strong><small>${quest.done ? 'Đã hoàn thành' : 'Bấm để thực hiện'}</small></div></a>`).join('')}</div>
      </article>
      <article class="card mode-card">
        <div class="section-heading compact"><div><span class="eyebrow">CHỌN CÁCH HỌC</span><h2>Em muốn bắt đầu như thế nào?</h2></div></div>
        <div class="mode-grid"><a href="#/theory" class="mode-tile"><strong>📘 Học nhanh</strong><small>Đọc sơ đồ, hình, video, từ khóa.</small></a><a href="#${next ? `/mission/${next.id}` : '/final'}" class="mode-tile"><strong>🕹️ Làm nhiệm vụ</strong><small>Thao tác ngay trên mô phỏng.</small></a><a href="#/progress" class="mode-tile"><strong>📊 Xem tiến bộ</strong><small>Kiểm tra XP, huy hiệu và cài đặt.</small></a></div>
      </article>
    </section>
    <section class="reward-section-grid">
      <article class="card chest-card">
        <div class="section-heading compact"><div><span class="eyebrow">RƯƠNG THƯỞNG</span><h2>Mở khóa theo tiến trình</h2></div><p>${availableChests.length ? 'Em có rương thưởng đang chờ mở!' : 'Hoàn thành 2, 4, 6, 8 nhiệm vụ để mở thêm rương.'}</p></div>
        <div class="chest-grid">${CHEST_REWARDS.map((reward) => {
          const opened = Boolean(progress.openedChests?.[reward.tier])
          const ready = availableChests.some((item) => item.tier === reward.tier)
          return `<div class="chest-tile ${opened ? 'opened' : ready ? 'ready' : 'locked'}"><span class="chest-icon">${opened ? reward.icon : ready ? '🎁' : '🔒'}</span><strong>Rương ${reward.tier / 2}</strong><small>Mở khi hoàn thành ${reward.tier}/8 nhiệm vụ</small>${ready ? `<button class="button button-small" data-open-chest="${reward.tier}">Mở rương</button>` : opened ? '<span class="mini-label">Đã mở</span>' : '<span class="mini-label">Chưa mở</span>'}</div>`
        }).join('')}</div>
      </article>
      <article class="card collection-card">
        <div class="section-heading compact"><div><span class="eyebrow">BỘ SƯU TẬP</span><h2>Vật phẩm em đã nhận</h2></div></div>
        <div class="reward-grid">${rewardCards || '<p class="empty-note">Chưa có vật phẩm. Hãy hoàn thành nhiệm vụ để mở rương đầu tiên.</p>'}</div>
      </article>
    </section>
    <section class="learning-strip card learning-strip-plus"><div><span>01</span><p><strong>Học nhanh</strong> bằng nội dung ngắn thay vì đọc quá dài.</p></div><div><span>02</span><p><strong>Xem và chạm</strong> với hình, video, mô phỏng có phản hồi.</p></div><div><span>03</span><p><strong>Thấy tiến bộ</strong> qua XP, streak, checklist, rương thưởng và huy hiệu.</p></div><div><span>04</span><p><strong>Chạm đích</strong> bằng Escape Room, quiz và chứng chỉ.</p></div></section>
    <section class="today-path card today-path-plus"><div><span class="today-icon">🧭</span><div><span class="eyebrow">LỘ TRÌNH GỢI Ý NGAY BÂY GIỜ</span><h2>${next ? `Nên bắt đầu với nhiệm vụ ${next.id}: ${esc(next.title)}` : 'Nên chuyển sang thử thách cuối khóa'}</h2><p>${next ? 'Em chỉ cần đi theo 4 bước: Học nhanh → Xem minh họa → Làm thử thách → Nhận XP.' : 'Em đã hoàn thành phần nhiệm vụ chính. Đây là lúc tổng hợp kiến thức để mở chứng chỉ.'}</p></div></div><a class="button" href="#${next ? `/mission/${next.id}` : '/final'}">Bắt đầu ngay →</a></section>
    <section id="mission-map" class="section-block"><div class="section-heading"><div><span class="eyebrow">BẢN ĐỒ HÀNH TRÌNH</span><h2>Tám nhiệm vụ có cảm giác như màn chơi</h2></div><p>Mỗi nhiệm vụ có luật chơi rõ ràng, phản hồi ngay và phần thưởng XP cụ thể.</p></div><div class="mission-map-grid">${cards}</div></section>
    <section class="endgame-grid"><article class="card endgame-card vibrant"><span class="eyebrow">BOSS STAGE</span><h2>Escape Room</h2><p>Vượt qua năm trạm để giải cứu phòng máy và mở khóa bài kiểm tra cuối.</p><a class="button button-ghost" href="#/final">Đến Boss Stage</a></article><article class="card endgame-card ${canIssueCertificate(progress) ? 'ready' : ''}"><span class="eyebrow">ĐÍCH CUỐI</span><h2>Chứng chỉ OS Master</h2><p>Hoàn thành hành trình, đạt quiz từ 80% và đủ XP để nhận chứng chỉ.</p><a class="button button-ghost" href="#/certificate">Kiểm tra điều kiện</a></article></section>
    <section class="section-block"><div class="section-heading"><div><span class="eyebrow">HUY HIỆU</span><h2>Bộ sưu tập của em</h2></div></div><div class="badge-grid">${badgeCards}</div></section>
  </div>`
  shell(content, '/')
  document.querySelector('#learnerForm')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const name = document.querySelector('#learnerName').value.trim()
    if (!name) { showToast('Hãy nhập tên hiển thị.'); return }
    progress.learner = {
      name,
      className: document.querySelector('#learnerClass').value.trim(),
      role: document.querySelector('#learnerRole').value,
      avatar: document.querySelector('input[name="learnerAvatar"]:checked')?.value || '🧑‍🚀',
    }
    persist(); playSound('start'); queueCelebration(`Chào mừng ${name}!`, progress.learner.avatar); setToast(`Hồ sơ của ${name} đã sẵn sàng.`); renderRoute()
  })
  document.querySelectorAll('.avatar-choice input').forEach((input) => input.addEventListener('change', () => {
    document.querySelectorAll('.avatar-choice').forEach((label) => label.classList.toggle('selected', label.querySelector('input').checked))
  }))
  document.querySelector('#editLearner')?.addEventListener('click', () => {
    progress.learner = { name: '', className: '', role: '', avatar: '' }
    persist(); renderRoute()
  })
  document.querySelectorAll('[data-daily-answer]').forEach((button) => button.addEventListener('click', () => {
    if (dailyDone) return
    const chosen = Number(button.dataset.dailyAnswer)
    const correct = dailyChallenge.correct
    const feedback = document.querySelector('#dailyFeedback')
    document.querySelectorAll('[data-daily-answer]').forEach((item) => item.disabled = true)
    button.classList.add(chosen === correct ? 'answer-correct' : 'answer-wrong')
    document.querySelector(`[data-daily-answer="${correct}"]`)?.classList.add('answer-correct')
    if (chosen === correct) {
      progress.learningChecks[dailyChallenge.id] = true
      persist()
      playSound('success')
      queueCelebration('Đã vượt qua câu khởi động!', '⚡')
      feedback.innerHTML = `<strong>Chính xác!</strong> ${esc(dailyChallenge.explanation)} <a href="#${next ? `/mission/${next.id}` : '/theory'}">Tiếp tục học ngay →</a>`
    } else {
      feedback.innerHTML = `<strong>Chưa đúng.</strong> ${esc(dailyChallenge.explanation)} <a href="#/theory">Ôn nhanh lại phần kiến thức nền →</a>`
    }
  }))
  document.querySelectorAll('[data-open-chest]').forEach((button) => button.addEventListener('click', () => unlockRewardChest(Number(button.dataset.openChest))))
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
  const items = mission1Items
  const categories = mission1Categories
  const rows = items.map(([name, correct], index) => `<label class="match-row" data-match-row="${index}"><strong>${esc(name)}</strong><select data-index="${index}" data-correct="${correct}" aria-label="Phân loại: ${esc(name)}">${categories.map(([value,label]) => `<option value="${value}">${esc(label)}</option>`).join('')}</select><small class="match-row-feedback" aria-live="polite"></small></label>`).join('')
  const categoryLegend = [
    ['device', 'Thiết bị, CPU và bộ nhớ', 'CPU, RAM, bàn phím, máy in và Plug & Play.'],
    ['data', 'Lưu trữ dữ liệu', 'Tệp, thư mục và cách tổ chức dữ liệu.'],
    ['program', 'Chương trình và tài nguyên', 'Nạp, chạy chương trình và phân chia CPU cho tiến trình.'],
    ['interface', 'Giao tiếp người dùng', 'Cửa sổ, biểu tượng, con trỏ và giao diện.'],
    ['utility', 'Tiện ích hệ thống', 'Nén tệp, kiểm tra ổ đĩa và các công cụ hỗ trợ.'],
  ]
  const body = `<div class="card lesson-note"><strong>Quy tắc phân loại:</strong> Trong tài liệu của bài học, CPU và RAM được xếp vào nhóm <em>quản lí thiết bị</em>; còn việc phân chia thời gian CPU cho chương trình đang chạy thuộc nhóm <em>tổ chức chương trình và điều phối tài nguyên</em>.</div><section class="function-category-legend">${categoryLegend.map(([key,title,note]) => `<article class="card category-legend-card" data-category-key="${key}"><strong>${esc(title)}</strong><p>${esc(note)}</p></article>`).join('')}</section><div class="card activity-card"><h2>Phân loại chức năng</h2><p>Chọn nhóm phù hợp cho từng tình huống. Khi bấm chấm, hệ thống chỉ rõ ngay từng mục đúng hoặc cần sửa.</p><div class="matching-list" id="mission1Matching">${rows}</div><div class="hero-actions"><button class="button" id="checkM1">Chấm kết quả</button><button class="button button-ghost" id="resetM1" type="button">Xóa lựa chọn</button></div><div id="m1Feedback"></div></div>`
  shell(missionHeader(1, body), '/mission/1'); bindMissionReset(1)
  const matching = document.querySelector('#mission1Matching')
  const selects = [...matching.querySelectorAll('select[data-index]')]
  const categoryLabel = (value) => categories.find(([key]) => key === value)?.[1] || ''

  selects.forEach((select) => select.addEventListener('change', () => {
    const row = select.closest('[data-match-row]')
    row.classList.remove('match-correct', 'match-wrong')
    row.querySelector('.match-row-feedback').textContent = ''
    document.querySelector('#m1Feedback').innerHTML = ''
  }))

  document.querySelector('#resetM1').addEventListener('click', () => {
    selects.forEach((select) => { select.value = '' })
    matching.querySelectorAll('[data-match-row]').forEach((row) => {
      row.classList.remove('match-correct', 'match-wrong')
      row.querySelector('.match-row-feedback').textContent = ''
    })
    document.querySelector('#m1Feedback').innerHTML = ''
  })

  document.querySelector('#checkM1').addEventListener('click', () => {
    let score = 0
    const wrongNames = []
    let firstWrong = null
    selects.forEach((select) => {
      const index = Number(select.dataset.index)
      const expected = select.dataset.correct
      const correct = select.value === expected
      const row = select.closest('[data-match-row]')
      const feedback = row.querySelector('.match-row-feedback')
      row.classList.toggle('match-correct', correct)
      row.classList.toggle('match-wrong', !correct)
      if (correct) {
        score += 1
        feedback.textContent = '✓ Chính xác'
      } else {
        firstWrong ||= select
        wrongNames.push(items[index][0])
        feedback.innerHTML = `${select.value ? 'Chưa đúng.' : 'Chưa chọn.'} <strong>Đáp án đúng: ${esc(categoryLabel(expected))}</strong>`
      }
    })
    if (score === items.length) {
      document.querySelector('#m1Feedback').innerHTML = '<div class="feedback feedback-success"><strong>Đúng 8/8.</strong> Năm nhóm chức năng đã được kích hoạt. Em có thể qua nhiệm vụ kế tiếp.</div>'
      setTimeout(() => finishMission(1), 500)
    } else {
      document.querySelector('#m1Feedback').innerHTML = `<div class="feedback feedback-warning"><strong>Đúng ${score}/8.</strong> Hãy sửa ${items.length - score} mục đang có viền cam. Hai mục thường bị nhầm là <strong>phân chia thời gian CPU</strong> và <strong>máy in Plug & Play</strong>.</div>`
      firstWrong?.focus()
    }
  })
}

function renderMission2() {
  const windows = windowsTimeline
  const years = windows.map(([,year]) => year)
  const body = `<div class="card lesson-note">Ghép phiên bản Windows với năm phát hành và xác nhận thứ tự phát triển Linux.</div><div class="card activity-card"><h2>Timeline Windows</h2><div class="timeline-list">${windows.map(([name], index) => `<div class="timeline-row"><strong>${name}</strong><select data-win="${index}"><option value="">Chọn năm</option>${years.map((year) => `<option>${year}</option>`).join('')}</select></div>`).join('')}</div></div><div class="card activity-card"><h2>Dòng phát triển Linux</h2><ol class="order-list"><li><span>UNIX (1969)</span></li><li><span>Linux do Linus Torvalds phát triển (1991)</span></li><li><span>Linux 1.0 công bố (1994)</span></li><li><span>Các bản phân phối: Red Hat, SUSE và Ubuntu</span></li></ol><label class="select-card"><input id="linuxConfirm" type="checkbox"><span>Tôi xác nhận thứ tự: UNIX → Linux 1991 → Linux 1.0 năm 1994 → các bản phân phối.</span></label><br><button class="button" id="checkM2">Kiểm tra timeline</button><div id="m2Feedback"></div></div>`
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
  const targets = mission3Targets
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
  const cards = mission4LayerCards
  const options = [['','Chọn tầng'],['app','Phần mềm ứng dụng'],['os','Hệ điều hành'],['hardware','Phần cứng']]
  const body = `<div class="card lesson-note"><strong>Thông điệp:</strong> Hệ điều hành là môi trường để phần mềm ứng dụng khai thác hiệu quả phần cứng.</div><div class="card activity-card"><h2>Mô hình bốn tầng</h2><div class="layer-stack static-stack"><div>👤 <strong>Người dùng</strong></div><div>🧩 <strong>Phần mềm ứng dụng</strong></div><div>⚙️ <strong>Hệ điều hành</strong></div><div>🔩 <strong>Phần cứng</strong></div></div><div class="matching-list">${cards.map(([name], index) => `<label><strong>${esc(name)}</strong><select data-layer="${index}">${options.map(([value,label]) => `<option value="${value}">${label}</option>`).join('')}</select></label>`).join('')}</div><button class="button" id="checkM4">Kiểm tra mô hình</button><div id="m4Feedback"></div></div>`
  shell(missionHeader(4, body), '/mission/4'); bindMissionReset(4)
  document.querySelector('#checkM4').addEventListener('click', () => {
    const score = [...document.querySelectorAll('[data-layer]')].filter((select) => select.value === cards[Number(select.dataset.layer)][1]).length
    document.querySelector('#m4Feedback').innerHTML = score === cards.length ? '<div class="feedback feedback-success">Mô hình chính xác! Ứng dụng dùng dịch vụ của hệ điều hành để làm việc với phần cứng.</div>' : `<div class="feedback feedback-warning">Đúng ${score}/10. CPU, RAM và thiết bị thuộc phần cứng; dịch vụ quản lí tệp và điều phối tài nguyên thuộc hệ điều hành.</div>`
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
  const matches = mission6UtilityMatches
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
  const features = mission7Features
  const body=`<div class="card lesson-note">Không nhập dữ liệu cá nhân thật. Số điện thoại và liên hệ trong mô phỏng là dữ liệu giả.</div><div class="mobile-lab-layout"><div class="phone-shell"><div class="phone-status">14:37 <span>▮▮▮ 5G 🔋</span></div><div class="phone-screen"><div class="phone-tabs"><button data-tab="contacts" class="active">👥 Danh bạ</button><button data-tab="calendar">📅 Lịch</button><button data-tab="apps">⚙️ Ứng dụng</button></div><div class="phone-app" id="phoneApp"></div></div><div class="phone-home"></div></div><div class="card mobile-tasks"><h2>Chuỗi thử thách</h2><div class="task-checks" id="mobileChecks"></div><div id="mobileFeedback"></div></div></div><div class="card activity-card"><h2>Phân loại tính năng</h2><div class="feature-table">${features.map(([name],index)=>`<label><strong>${name}</strong><select data-feature="${index}"><option value="">Chọn nhóm</option><option value="mobile">Đặc trưng nổi bật của thiết bị di động</option><option value="common">Chức năng chung của hệ điều hành</option></select></label>`).join('')}</div><button class="button" id="finishM7">Kiểm tra và hoàn thành</button><div id="m7Feedback"></div></div>`
  shell(missionHeader(7,body),'/mission/7');bindMissionReset(7)
  let active='contacts'
  const setFeedback=(text)=>document.querySelector('#mobileFeedback').innerHTML=`<div class="feedback feedback-info">${esc(text)}</div>`
  function checks(){document.querySelector('#mobileChecks').innerHTML=`<div class="${contactDone?'done':''}"><span>${contactDone?'✓':'1'}</span><p>Thêm Nguyễn Minh An vào Nhóm dự án và tìm “An”.</p></div><div class="${calendarDone?'done':''}"><span>${calendarDone?'✓':'2'}</span><p>Tạo lịch họp nhóm và nhắc lặp lại.</p></div><div class="${appDone?'done':''}"><span>${appDone?'✓':'3'}</span><p>Gỡ ứng dụng không cần thiết chiếm nhiều dung lượng.</p></div>`}
  function renderPhone(){
    const container=document.querySelector('#phoneApp')
    if(active==='contacts')container.innerHTML=`<h3>Danh bạ</h3><input id="contactSearch" placeholder="Tìm liên hệ"><button class="phone-primary" id="addContact">＋ Thêm Nguyễn Minh An</button><div id="contactResult"></div>`
    if(active==='calendar')container.innerHTML=`<h3>Lịch và nhắc việc</h3><button class="phone-primary" id="addEvent">＋ Tạo lịch họp nhóm</button><div id="eventResult"></div>`
    if(active==='apps')container.innerHTML=`<h3>Quản lí ứng dụng</h3><div class="app-row"><div><strong>Game Demo</strong><small>Ứng dụng đã cài · Không còn cần thiết</small></div><button id="removeApp">Xóa ứng dụng</button></div><div class="app-row"><div><strong>Bản đồ</strong><small>Ứng dụng đã cài · Vẫn cần sử dụng</small></div><button disabled>Giữ lại</button></div>`
    document.querySelector('#addContact')?.addEventListener('click',()=>{setFeedback('Đã thêm Nguyễn Minh An vào Nhóm dự án. Hãy nhập “An” vào ô tìm kiếm.');document.querySelector('#contactResult').innerHTML='<div class="contact-list"><div><span>👤</span><div><strong>Nguyễn Minh An</strong><small>0900 000 111 · Nhóm dự án</small></div><button>☎</button></div></div>'})
    document.querySelector('#contactSearch')?.addEventListener('input',(event)=>{if(event.target.value.toLowerCase().includes('an')){contactDone=true;checks();setFeedback('Đã tìm thấy Nguyễn Minh An.')}})
    document.querySelector('#addEvent')?.addEventListener('click',()=>{calendarDone=true;checks();document.querySelector('#eventResult').innerHTML='<div class="event-card"><strong>Họp nhóm OS Quest</strong><span>10/08/2026 · 15:30</span><small>Nhắc lặp lại: Có</small></div>';setFeedback('Đã tạo lịch và nhắc việc lặp lại.')})
    document.querySelector('#removeApp')?.addEventListener('click',()=>{appDone=true;checks();document.querySelector('#removeApp').closest('.app-row').remove();setFeedback('Đã xóa Game Demo vì đây là ứng dụng không còn cần thiết.')})
  }
  document.querySelectorAll('[data-tab]').forEach((button)=>button.addEventListener('click',()=>{active=button.dataset.tab;document.querySelectorAll('[data-tab]').forEach((item)=>item.classList.toggle('active',item===button));renderPhone()}))
  document.querySelector('#finishM7').addEventListener('click',()=>{const score=[...document.querySelectorAll('[data-feature]')].filter((select)=>select.value===features[Number(select.dataset.feature)][1]).length;const done=contactDone&&calendarDone&&appDone&&score===9;document.querySelector('#m7Feedback').innerHTML=done?'<div class="feedback feedback-success">Hoàn thành toàn bộ Mobile OS Lab.</div>':`<div class="feedback feedback-warning">Danh bạ ${contactDone?'✓':'○'} · Lịch ${calendarDone?'✓':'○'} · Ứng dụng ${appDone?'✓':'○'} · Phân loại ${score}/9.</div>`;if(done)setTimeout(()=>finishMission(7),500)})
  checks();renderPhone()
}

function renderTheory() {
  const cards = theorySections.map((section, index) => `<article class="card theory-section" id="theory-${section.id}">
    <div class="theory-section-top"><span class="theory-section-number">${String(index + 1).padStart(2, '0')}</span><div class="theory-icon">${section.icon}</div><div><span class="eyebrow">CHỦ ĐỀ ${index + 1}</span><h2>${esc(section.title)}</h2><p>${esc(section.summary)}</p></div></div>
    <div class="theory-grid"><div><h3>Nội dung cốt lõi</h3><ul>${section.bullets.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div><div class="theory-side"><div><strong>Ví dụ thực tế</strong><p>${esc(section.example)}</p></div><div><strong>Điểm cần lưu ý</strong><p>${esc(section.check)}</p></div></div></div>
    ${renderMediaGallery(section.media)}
    <div class="keyword-row"><strong>Từ khóa:</strong>${section.keywords.map((word) => `<span>${esc(word)}</span>`).join('')}</div>
    <div class="theory-actions">${section.missionIds.map((id) => `<a class="button button-small button-ghost" href="#/mission/${id}">Đi đến nhiệm vụ ${id} →</a>`).join('')}</div>
  </article>`).join('')
  const content = `<div class="theory-page"><section class="card theory-hero"><div><span class="eyebrow">KIẾN THỨC NỀN</span><h1>Đọc – hiểu – rồi mới thực hành</h1><p>Phần này tóm tắt kiến thức cốt lõi của hai bài học. Mỗi nhiệm vụ cũng hiển thị lại đúng phần lý thuyết cần dùng trước hoạt động.</p><div class="chip-row"><span class="chip">8 chủ đề ngắn</span><span class="chip">Ví dụ thực tế</span><span class="chip">Từ khóa cần nhớ</span></div></div><div class="theory-hero-icon">📘</div></section><nav class="theory-toc card" aria-label="Mục lục kiến thức">${theorySections.map((section, index) => `<button type="button" data-theory-jump="${section.id}"><span>${index + 1}</span>${esc(section.title)}</button>`).join('')}</nav><div class="theory-sections">${cards}</div><section class="card theory-ready"><div><span class="eyebrow">SẴN SÀNG THỰC HÀNH</span><h2>Bắt đầu từ nhiệm vụ 0</h2><p>Em có thể quay lại phần lý thuyết bất cứ lúc nào trong quá trình làm nhiệm vụ.</p></div><a class="button" href="#/mission/0">Bắt đầu hành trình →</a></section></div>`
  shell(content, '/theory')
  document.querySelectorAll('[data-theory-jump]').forEach((button) => button.addEventListener('click', () => document.querySelector(`#theory-${button.dataset.theoryJump}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })))
}

function renderFinal() {
  if (!canTakeFinal(progress) && !progress.settings.unlockAll) {
    shell('<div class="gate-page card"><span class="gate-icon">🔒</span><h1>Boss Stage chưa mở</h1><p>Hoàn thành đủ 8 nhiệm vụ chính trước khi đối đầu Boss Glitch.</p><a class="button" href="#/">Trở về bản đồ</a></div>', '/final'); return
  }
  const stations = bossStations.map((station) => [station.prompt, station.options, station.correct, station.hint])
  const content = `<div class="challenge-page boss-page"><section class="challenge-hero card boss-hero"><div><span class="eyebrow">BOSS STAGE · 3 PHA</span><h1>Đối đầu Boss Glitch</h1><p>Giải đúng năm trạm để giảm thanh năng lượng của Boss từ 100% xuống 0%.</p></div><div class="boss-character"><span>👾</span><strong id="bossPhaseLabel">PHA 1 · KHỞI ĐỘNG PHÒNG THỦ</strong></div></section><section class="card boss-health-card"><div class="progress-label"><span>Năng lượng Boss Glitch</span><strong id="bossHealthText">100%</strong></div><div class="boss-health-track"><div id="bossHealthBar" style="width:100%"></div></div><p id="bossDialogue">Boss Glitch: “Hệ thống này sẽ không bao giờ được khôi phục!”</p></section><div class="boss-phases"><span class="active" data-phase-indicator="1">Pha 1 · Chức năng & tầng hệ thống</span><span data-phase-indicator="2">Pha 2 · Tệp & tiện ích</span><span data-phase-indicator="3">Pha 3 · Thiết bị di động</span></div><div class="station-grid">${stations.map(([prompt, options], index) => `<article class="card station-card" data-station-card="${index}"><div class="station-top"><span>${index + 1}</span><h2>Trạm ${index + 1}</h2></div><p>${prompt}</p><div class="radio-list">${options.map((option, opt) => `<label><input type="radio" name="station-${index}" value="${opt}"><span>${option}</span></label>`).join('')}</div><button class="button button-small button-ghost" data-check-station="${index}">Tấn công Boss</button><div data-station-feedback="${index}"></div></article>`).join('')}</div><div class="card challenge-submit"><div><strong id="stationCount">0/5 trạm đã giải đúng</strong><p>Gợi ý xuất hiện sau hai lần kiểm tra sai.</p></div><button class="button" id="finishFinal">Kết thúc Boss Stage</button></div><div id="finalFeedback"></div></div>`
  shell(content, '/final')
  const solved = new Set()
  const attempts = {}
  const updateBoss = () => {
    const health = Math.max(0, 100 - solved.size * 20)
    document.querySelector('#bossHealthText').textContent = `${health}%`
    document.querySelector('#bossHealthBar').style.width = `${health}%`
    const phase = solved.size < 2 ? 1 : solved.size < 4 ? 2 : 3
    document.querySelector('#bossPhaseLabel').textContent = phase === 1 ? 'PHA 1 · KHỞI ĐỘNG PHÒNG THỦ' : phase === 2 ? 'PHA 2 · PHÁ VỠ KHO DỮ LIỆU' : 'PHA 3 · ĐÒN KẾT THÚC'
    document.querySelectorAll('[data-phase-indicator]').forEach((item) => item.classList.toggle('active', Number(item.dataset.phaseIndicator) === phase))
    document.querySelector('#bossDialogue').textContent = health === 0 ? 'Byte: “Tuyệt vời! Boss Glitch đã mất toàn bộ năng lượng.”' : health <= 40 ? 'Boss Glitch: “Không thể nào… hệ thống đang hồi phục!”' : health <= 80 ? 'Byte: “Tiếp tục! Mỗi đáp án đúng đang làm Boss yếu đi.”' : 'Boss Glitch: “Hệ thống này sẽ không bao giờ được khôi phục!”'
  }
  document.querySelectorAll('[data-check-station]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.checkStation)
    attempts[index] = (attempts[index] || 0) + 1
    const selected = document.querySelector(`input[name="station-${index}"]:checked`)
    const feedback = document.querySelector(`[data-station-feedback="${index}"]`)
    if (selected && Number(selected.value) === stations[index][2]) {
      const firstSolve = !solved.has(index)
      solved.add(index)
      button.closest('.station-card').classList.add('solved')
      button.disabled = true
      feedback.innerHTML = '<div class="feedback feedback-success">Đòn tấn công chính xác! Boss mất 20% năng lượng.</div>'
      if (firstSolve) playSound('soft')
    } else feedback.innerHTML = `<div class="feedback feedback-warning">Đòn tấn công chưa chính xác.${attempts[index] >= 2 ? ` Gợi ý: ${stations[index][3]}` : ''}</div>`
    document.querySelector('#stationCount').textContent = `${solved.size}/5 trạm đã giải đúng`
    updateBoss()
  }))
  document.querySelector('#finishFinal').addEventListener('click', () => {
    if (solved.size === 5) {
      if (!progress.finalChallengeCompleted) { progress.finalChallengeCompleted = true; progress.totalXp += 80 }
      persist(); playSound('success'); queueCelebration('Boss Glitch đã bị đánh bại!', '👾'); setToast('Phòng máy đã khôi phục! +80 XP'); renderRoute()
    } else document.querySelector('#finalFeedback').innerHTML = `<div class="feedback feedback-warning">Boss vẫn còn ${100 - solved.size * 20}% năng lượng. Hãy hoàn thành ${5 - solved.size} trạm còn lại.</div>`
  })
}

let activeQuiz=null
function renderQuiz() {
  if(!canTakeQuiz(progress)&&!progress.settings.unlockAll){shell('<div class="gate-page card"><span class="gate-icon">📝</span><h1>Bài kiểm tra chưa mở</h1><p>Hoàn thành 8 nhiệm vụ và Escape Room để bắt đầu.</p><a class="button" href="#/">Trở về bản đồ</a></div>','/quiz');return}
  if(!activeQuiz)activeQuiz=selectRandom(questions,15)
  const topicNames={functions:'Chức năng',history:'Windows & Linux',interface:'Giao diện',layers:'Mô hình hệ thống',files:'Tệp & thư mục',utilities:'Tiện ích',mobile:'Di động'}
  const content=`<div class="quiz-page"><section class="quiz-header card"><div><span class="eyebrow">BÀI ĐÁNH GIÁ CUỐI KHÓA</span><h1>15 câu hỏi ngẫu nhiên</h1><p>Điều kiện đạt: từ 80%. Mỗi câu đều ghi rõ cách chọn đáp án.</p></div><div class="quiz-counter"><strong id="answeredCount">0/15</strong><span>đã trả lời</span></div></section><div id="quizQuestions">${activeQuiz.map((q,index)=>`<article class="card question-card" data-question="${q.id}"><div class="question-meta"><span>Câu ${index+1}</span><span>${topicNames[q.topic]}</span><span>${q.level}</span></div><p class="question-instruction">${q.type==='multiple'?'Chọn tất cả đáp án đúng.':q.type==='boolean'?'Chọn Đúng hoặc Sai.':'Chọn một đáp án đúng.'}</p><h2>${q.prompt}</h2><div class="quiz-options">${q.options.map((option,opt)=>`<label><input type="${q.type==='multiple'?'checkbox':'radio'}" name="${q.id}" value="${opt}"><span>${String.fromCharCode(65+opt)}</span><p>${option}</p></label>`).join('')}</div><div class="review-slot"></div></article>`).join('')}</div><div class="card quiz-submit"><div><strong id="quizStatus">Hãy trả lời đủ 15 câu</strong><p>Câu hỏi được chọn từ ngân hàng 40 câu.</p></div><button class="button" id="submitQuiz" disabled>Nộp bài</button></div><div id="quizResult"></div></div>`
  shell(content,'/quiz')
  const update=()=>{const answered=activeQuiz.filter((q)=>document.querySelectorAll(`input[name="${q.id}"]:checked`).length>0).length;document.querySelector('#answeredCount').textContent=`${answered}/15`;document.querySelector('#submitQuiz').disabled=answered<15}
  document.querySelectorAll('.quiz-options input').forEach((input)=>input.addEventListener('change',()=>{input.closest('.quiz-options').querySelectorAll('label').forEach((label)=>label.classList.toggle('selected',label.querySelector('input').checked));update()}))
  document.querySelector('#submitQuiz').addEventListener('click',()=>{
    const answers={};activeQuiz.forEach((q)=>answers[q.id]=[...document.querySelectorAll(`input[name="${q.id}"]:checked`)].map((input)=>Number(input.value)))
    const score=calculateQuizPercent(activeQuiz,answers);progress.quizBestScore=Math.max(progress.quizBestScore,score);progress.quizAttempts+=1
    if(score>=80&&canTakeQuiz(progress)&&!progress.badges.includes('os-master'))progress.badges.push('os-master')
    persist()
    const weak=[]
    activeQuiz.forEach((q)=>{const selected=[...(answers[q.id]||[])].sort().join(',');const correct=[...q.correct].sort().join(',');const card=document.querySelector(`[data-question="${q.id}"]`);const ok=selected===correct;card.classList.add(ok?'correct':'incorrect');const correctText=q.correct.map((answerIndex)=>`${String.fromCharCode(65+answerIndex)}. ${q.options[answerIndex]}`).join('; ');card.querySelector('.review-slot').innerHTML=`<div class="feedback ${ok?'feedback-success':'feedback-info'}"><strong>${ok?'Đúng.':'Chưa đúng.'}</strong> ${q.explanation}${ok?'':`<br><strong>Đáp án đúng:</strong> ${correctText}`}</div>`;if(!ok)weak.push(topicNames[q.topic])})
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
  const content=`<div class="certificate-page"><section class="certificate-header card"><div><span class="eyebrow">ĐÍCH ĐẾN OS QUEST 11</span><h1>Nhận chứng chỉ hoàn thành</h1><p>Chứng chỉ chỉ mở khi em đủ các điều kiện.</p></div><span class="certificate-medal">🎓</span></section><div class="certificate-layout"><aside class="card requirement-card"><h2>Điều kiện</h2><ul><li class="${done===8?'done':''}"><span>${done===8?'✓':'○'}</span>Hoàn thành nhiệm vụ <strong>${done}/8</strong></li><li class="${progress.finalChallengeCompleted?'done':''}"><span>${progress.finalChallengeCompleted?'✓':'○'}</span>Escape Room</li><li class="${progress.quizBestScore>=80?'done':''}"><span>${progress.quizBestScore>=80?'✓':'○'}</span>Quiz ≥ 80% <strong>${progress.quizBestScore}%</strong></li><li class="${progress.totalXp>=750?'done':''}"><span>${progress.totalXp>=750?'✓':'○'}</span>XP ≥ 750 <strong>${progress.totalXp}</strong></li></ul>${!eligible?'<div class="feedback feedback-warning">Em chưa đủ điều kiện nhận chứng chỉ.</div>':''}</aside><section class="card certificate-form"><h2>Thông tin chứng chỉ</h2><label>Họ và tên<input id="certName" value="${esc(cert?.fullName || progress.learner.name || '')}" ${cert?'disabled':''}></label><label>Lớp<input id="certClass" value="${esc(cert?.className || progress.learner.className || '')}" ${cert?'disabled':''}></label><label>Mã học sinh <small>(không bắt buộc)</small><input id="certCode" value="${esc(cert?.studentCode||'')}" ${cert?'disabled':''}></label>${!cert?`<button class="button" id="createCertificate" ${eligible?'':'disabled'}>Tạo chứng chỉ</button>`:'<div class="feedback feedback-success">Chứng chỉ đã được tạo và lưu cục bộ.</div>'}<div id="certFeedback"></div></section></div>${certificateMarkup}</div>`
  shell(content,'/certificate')
  document.querySelector('#createCertificate')?.addEventListener('click',()=>{const name=document.querySelector('#certName').value.trim();const cls=document.querySelector('#certClass').value.trim();if(!name||!cls){document.querySelector('#certFeedback').innerHTML='<div class="feedback feedback-warning">Hãy nhập họ tên và lớp.</div>';return}progress.certificate={fullName:name,className:cls,studentCode:document.querySelector('#certCode').value.trim(),certificateCode:generateCertificateCode(),issuedAt:new Date().toISOString()};persist();playSound('chest');queueCelebration('Chứng chỉ đã sẵn sàng!','🎓');setToast('Đã tạo chứng chỉ.');renderRoute()})
  document.querySelector('#printCertificate')?.addEventListener('click',()=>window.print())
  document.querySelector('#downloadCertData')?.addEventListener('click',()=>downloadText(`OS11-${cert.certificateCode}.json`,JSON.stringify({certificate:cert,quizBestScore:progress.quizBestScore,totalXp:progress.totalXp},null,2),'application/json'))
}

function downloadText(filename,text,type='text/plain') {const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url)}

function renderProgress() {
  const missionRows=missions.map((mission)=>{const state=progress.missions[mission.id];return `<div><span>${state.completed?'✓':mission.icon}</span><div><strong>${mission.id}. ${mission.title}</strong><small>${state.completed?`Hoàn thành · ${state.score}% · ${state.xpEarned} XP`:'Chưa hoàn thành'}</small>${state.completed ? renderStars(getMissionStars(state)) : ''}</div></div>`}).join('')
  const content=`<div class="progress-page"><section class="progress-header card"><div><span class="eyebrow">BẢNG ĐIỀU KHIỂN</span><h1>Tiến trình và cài đặt</h1><p>Dữ liệu được lưu bằng localStorage trên trình duyệt.</p></div><div class="big-xp"><strong>${progress.totalXp}</strong><span>XP</span></div></section><div class="progress-layout"><section class="card"><h2>Tiến trình nhiệm vụ</h2><div class="progress-mission-list">${missionRows}</div></section><section class="card settings-card"><h2>Trợ năng và chế độ giáo viên</h2>${[['theme','Chế độ tối',progress.settings.theme==='dark'],['reducedMotion','Giảm chuyển động',progress.settings.reducedMotion],['largeText','Chữ lớn',progress.settings.largeText],['sound','Âm thanh tương tác',progress.settings.sound],['unlockAll','Mở toàn bộ nhiệm vụ',progress.settings.unlockAll]].map(([key,label,checked])=>`<label class="toggle-row"><span><strong>${label}</strong></span><input type="checkbox" data-setting="${key}" ${checked?'checked':''}></label>`).join('')}</section></div><section class="card data-card"><h2>Sao lưu dữ liệu</h2><div class="data-actions"><button class="button" id="exportProgress">Xuất JSON</button><button class="button button-ghost" id="importProgress">Nhập JSON</button><input type="file" id="progressFile" accept="application/json" hidden><button class="button button-danger" id="resetAll">Xóa toàn bộ tiến trình</button></div><div id="progressFeedback"></div></section></div>`
  shell(content,'/progress')
  document.querySelectorAll('[data-setting]').forEach((input)=>input.addEventListener('change',()=>{const key=input.dataset.setting;if(key==='theme')progress.settings.theme=input.checked?'dark':'light';else progress.settings[key]=input.checked;persist();renderRoute()}))
  document.querySelector('#exportProgress').addEventListener('click',()=>downloadText(`os-quest-11-progress-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(progress,null,2),'application/json'))
  document.querySelector('#importProgress').addEventListener('click',()=>document.querySelector('#progressFile').click())
  document.querySelector('#progressFile').addEventListener('change',async(event)=>{const file=event.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(!validateProgress(parsed))throw new Error();progress={...createInitialProgress(),...parsed,learner:{name:'',className:'',role:'',avatar:'',...(parsed.learner||{})},learningChecks:parsed.learningChecks||{},openedChests:parsed.openedChests||{},rewards:parsed.rewards||[],settings:{...createInitialProgress().settings,...parsed.settings}};persist();setToast('Đã khôi phục tiến trình.');renderRoute()}catch{document.querySelector('#progressFeedback').innerHTML='<div class="feedback feedback-warning">Tệp không đúng định dạng OS Quest 11.</div>'}})
  document.querySelector('#resetAll').addEventListener('click',()=>{if(!confirm('Xóa toàn bộ tiến trình, XP, huy hiệu và chứng chỉ?'))return;localStorage.removeItem(STORAGE_KEY);progress=createInitialProgress();persist();setToast('Đã xóa toàn bộ tiến trình.');location.hash='#/'})
}

function renderSources() {
  const seenImages = new Set()
  const seenVideos = new Set()
  const imageItems = theorySections.flatMap((section) => (section.media?.images || []).map((item) => ({ ...item, section: section.title }))).filter((item) => {
    const key = item.sourceUrl || item.src
    if (seenImages.has(key)) return false
    seenImages.add(key); return true
  })
  const videoItems = theorySections.flatMap((section) => (section.media?.videos || []).map((item) => ({ ...item, section: section.title }))).filter((item) => {
    if (seenVideos.has(item.youtubeId)) return false
    seenVideos.add(item.youtubeId); return true
  })
  const videoCards = videoItems.map((item) => `<article class="source-card"><div class="source-type">▶ VIDEO YOUTUBE</div><h3>${esc(item.title)}</h3><p><strong>Kênh:</strong> ${esc(item.channel || '')}</p><p>${esc(item.description || '')}</p><p class="source-use"><strong>Dùng trong:</strong> ${esc(item.section)}</p><a class="button button-small button-ghost" href="https://www.youtube.com/watch?v=${esc(item.youtubeId)}" target="_blank" rel="noopener">Mở video gốc ↗</a></article>`).join('')
  const imageCards = imageItems.map((item) => `<article class="source-card"><div class="source-type">▧ HÌNH ẢNH</div><h3>${esc(item.caption || item.alt || 'Hình minh họa')}</h3><p><strong>Nguồn:</strong> ${esc(item.sourceName || 'OS Quest 11')}</p><p><strong>Giấy phép/ghi chú:</strong> ${esc(item.license || 'Xem trang nguồn')}</p><p class="source-use"><strong>Dùng trong:</strong> ${esc(item.section)}</p>${item.sourceUrl ? `<a class="button button-small button-ghost" href="${esc(item.sourceUrl)}" target="_blank" rel="noopener">Xem trang nguồn ↗</a>` : '<span class="source-local">Minh họa do hệ thống tự thiết kế.</span>'}</article>`).join('')
  const content = `<div class="sources-page"><section class="card sources-hero"><div><span class="eyebrow">MINH BẠCH HỌC LIỆU</span><h1>Nguồn hình ảnh và video</h1><p>Video được nhúng từ YouTube và chỉ tải trình phát sau khi học sinh bấm nút phát. Hình từ Internet có chú thích nguồn ngay dưới ảnh; các sơ đồ tự thiết kế được đánh dấu riêng.</p></div><span class="sources-icon">🔗</span></section><section class="source-note card"><strong>Lưu ý khi sử dụng trong lớp:</strong><p>Video bên ngoài có thể cần Internet và phụ đề tiếng Việt tự động có thể chưa hoàn hảo. Giáo viên nên xem trước, chọn đoạn phù hợp và có thể dùng sơ đồ nội bộ khi mạng không ổn định.</p></section><section class="section-block"><div class="section-heading"><div><span class="eyebrow">VIDEO</span><h2>${videoItems.length} video được tuyển chọn</h2></div><p>Mỗi video đều có gợi ý đoạn xem hoặc nhiệm vụ quan sát cụ thể trong bài học.</p></div><div class="sources-grid">${videoCards}</div></section><section class="section-block"><div class="section-heading"><div><span class="eyebrow">HÌNH ẢNH</span><h2>${imageItems.length} hình và sơ đồ</h2></div><p>Nguồn và giấy phép được ghi tại từng thẻ và ngay dưới hình trong bài học.</p></div><div class="sources-grid">${imageCards}</div></section></div>`
  shell(content, '/sources')
}

function renderPrivacy() {shell('<article class="card text-page"><span class="eyebrow">QUYỀN RIÊNG TƯ</span><h1>Dữ liệu được sử dụng như thế nào?</h1><p>OS Quest 11 không yêu cầu camera, microphone hoặc số điện thoại thật. Các mô phỏng sử dụng dữ liệu ảo.</p><h2>Lưu cục bộ</h2><p>Họ tên, lớp, tiến trình, XP, huy hiệu, điểm và chứng chỉ được lưu trong localStorage trên trình duyệt. Họ tên và lớp là thông tin bắt buộc để vào hệ thống; người học có thể xóa toàn bộ dữ liệu trong trang Tiến trình.</p><h2>Học liệu bên ngoài</h2><p>Ảnh từ Wikimedia Commons được tải từ máy chủ bên ngoài. Trình phát YouTube chỉ được tải sau khi người học bấm phát video; khi đó chính sách dữ liệu của YouTube có thể được áp dụng.</p><h2>Supabase tùy chọn</h2><p>Dự án có sẵn biến môi trường để nhà trường tích hợp Supabase sau khi xây dựng schema và chính sách RLS. Website cơ bản không phụ thuộc máy chủ.</p></article>','/privacy')}

function renderRoute() {
  cleanupTransientUi()
  applySettings()
  const route=(location.hash.slice(1)||'/').split('?')[0]
  if (!hasLearnerProfile(progress)) { renderEntryGate(); return }
  if(route==='/')return renderDashboard()
  if(route.startsWith('/mission/')){
    const id=Number(route.split('/').pop())
    if(!Number.isInteger(id)||id<0||id>7||!isMissionUnlocked(progress,id)){location.hash='#/';return}
    if(!progress.learningChecks[`stage-landing-${id}`]) return renderMissionLanding(id)
    return [renderMission0,renderMission1,renderMission2,renderMission3,renderMission4,renderMission5,renderMission6,renderMission7][id]()
  }
  if(route==='/theory')return renderTheory()
  if(route==='/final')return renderFinal()
  if(route==='/quiz')return renderQuiz()
  if(route==='/certificate')return renderCertificate()
  if(route==='/progress')return renderProgress()
  if(route==='/sources')return renderSources()
  if(route==='/privacy')return renderPrivacy()
  shell('<div class="gate-page card"><span class="gate-icon">404</span><h1>Không tìm thấy trang</h1><a class="button" href="#/">Về trang chủ</a></div>',route)
}

window.addEventListener('hashchange',()=>{cleanupTransientUi();window.scrollTo({top:0});renderRoute()})
applySettings();renderRoute()
