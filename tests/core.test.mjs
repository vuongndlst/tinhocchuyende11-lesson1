import test from 'node:test'
import assert from 'node:assert/strict'
import { missions } from '../assets/missions.mjs'
import { questions } from '../assets/questions.mjs'
import {
  createInitialProgress,
  hasLearnerProfile,
  isMissionUnlocked,
  completeMissionState,
  canIssueCertificate,
  calculateQuizPercent,
  selectRandom,
  generateCertificateCode,
  validateProgress,
} from '../assets/core.mjs'

test('mở khóa nhiệm vụ theo thứ tự', () => {
  let state = createInitialProgress()
  assert.equal(isMissionUnlocked(state, 0), true)
  assert.equal(isMissionUnlocked(state, 1), false)
  state = completeMissionState(state, 0)
  assert.equal(isMissionUnlocked(state, 1), true)
})

test('XP chỉ cộng một lần khi hoàn thành lại nhiệm vụ', () => {
  let state = createInitialProgress()
  state = completeMissionState(state, 0)
  state = completeMissionState(state, 0)
  assert.equal(state.totalXp, missions[0].xp)
})

test('điều kiện chứng chỉ', () => {
  let state = createInitialProgress()
  for (const mission of missions) state = completeMissionState(state, mission.id)
  state.finalChallengeCompleted = true
  state.totalXp = Math.max(state.totalXp, 750)
  state.quizBestScore = 80
  assert.equal(canIssueCertificate(state), true)
  state.quizBestScore = 79
  assert.equal(canIssueCertificate(state), false)
})

test('chấm câu hỏi một và nhiều đáp án', () => {
  const quiz = [questions[0], questions[2]]
  const answers = {
    [questions[0].id]: [...questions[0].correct],
    [questions[2].id]: [...questions[2].correct],
  }
  assert.equal(calculateQuizPercent(quiz, answers), 100)
})

test('chọn 15 câu không trùng', () => {
  const selected = selectRandom(questions, 15, () => 0.42)
  assert.equal(selected.length, 15)
  assert.equal(new Set(selected.map((q) => q.id)).size, 15)
})

test('mã chứng chỉ đúng định dạng', () => {
  assert.match(generateCertificateCode(2026, () => 0.1), /^OS11-2026-[A-Z2-9]{8}$/)
})

test('từ chối tiến trình nhập thiếu trường bắt buộc', () => {
  assert.equal(validateProgress({ totalXp: 20 }), false)
  assert.equal(validateProgress(createInitialProgress()), true)
})


test('bắt buộc có họ tên và lớp trước khi học', () => {
  const state = createInitialProgress()
  assert.equal(hasLearnerProfile(state), false)
  state.learner.name = 'Nguyễn Minh An'
  assert.equal(hasLearnerProfile(state), false)
  state.learner.className = '11A1'
  assert.equal(hasLearnerProfile(state), true)
})
