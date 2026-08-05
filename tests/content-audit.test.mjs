import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { questions } from '../assets/questions.mjs'
import { theorySections } from '../assets/theory.mjs'
import {
  dailyChallenges,
  bossStations,
  mission1Items,
  windowsTimeline,
  mission3Targets,
  mission4LayerCards,
  mission6UtilityMatches,
  mission7Features,
} from '../assets/activity-data.mjs'

function assertChoiceSchema(item, label, { allowMultiple = false } = {}) {
  assert.ok(item.prompt?.trim(), `${label}: thiếu câu hỏi`)
  assert.ok(Array.isArray(item.options) && item.options.length >= 2, `${label}: thiếu phương án`)
  assert.equal(new Set(item.options).size, item.options.length, `${label}: phương án bị trùng`)
  const correct = allowMultiple ? item.correct : [item.correct]
  assert.ok(correct.every((index) => Number.isInteger(index) && index >= 0 && index < item.options.length), `${label}: chỉ số đáp án không hợp lệ`)
}

function assertCorrectNotUniquelyLongest(options, correctIndex, label) {
  const lengths = options.map((option) => [...option].length)
  const longestDistractor = Math.max(...lengths.filter((_, index) => index !== correctIndex))
  assert.ok(lengths[correctIndex] <= longestDistractor, `${label}: đáp án đúng dài nhất một cách nổi bật (${lengths.join(', ')})`)
}

test('ngân hàng cuối khóa có đúng 40 câu, không trùng mã và đủ giải thích', () => {
  assert.equal(questions.length, 40)
  assert.equal(new Set(questions.map((question) => question.id)).size, 40)
  for (const question of questions) {
    assert.ok(question.explanation?.trim(), `${question.id}: thiếu giải thích`)
    assert.ok(question.hint?.trim(), `${question.id}: thiếu gợi ý`)
  }
})

test('toàn bộ câu hỏi cuối khóa có cấu trúc đáp án hợp lệ', () => {
  for (const question of questions) {
    assertChoiceSchema(question, question.id, { allowMultiple: true })
    if (question.type === 'single') {
      assert.equal(question.correct.length, 1, `${question.id}: câu một đáp án phải có đúng một đáp án`)
      assertCorrectNotUniquelyLongest(question.options, question.correct[0], question.id)
    } else if (question.type === 'multiple') {
      assert.ok(question.correct.length >= 2, `${question.id}: câu nhiều đáp án phải có ít nhất hai đáp án đúng`)
      assert.ok(question.correct.length < question.options.length, `${question.id}: phải có ít nhất một phương án nhiễu`)
    } else if (question.type === 'boolean') {
      assert.deepEqual(question.options, ['Đúng', 'Sai'], `${question.id}: câu đúng/sai sai cấu trúc`)
      assert.equal(question.correct.length, 1)
    } else {
      assert.fail(`${question.id}: loại câu hỏi không được hỗ trợ`)
    }
  }
})

test('các mốc và đáp án trọng yếu khớp hai bài học', () => {
  const byId = Object.fromEntries(questions.map((question) => [question.id, question]))
  assert.equal(byId.q06.options[byId.q06.correct[0]], '1985')
  assert.equal(byId.q07.options[byId.q07.correct[0]], 'Windows 95')
  assert.equal(byId.q08.options[byId.q08.correct[0]], '1991')
  assert.equal(byId.q09.options[byId.q09.correct[0]], '1994')
  assert.deepEqual(byId.q11.correct.map((index) => byId.q11.options[index]), ['Red Hat', 'SUSE', 'Ubuntu'])
  assert.equal(byId.q19.options[byId.q19.correct[0]], 'Cung cấp dịch vụ tìm và mở tệp')
  assert.equal(byId.q24.options[byId.q24.correct[0]], 'Chuyển đối tượng vào Thùng rác')
  assert.equal(byId.q36.options[byId.q36.correct[0]], 'Xem ứng dụng đã cài và xóa ứng dụng không cần thiết')
  assert.equal(byId.q39.options[byId.q39.correct[0]], 'Đúng')
  assert.equal(byId.q40.options[byId.q40.correct[0]], 'Điều phối tài nguyên cho các tiến trình')
})

