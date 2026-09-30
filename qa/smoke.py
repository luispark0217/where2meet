import asyncio,subprocess,time,os
from playwright.async_api import async_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));OUT=os.path.join(ROOT,'qa','out');os.makedirs(OUT,exist_ok=True)
R=['/','/group/g-uni','/group/g-film','/meet/m-fri','/meet/m-mt','/meet/m-bday','/meet/m-study','/ranking','/ranking/area/hongdae','/ranking/area/d-gangnam','/place/p-wine','/place/p-roast','/place/p-mangwon','/place/p-zzz','/ranking/list','/alerts','/my','/new','/nope']
async def main():
    srv=subprocess.Popen(['python3','-m','http.server','4176','-d',os.path.join(ROOT,'dist')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.8)
    try:
      async with async_playwright() as p:
        b=await p.chromium.launch()
        for vw,vh in [(360,740),(320,568),(430,932)]:
          pg=await b.new_page(viewport={'width':vw,'height':vh});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
          for r in R:
            await pg.goto(f'http://localhost:4176/#{r}');await pg.wait_for_timeout(350)
            info=await pg.evaluate('''()=>{const n=document.querySelector('nav');const r=n?n.getBoundingClientRect():null;
              const lab=n?[...n.querySelectorAll('a')].map(a=>a.getBoundingClientRect()):[];
              return {sw:document.documentElement.scrollWidth,iw:innerWidth,navBottom:r?Math.round(r.bottom):null,
                clipped:lab.some(l=>l.left<0||l.right>innerWidth+0.5||l.bottom>innerHeight+0.5),title:document.title,
                text:document.body.innerText.slice(0,40).replace(/\\n/g,' ')}}''')
            bad=info['sw']>info['iw'] or info['clipped']
            if bad or vw==360: print(vw, r, 'OVERFLOW' if info['sw']>info['iw'] else '', 'TAB-CLIPPED' if info['clipped'] else '', '|', info['title'],'|',info['text'])
            if vw==360: await pg.screenshot(path=os.path.join(OUT,f"s360_{r.strip('/').replace('/','_') or 'home'}.png"))
          if errs: print('ERR',vw,errs)
          await pg.close()
        # deep link back
        pg=await b.new_page(viewport={'width':390,'height':844})
        await pg.goto('http://localhost:4176/#/place/p-roast');await pg.wait_for_timeout(300)
        await pg.click('button[aria-label="뒤로"]');await pg.wait_for_timeout(300);print('deep back ->',pg.url)
        await pg.goto('http://localhost:4176/#/ranking/list');await pg.wait_for_timeout(300)
        y1=await pg.evaluate("document.querySelector('a.sticky').getBoundingClientRect().bottom");print('sticky card bottom',y1,'nav top',await pg.evaluate("document.querySelector('nav').getBoundingClientRect().top"))
        await b.close()
    finally: srv.terminate()
asyncio.run(main())
