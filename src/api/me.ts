/* ─────────────────────────────────────────────
   H 알림 · I 마이 · J 설정 화면의 데이터 (API 연결 지점)
   지금은 가짜 데이터(./store.ts)를 읽고 바꿔요. 재운: 함수 안만 fetch 로 바꾸면 돼요.
   내 모임 목록은 api.myGroups (GET /api/groups, myRole 포함) 하나만 써요.
   ───────────────────────────────────────────── */
import * as mock from '../data/mock'
import type { AlertItem, ID, MyProfile, SettingKey, Settings } from '../data/types'
import { delay } from './index'
import { commit, db } from './store'

export type { AlertCategory, AlertItem, AlertKind, MyProfile, SettingKey, Settings } from '../data/types'

export const meApi = {
  /** 알림 목록 — GET /api/me/alerts */
  alerts: (): Promise<AlertItem[]> => delay(mock.alerts.map((a) => ({ ...a, read: db.alertsRead.includes(a.id) }))),

  /** 알림 읽음 표시 — POST /api/me/alerts/read { ids } (ids 없으면 모두) */
  markRead: (ids?: ID[]): Promise<void> => {
    db.alertsRead = [...new Set([...db.alertsRead, ...(ids ?? mock.alerts.map((a) => a.id))])]
    commit()
    return delay(undefined)
  },

  /** 내 프로필·기록 — GET /api/me/profile */
  profile: (): Promise<MyProfile> => delay({
    ...mock.profile,
    groupCount: db.groups.length,
    mainTitle: db.mainTitle ?? mock.profile.titles[0],
  }),

  /** 대표 칭호 바꾸기 — PATCH /api/me/profile { mainTitle } */
  setMainTitle: (title: string): Promise<{ mainTitle: string }> => {
    db.mainTitle = title
    commit()
    return delay({ mainTitle: title })
  },

  /** 설정 — GET /api/me/settings */
  settings: (): Promise<Settings> => delay({ ...db.settings }),

  /** 설정 바꾸기 — PATCH /api/me/settings { [key]: value } → 바뀐 설정 */
  updateSetting: (key: SettingKey, value: boolean): Promise<Settings> => {
    db.settings = { ...db.settings, [key]: value }
    commit()
    return delay({ ...db.settings })
  },
}