test('8 câu kiểm tra nhanh có đáp án hợp lệ và không lộ đáp án bằng độ dài', () => {
  const quickChecks = theorySections.map((section) => ({ ...section.quickCheck, id: section.id }))
  assert.equal(quickChecks.length, 8)
  for (const check of quickChecks) {
    assertChoiceSchema(check, `quick-${check.id}`)
    assertCorrectNotUniquelyLongest(check.options, check.correct, `quick-${check.id}`)
    assert.ok(check.explanation?.trim(), `quick-${check.id}: thiếu giải thích`)
  }
})

test('câu khởi động và Boss Stage có khóa đáp án hợp lệ', () => {
  assert.equal(dailyChallenges.length, 4)
  assert.equal(bossStations.length, 5)
  for (const item of dailyChallenges) {
    assertChoiceSchema(item, item.id)
    assertCorrectNotUniquelyLongest(item.options, item.correct, item.id)
  }
  for (const [index, item] of bossStations.entries()) {
    assertChoiceSchema(item, `boss-${index + 1}`)
    assertCorrectNotUniquelyLongest(item.options, item.correct, `boss-${index + 1}`)
    assert.ok(item.hint?.trim(), `boss-${index + 1}: thiếu gợi ý`)
  }
})

test('khóa đáp án của các nhiệm vụ tương tác không mơ hồ', () => {
  assert.equal(mission1Items.length, 8)
  assert.ok(mission1Items.every(([, category]) => ['program', 'device', 'data', 'interface', 'utility'].includes(category)))
  assert.deepEqual(windowsTimeline, [
    ['Windows 1', '1985'], ['Windows 3', '1990'], ['Windows 95', '1995'], ['Windows XP', '2001'],
    ['Windows 7', '2009'], ['Windows 8', '2012'], ['Windows 10', '2015'], ['Windows 11', '2021'],
  ])
  assert.equal(new Set(mission3Targets.map(([id]) => id)).size, mission3Targets.length)
  assert.ok(mission4LayerCards.every(([, layer]) => ['app', 'os', 'hardware'].includes(layer)))
  assert.equal(new Set(mission6UtilityMatches.map(([name]) => name)).size, mission6UtilityMatches.length)
  assert.equal(new Set(mission6UtilityMatches.map(([, purpose]) => purpose)).size, mission6UtilityMatches.length)
  assert.ok(mission7Features.every(([, group]) => ['mobile', 'common'].includes(group)))
  assert.equal(mission7Features.filter(([, group]) => group === 'mobile').length, 6)
  assert.equal(mission7Features.filter(([, group]) => group === 'common').length, 3)
})

test('nội dung câu hỏi không còn dữ kiện ngoài tài liệu đã loại bỏ', async () => {
  const files = await Promise.all([
    readFile(new URL('../assets/questions.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../assets/theory.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../assets/activity-data.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../assets/app.mjs', import.meta.url), 'utf8'),
  ])
  const combined = files.join('\n')
  assert.equal(/\bDebian\b/i.test(combined), false, 'Tài liệu nguồn không nêu Debian trong danh sách bản phân phối')
  assert.equal(/Dung lượng, quyền truy cập và mức cần thiết/i.test(combined), false, 'Không dùng đáp án ngoài phạm vi bài học')
})

test('hoàn thành nhiệm vụ có luồng chuyển tiếp trực tiếp', async () => {
  const appSource = await readFile(new URL('../assets/app.mjs', import.meta.url), 'utf8')
  assert.match(appSource, /function showMissionCompleteFlow\(/)
  assert.match(appSource, /Tiếp tục nhiệm vụ/)
  assert.match(appSource, /Vào Boss Stage/)
  assert.match(appSource, /#\/mission\/\$\{nextMission\.id\}/)
  assert.match(appSource, /setTimeout\(\(\) => showMissionCompleteFlow/)
})
