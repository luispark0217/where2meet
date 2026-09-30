import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/noto-sans-kr/wght.css'
import './index.css'
import App from './App'

// 피그마와 겹쳐 비교할 때: 주소 뒤에 ?frame=1 → 상태바 44px·홈바 34px 흉내
if (new URLSearchParams(location.search).has('frame')) document.documentElement.classList.add('frame')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
