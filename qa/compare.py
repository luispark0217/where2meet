"""피그마 화면과 실제 화면을 390x844로 찍어 겹쳐 비교. 결과: qa/out/<화면>_compare.png, 점수표"""
import asyncio, subprocess, time, sys, os
from PIL import Image, ImageChops, ImageDraw, ImageFilter
from playwright.async_api import async_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'qa','out');os.makedirs(OUT,exist_ok=True)
ROUTES={'A':'/','B':'/group/g-uni','C':'/meet/m-fri','D':'/ranking','E':'/ranking/area/hongdae','F':'/place/p-wine','G':'/ranking/list'}
only=sys.argv[1:] or list(ROUTES)
def mask(w=390,h=844):
    m=Image.new('L',(w,h),0);d=ImageDraw.Draw(m)
    d.rounded_rectangle((8,8,w-9,h-9),radius=38,fill=255)   # 폰 테두리 제외
    d.rectangle((0,0,w,44),fill=0)                          # 상태바 제외
    return m
async def main():
    srv=subprocess.Popen(['python3','-m','http.server','4173','-d',os.path.join(ROOT,'dist')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.8)
    try:
        async with async_playwright() as p:
            b=await p.chromium.launch();pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
            errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
            M=mask();rows=[]
            for k in only:
                await pg.goto(f'http://localhost:4173/?frame=1#{ROUTES[k]}');await pg.wait_for_timeout(900)
                await pg.evaluate('document.fonts.ready')
                shot=os.path.join(OUT,f'{k}_web.png');await pg.screenshot(path=shot)
                ref=Image.open(os.path.join(ROOT,'design-ref',f'{k}.png')).convert('RGB');web=Image.open(shot).convert('RGB')
                diff=ImageChops.difference(ref,web).convert('L')
                diff=Image.composite(diff,Image.new('L',diff.size,0),M)
                bad=diff.point(lambda v:255 if v>40 else 0)
                pct=sum(1 for v in bad.getdata() if v)/sum(1 for v in M.getdata() if v)*100
                heat=Image.blend(ref,Image.new('RGB',ref.size,(255,0,90)),0)
                heat=Image.composite(Image.new('RGB',ref.size,(255,0,90)),ref.point(lambda v:v*0.35),bad)
                ov=Image.blend(ref,web,0.5)
                sheet=Image.new('RGB',(390*4+30,844),(40,40,40))
                for i,im in enumerate([ref,web,ov,heat]):sheet.paste(im,(i*400,0))
                sheet.save(os.path.join(OUT,f'{k}_compare.png'));rows.append((k,pct))
            await b.close()
            for k,pct in rows:print(f'{k}: 다른 픽셀 {pct:.1f}%')
            if errs:print('PAGE ERRORS',errs)
    finally: srv.terminate()
asyncio.run(main())
