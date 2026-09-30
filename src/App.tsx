import { HashRouter, Route, Routes } from 'react-router-dom'
import AreaMap from './pages/AreaMap'
import ComingSoon from './pages/ComingSoon'
import GroupDetail from './pages/GroupDetail'
import MeetingDetail from './pages/MeetingDetail'
import MyGroups from './pages/MyGroups'
import NotFound from './pages/NotFound'
import PlaceKing from './pages/PlaceKing'
import RankingList from './pages/RankingList'
import RankingMap from './pages/RankingMap'

/**
 * 화면 주소
 *  /                    A 내 모임
 *  /group/:id           B 모임 상세
 *  /meet/:id            C 약속 상세
 *  /ranking             D 서울 왕좌 지도
 *  /ranking/area/:area  E 확대 지도
 *  /place/:id           F 왕 상세
 *  /ranking/list        G 랭킹 리스트
 * 지금은 HashRouter(#/...)라 어떤 호스팅에서도 새로고침이 돼요. Vercel 설정 후 BrowserRouter 로 바꿔도 돼요.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MyGroups />} />
        <Route path="/group/:id" element={<GroupDetail />} />
        <Route path="/meet/:id" element={<MeetingDetail />} />
        <Route path="/ranking" element={<RankingMap />} />
        <Route path="/ranking/area/:area" element={<AreaMap />} />
        <Route path="/ranking/list" element={<RankingList />} />
        <Route path="/place/:id" element={<PlaceKing />} />
        <Route path="/alerts" element={<ComingSoon title="알림" tab="alerts" />} />
        <Route path="/my" element={<ComingSoon title="마이" tab="my" />} />
        <Route path="/new" element={<ComingSoon title="새 약속" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  )
}
