import { HashRouter, Route, Routes } from 'react-router-dom'
import AreaMap from './pages/AreaMap'
import GroupDetail from './pages/GroupDetail'
import MeetingDetail from './pages/MeetingDetail'
import MyGroups from './pages/MyGroups'
import NotFound from './pages/NotFound'
import Alerts from './pages/new/Alerts'
import Challenge from './pages/new/Challenge'
import Chat from './pages/new/Chat'
import CreateSheet from './pages/new/CreateSheet'
import My from './pages/new/My'
import NewGroup from './pages/new/NewGroup'
import PlaceList from './pages/new/PlaceList'
import PlaceVote from './pages/new/PlaceVote'
import Settings from './pages/new/Settings'
import Share from './pages/new/Share'
import Tug from './pages/new/Tug'
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
 *  /meet/:id/tug        M 장소 줄다리기 (?pulled=1 → R 당긴 후)
 *  /meet/:id/places     N 장소 리스트
 *  /meet/:id/vote       P 장소 투표
 *  /meet/:id/chat       O 채팅
 *  /meet/:id/share      S 공유하기
 *  /place/:id/challenge L 왕좌 도전하기
 *  /alerts /my /settings  H 알림 · I 마이 · J 설정
 *  /new                 K 만들기(+)
 *  /group/new           Q 새 모임 만들기
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
        <Route path="/meet/:id/tug" element={<Tug />} />
        <Route path="/meet/:id/places" element={<PlaceList />} />
        <Route path="/meet/:id/vote" element={<PlaceVote />} />
        <Route path="/meet/:id/chat" element={<Chat />} />
        <Route path="/meet/:id/share" element={<Share />} />
        <Route path="/place/:id/challenge" element={<Challenge />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/my" element={<My />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/new" element={<CreateSheet />} />
        <Route path="/group/new" element={<NewGroup />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  )
}
