import { missions, badges, levels } from './missions.mjs'

export const STORAGE_KEY = 'os-quest-11-static-v1'

export function createInitialProgress() {
  return {
    version: 1,
    missions: Object.fromEntries(missions.map((mission) => [mission.id, { completed: false, score: 0, xpEarned: 0, attempts: 0 }])),
    totalXp: 0,
    badges: [],
    finalChallengeCompleted: false,
    quizBestScore: 0,
    quizAttempts: 0,
    certificate: null,
    learner: { name: '', className: '', role: '', avatar: '' },
    learningChecks: {},
    openedChests: {},
    rewards: [],
    settings: { theme: 'light', reducedMotion: false, largeText: false, unlockAll: false, sound: true },
  }
}

export function hasLearnerProfile(state) {
  return Boolean(state?.learner?.name?.trim() && state?.learner?.className?.trim())
}

export function getLevel(xp) {
  return [...levels].reverse().find((level) => xp >= level.min) || levels[0]
}

export function isMissionUnlocked(state, id) {
  return state.settings.unlockAll || id === 0 || Boolean(state.missions[id - 1]?.completed)
}

export function completeMissionState(state, id, score = 100) {
  const mission = missions.find((item) => item.id === id)
  if (!mission) return state
  const previous = state.missions[id]
  const first = !previous.completed
  const badgeIds = badges.filter((badge) => badge.missionId === id).map((badge) => badge.id)
  return {
    ...state,
    totalXp: state.totalXp + (first ? mission.xp : 0),
    badges: [...new Set([...state.badges, ...badgeIds])],
    missions: {
      ...state.missions,
      [id]: { completed: true, score: Math.max(previous.score, score), xpEarned: first ? mission.xp : previous.xpEarned, attempts: previous.attempts + 1, completedAt: previous.completedAt || new Date().toISOString() },
    },
  }
}

export function canTakeFinal(state) {
  return missions.every((mission) => state.missions[mission.id]?.completed)
}

export function canTakeQuiz(state) {
  return canTakeFinal(state) && state.finalChallengeCompleted
}

export function canIssueCertificate(state) {
  return canTakeQuiz(state) && state.quizBestScore >= 80 && state.totalXp >= 750
}

export function calculateQuizPercent(quiz, answers) {
  const total = quiz.reduce((sum, question) => sum + question.points, 0)
  const earned = quiz.reduce((sum, question) => {
    const selected = [...(answers[question.id] || [])].sort((a, b) => a - b)
    const correct = [...question.correct].sort((a, b) => a - b)
    return sum + (selected.length === correct.length && selected.every((value, index) => value === correct[index]) ? question.points : 0)
  }, 0)
  return Math.round(earned / total * 100)
}

export function selectRandom(items, count, random = Math.random) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

export function generateCertificateCode(year = new Date().getFullYear(), random = Math.random) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 8; i += 1) suffix += alphabet[Math.floor(random() * alphabet.length)]
  return `OS11-${year}-${suffix}`
}

export function validateProgress(value) {
  return Boolean(value && value.version === 1 && typeof value.totalXp === 'number' && value.missions && value.settings)
}

export function loadProgress() {
  const initial = createInitialProgress()
  if (typeof localStorage === 'undefined') return initial
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initial
    const parsed = JSON.parse(raw)
    if (!validateProgress(parsed)) return initial
    return {
      ...initial,
      ...parsed,
      missions: { ...initial.missions, ...parsed.missions },
      learner: { ...initial.learner, ...(parsed.learner || {}) },
      learningChecks: parsed.learningChecks || {},
      openedChests: parsed.openedChests || {},
      rewards: parsed.rewards || [],
      settings: { ...initial.settings, ...parsed.settings },
    }
  } catch {
    return initial
  }
}

export function saveProgress(state) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
