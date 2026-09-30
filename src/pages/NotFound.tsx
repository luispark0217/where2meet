import { Link } from 'react-router-dom'
import { Screen } from '../components/Screen'

export default function NotFound() {
  return (
    <Screen title="페이지 없음">
      <div className="px-6 pt-[40px]">
        <h1 className="text-[34px] font-black leading-[1.15]">앗, 없는<span className="block text-lime">페이지예요</span></h1>
        <p className="mt-4 text-[14px] leading-[1.6] text-night-muted">링크가 잘못됐거나 사라진 페이지예요.</p>
        <Link to="/" className="mt-8 flex h-[56px] items-center justify-center rounded-full bg-lime text-[16px] font-bold text-ink">홈으로</Link>
      </div>
    </Screen>
  )
}
