/* ============ הפריימים שלך ============ */
const FRAME_COUNT = 241;
const isMobile = matchMedia('(max-width:900px)').matches;

/* בחירת ערכת הפריימים. עד עכשיו הקריטריון היה רוחב המסך בלבד,
   וזה מדד את הדבר הלא נכון: לפטופ על 4G קיבל 18.6MB רק כי המסך
   רחב, בעוד טלפון על WiFi קיבל דווקא את הערכה הקלה. מה שקובע
   כאן הוא רוחב הפס, ולכן הרשת נבדקת ראשונה. */
const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
const slowNet = !!conn.saveData ||
                ['slow-2g','2g','3g'].indexOf(conn.effectiveType) !== -1 ||
                (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 3);
const frameDir = (isMobile || slowNet) ? 'frames-m' : 'frames';
const framePath = i => `/${frameDir}/${String(i).padStart(4,'0')}.webp`;

/* דפים פנימיים לא נושאים את הקנבס. HAS_SEQ הוא המתג היחיד
   שמכבה את מנוע הפריימים — כל השאר במנוע ממשיך לעבוד. */
const canvas = document.getElementById('seq');
const HAS_SEQ = !!canvas;
const ctx = HAS_SEQ ? canvas.getContext('2d') : null;
const images = [];
let loaded = 0, ok = 0, failed = 0;

function fit(){
  if(!HAS_SEQ) return;
  const r = Math.min(devicePixelRatio,2);
  canvas.width = canvas.clientWidth*r;
  canvas.height = canvas.clientHeight*r;
}
const FRAME_SCALE = 0.9;          // 90% — הפריים יושב מעט פנימה

/* מילוי הצדדים: במקום צבע שטוח, מציירים את הפריים עצמו לקנבס
   זעיר (32x18) ומותחים אותו לגודל מלא. האינטרפולציה נותנת מריחה
   רכה שנגזרת מאותו פריים, ולכן הצדדים תמיד מתאימים — כולל מדרג
   אנכי, מה שצבע אחיד לא יכול לתת. עלות: drawImage אחד קטן. */
const _amb  = document.createElement('canvas'); _amb.width=32; _amb.height=18;
const _ambx = _amb.getContext('2d');

/* קנבס עזר לריכוך הקצה הצדדי של הפריים החד.
   בלעדיו הפריים נגמר בקו אנכי חד — בעייתי במיוחד בפריימים
   שבהם יש תוכן ממשי בקצה (מדדתי סטיית תקן 13.4 בפריים האחרון
   מול 3.2 בראשון), כי אז המריחה שמתחת לא יכולה להתאים לו. */
const _sh  = document.createElement('canvas');
const _shx = _sh.getContext('2d');


function draw(i){
  const img = nearestLoaded(i);
  if(!img || !img.complete || !img.naturalWidth) return;
  const cw=canvas.width, ch=canvas.height;
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';

  /* רקע אמביינטי מהפריים עצמו — ממלא את 95px שבכל צד */
  _ambx.drawImage(img, 0,0, 32,18);
  ctx.drawImage(_amb, 0,0, cw,ch);

  const s = Math.max(cw/img.naturalWidth, ch/img.naturalHeight) * FRAME_SCALE;
  const w=img.naturalWidth*s, h=img.naturalHeight*s;

  /* מציירים את הפריים לקנבס עזר ומרככים את הקצוות שבהם יש פער.
     בדסקטופ הפער אופקי, במובייל אנכי — אז בודקים כל ציר בנפרד. */
  if(_sh.width!==cw || _sh.height!==ch){ _sh.width=cw; _sh.height=ch; }
  _shx.globalCompositeOperation='source-over';
  _shx.clearRect(0,0,cw,ch);
  _shx.imageSmoothingEnabled=true; _shx.imageSmoothingQuality='high';
  _shx.drawImage(img,(cw-w)/2,(ch-h)/2, w, h);

  _shx.globalCompositeOperation='destination-in';
  const gapX=(cw-w)/2, gapY=(ch-h)/2;
  if(gapX>1){
    const f=Math.max(30,w*0.055), x0=(cw-w)/2, x1=x0+w;
    const g=_shx.createLinearGradient(0,0,cw,0);
    g.addColorStop(0,'rgba(0,0,0,0)');
    g.addColorStop(Math.max(0,x0/cw),'rgba(0,0,0,0)');
    g.addColorStop(Math.min(1,(x0+f)/cw),'rgba(0,0,0,1)');
    g.addColorStop(Math.max(0,(x1-f)/cw),'rgba(0,0,0,1)');
    g.addColorStop(Math.min(1,x1/cw),'rgba(0,0,0,0)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    _shx.fillStyle=g; _shx.fillRect(0,0,cw,ch);
  }
  if(gapY>1){
    const f=Math.max(30,h*0.055), y0=(ch-h)/2, y1=y0+h;
    const g=_shx.createLinearGradient(0,0,0,ch);
    g.addColorStop(0,'rgba(0,0,0,0)');
    g.addColorStop(Math.max(0,y0/ch),'rgba(0,0,0,0)');
    g.addColorStop(Math.min(1,(y0+f)/ch),'rgba(0,0,0,1)');
    g.addColorStop(Math.max(0,(y1-f)/ch),'rgba(0,0,0,1)');
    g.addColorStop(Math.min(1,y1/ch),'rgba(0,0,0,0)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    _shx.fillStyle=g; _shx.fillRect(0,0,cw,ch);
  }

  ctx.drawImage(_sh,0,0);
}

/* ── סבב הודעות טעינה (כמו ברפרנס: הודעה מתחלפת כל ~1.4s) ── */
(function cycleLoadMsgs(){
  const msgs=[...document.querySelectorAll('#load .load-msg')];
  if(msgs.length<2) return;
  let cur=0;
  setInterval(()=>{
    if(document.getElementById('load').classList.contains('done')) return;
    msgs[cur].classList.remove('active');
    msgs[cur].classList.add('above');
    const next=(cur+1)%msgs.length;
    msgs.forEach((m,i)=>{ if(i!==cur) m.classList.remove('above'); });
    msgs[next].classList.add('active');
    cur=next;
  },1400);
})();

/* ============ טעינה מדורגת ============
   קודם: המתנה לכל 241 הפריימים לפני הצגת הדף. 18.6MB, כלומר
   45 שניות על 4G מהיר ומעל 90 על 4G רגיל — נמדד.

   עכשיו: מחזור ראשון טוען כל פריים שישי (41 פריימים, ~3MB),
   משחרר את הלואדר, וממשיך להשלים את השאר ברקע. איכות הפיקסלים
   לא משתנה כלל — אותם קבצים בדיוק. מה שמשתנה הוא רק כמה מהם
   קיימים בשניות הראשונות, ו-draw מציג את הפריים הטעון הקרוב
   ביותר עד שהאמיתי מגיע. */
const STRIDE = 6;
const firstPass = [];
for(let i=0;i<FRAME_COUNT;i+=STRIDE) firstPass.push(i);
if(firstPass[firstPass.length-1] !== FRAME_COUNT-1) firstPass.push(FRAME_COUNT-1);

function preload(done){
  if(!HAS_SEQ){ done(); return; }        // אין קנבס — אין מה לטעון
  for(let i=0;i<FRAME_COUNT;i++) images.push(null);

  let firstDone = 0, released = false;

  function fetchFrame(i, onSettle){
    const img = new Image();
    img.onload  = () => { ok++;     images[i] = img; onSettle(); };
    img.onerror = () => { failed++; onSettle(); };
    img.src = framePath(i);
  }

  function release(){
    if(released) return;
    released = true;
    done();
    /* המחזור השני מתחיל רק אחרי השחרור, כדי לא להתחרות
       על רוחב הפס עם מה שהדף צריך כדי להיראות. */
    setTimeout(background, 400);
  }

  function tick(){
    firstDone++;
    const p = Math.round(firstDone / firstPass.length * 100);
    const pctEl = document.getElementById('pct'), barEl = document.getElementById('barfill');
    if(pctEl) pctEl.textContent = p;
    if(barEl) barEl.style.width = p + '%';
    if(firstDone === firstPass.length) release();
  }

  firstPass.forEach(i => fetchFrame(i, tick));

  function background(){
    /* בזרם ולא בבת אחת: 240 בקשות במקביל חונקות את החיבור
       ופוגעות דווקא במי שהרשת שלו איטית. */
    const queue = [];
    for(let i=0;i<FRAME_COUNT;i++) if(!images[i]) queue.push(i);
    let active = 0, at = 0;
    const PARALLEL = 6;
    (function pump(){
      while(active < PARALLEL && at < queue.length){
        active++;
        fetchFrame(queue[at++], () => { active--; pump(); });
      }
    })();
  }
}

/* הפריים הטעון הקרוב ביותר — הגשר בין שני המחזורים */
function nearestLoaded(i){
  if(images[i]) return images[i];
  for(let d=1; d<=STRIDE+1; d++){
    if(images[i-d]) return images[i-d];
    if(images[i+d]) return images[i+d];
  }
  return null;
}

/* ============ פיצול טקסט לתווים (אפקט הגלגול) ============
   כל תו הופך ל-span עם data-char (ממנו ה-::after שואב את העותק)
   ו---i לצורך ה-stagger. Array.from מפצל נכון גם תווים מרובי-בייטים. */
function splitWaveText(root=document){
  root.querySelectorAll('.wave-text').forEach(el=>{
    if(el.dataset.split) return;                 // לא לפצל פעמיים
    const text = el.textContent.trim();
    el.textContent = '';
    Array.from(text).forEach((ch,i)=>{
      const span = document.createElement('span');
      span.className = 'char';
      span.style.setProperty('--i', i);
      if(ch === ' '){
        span.innerHTML = '&nbsp;';
        span.setAttribute('data-char','\u00A0');
      }else{
        span.textContent = ch;
        span.setAttribute('data-char', ch);
      }
      el.appendChild(span);
    });
    el.dataset.split = 'true';
  });
}
splitWaveText();

/* ============ אתחול ============ */
let lenis=null;
function start(){
  document.getElementById('load')?.classList.add('done');
  fit(); draw(0);

  gsap.registerPlugin(ScrollTrigger);
  /* עקומת החתימה של הרפרנס כ-ease ל-GSAP: cubic-bezier(.625,.05,0,1)
     => נתיב CustomEase. עכשיו החשיפות ב-JS רצות על אותה עקומה כמו
     ה-CSS transitions משלב 1. עטוף ב-try כדי שכשל טעינה של הפלאגין
     מ-CDN לא יפיל את כל הסקריפט — במקרה כזה 'mdx' מקבל כינוי לעקומה
     מקורית קרובה, וכל השאר ממשיך לעבוד. */
  try{
    gsap.registerPlugin(CustomEase);
    CustomEase.create('mdx', 'M0,0 C.625,.05 0,1 1,1');
  }catch(e){
    gsap.registerEase('mdx', gsap.parseEase('power3.out'));
  }

  /* בנייד סרגל הכתובת משנה את גובה החלון תוך כדי גלילה, מה שמפעיל
     refresh() באמצע ה-pin ומקפיץ את רצף הפריימים. */
  ScrollTrigger.config({ignoreMobileResize:true});

  /* Lenis רק במכשירי מצביע מדויק.
     ב-Lenis 1.0.x האפשרות smoothTouch כבויה כברירת מחדל, ולכן במגע
     הוא לא מיירט את הגלילה ואירוע ה-scroll שלו לא נורה — וזה היה
     העדכון היחיד שהזין את ScrollTrigger. במובייל הגלילה עבדה,
     ScrollTrigger לא התעדכן, וה-pin והפריימים קפאו.
     בלי Lenis הגלילה היא מקורית ו-ScrollTrigger מאזין לה בעצמו. */
  const useLenis = window.Lenis && matchMedia('(pointer:fine)').matches;
  if(useLenis){
    lenis=new Lenis({duration:1.25,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t))});
    window.lenis=lenis;   /* נגיש לסקריפט של הסקשנים התחתונים */
    (function raf(t){lenis.raf(t);requestAnimationFrame(raf)})();
    lenis.on('scroll',()=>ScrollTrigger.update());
  }
  /* ── גלילה לעוגן ──
     המגנוט מושך כל סקשן שנכנס למסך באמצעות lenis.scrollTo(lock:true).
     בדרך ליעד רחוק חוצים סקשנים אחרים, ה-onEnter שלהם יורה, והגלילה
     המקורית מבוטלת באמצע — הכפתור "בואו נדבר" נעצר כ-5,400px לפני
     סקשן צור-הקשר. navScroll מסמן שגלילה יזומה בעיצומה, והמגנוט
     מוותר כל עוד הדגל דלוק. */
  let navScroll = false;
  function goTo(t, opts){
    opts = opts || {};
    navScroll = true;
    const dur  = opts.immediate ? 0 : (opts.duration || 1.25);
    const done = () => { navScroll = false; };
    if(window.lenis){
      window.lenis.scrollTo(t, {duration:dur, lock:true, immediate:!!opts.immediate,
        easing:x=>1-Math.pow(1-x,3), onComplete:done});
    } else {
      t.scrollIntoView({behavior: opts.immediate ? 'auto' : 'smooth'});
    }
    setTimeout(done, dur*1000 + 700);   /* רשת ביטחון אם onComplete לא נורה */
  }

  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
    const href = a.getAttribute('href');
    if(!href || href === '#') return;
    const t = document.querySelector(href);
    if(!t) return;
    e.preventDefault();
    goTo(t);
  }));

  /* מעבר סקשן 1 -> 2 */
  if(document.querySelector('.hero')){
  gsap.to('.hero .content',{y:-90,opacity:0,scale:.96,ease:'none',
    scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
  /* העיגול נע לאט יותר מהגלילה ודוהה — כך הוא לא "נחתך" פתאום מתחת לסקשן הבא */
  gsap.to('.hero .orb-bg',{yPercent:-18,scale:1.12,opacity:0,ease:'none',
    scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
  gsap.to('.blobs',{scale:1.25,opacity:.5,ease:'none',
    scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
  }
  /* ═══════════ מנוע אנימציה אחיד ═══════════
     נשלט דרך data attributes בלבד:
       data-animate="title"    חשיפה ממוסכת, מילה-מילה, מקובצת לפי שורה
       data-animate="fade-up"  הרמה + דהייה
       data-animate="fade"     דהייה בלבד
       data-animate="scale-in" התקרבות מ-0.9 + דהייה (בלוקי מדיה)
       data-animate="clip-in"  פתיחת clip-path מ-8% ל-3% (לא 0% — כיסה את הניווט)
       data-parallax="0.18"    פרלקסה; ערך שלילי = כיוון הפוך
       data-exit               יציאה קשורה לגלילה
     ───────────────────────────────────────── */
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* מפצל טקסט למילים עטופות, ומכבד תגיות פנימיות: אנחנו נכנסים
     לתוך <strong> ו-<span class="dim"> במקום לשטח אותן, כך שהעיצוב
     שלהן שורד את הפיצול. */
  function splitWords(el){
    if(el.dataset.split) return [...el.querySelectorAll('.w-i')];
    const walk = node => {
      [...node.childNodes].forEach(n=>{
        if(n.nodeType === 3){
          const parts = n.textContent.split(/(\s+)/);
          if(!parts.some(t=>t.trim())) return;
          const frag = document.createDocumentFragment();
          parts.forEach(t=>{
            if(!t) return;
            if(!t.trim()){ frag.appendChild(document.createTextNode(t)); return; }
            const outer = document.createElement('span'); outer.className='w';
            const inner = document.createElement('span'); inner.className='w-i';
            inner.textContent = t;
            outer.appendChild(inner); frag.appendChild(outer);
          });
          n.replaceWith(frag);
        } else if(n.nodeType === 1 && n.tagName !== 'BR' && !n.classList.contains('w')){
          walk(n);                       // <strong>, <span class="dim"> וכו'
        }
      });
    };
    walk(el);
    el.dataset.split = '1';
    return [...el.querySelectorAll('.w-i')];
  }

  /* מקבץ מילים לשורות לפי המיקום האנכי בפועל — כך שכל שורה
     עולה כיחידה אחת, וזה מה שנקרא כחשיפת-שורה ולא כריקוד מילים. */
  function lineIndex(words){
    const tops = words.map(w=>Math.round(w.parentElement.getBoundingClientRect().top));
    const uniq = [...new Set(tops)].sort((a,b)=>a-b);
    return tops.map(t=>uniq.indexOf(t));
  }

  /* ── מה שכבר נמצא במסך הראשון נחשף בטעינה ──
     start:'top 62%' אומר שאלמנט שיושב מתחת ל-62% מגובה המסך נשאר
     שקוף עד שגוללים. בדף הבית ההירו ממלא את המסך הראשון ולכן אין
     לזה משמעות; בדף פנימי, שבו הכותרת קצרה, תוכן אמיתי נוחת ברצועה
     שבין 62% לתחתית המסך — נראה ריק, ולכן הדף נראה כאילו נגמר.
     אלמנט כזה מקבל טיימליין כניסה עם stagger במקום טריגר גלילה. */
  let foldSeq = 0;
  const inFold = el => el.getBoundingClientRect().top < innerHeight - 40;

  document.querySelectorAll('[data-animate]').forEach(el=>{
    const kind = el.dataset.animate;
    const sec  = el.closest('section') || el;
    const fold = inFold(el);
    const lead = fold ? 0.15 + (foldSeq++) * 0.09 : 0;
    /* הסף היה 'top 62%': אלמנט נחשף רק כשראשו חוצה 62% מגובה
       המסך, ולכן 38% התחתונים נשארו ריקים וחייבו גלילה נוספת
       בתוך אותו סקשן. 'top bottom-=80' חושף ברגע שהאלמנט נכנס
       לתחום הראייה, כך שסקשן שנמצא במלואו על המסך מוצג במלואו. */
    const st   = fold ? null
                      : {trigger:el, start:'top bottom-=8', toggleActions:'play none none reverse'};
    /* #about ו-work מקבלים חשיפה מתואמת עם stagger (בהמשך) — לא פר-אלמנט */
    if(el.closest('.sphere-grid') || el.closest('.work-grid')) return;

    if(reduce){ gsap.set(el,{opacity:1,y:0}); return; }

    if(kind === 'title'){
      const words = splitWords(el);
      if(!words.length) return;
      const li = lineIndex(words);
      gsap.set(el,{opacity:1});
      gsap.fromTo(words,{yPercent:100,opacity:0},{
        yPercent:0, opacity:1,
        duration:1.3, ease:'mdx', delay:lead,
        immediateRender:true,
        stagger:(i)=>li[i]*0.07 + i*0.01,
        scrollTrigger:st
      });
    } else if(kind === 'clip-in'){
      /* scrub ולא once: הצורה קשורה למיקום הגלילה ולכן היא נפתחת
         ונסגרת עם התנועה, במקום להינעל על 0% אחרי הפעלה אחת. */
      /* שני טריגרים בטווחים שאינם חופפים. הם אינם נלחמים כי
         מצב הסיום של הכניסה זהה למצב הפתיחה של היציאה (OPEN),
         ולכן בין השניים הצורה יציבה.
         הטיימליין היחיד הקודם פרס כניסה-החזקה-יציאה על טווח אחד,
         וההתכווצות התחילה כבר כשהבלוק מילא את המסך. */
      /* היברידי בהשראת mdx (מאומת מה-DOM inspector):
         (א) חשיפה מטריגר — clip-path נפתח מהחריץ המרכזי של הרפרנס
             inset(20% 40% 0% 40%) עד הכרטיס המלא (inset 3%), 1.5s
             power3.out, פעם אחת.
         (ב) יציאה scrubbed בזמן pin — כל הכרטיס (.reel-wrap) מתכווץ
             scale 1→0.82, ונסוג לתוך רקע הדף הבהיר מסביב. אין מסגרת
             שחורה: מה שמסביב לכרטיס הוא הדף, לא רקע הקופסה. הווידאו
             ממלא את הכרטיס תמיד (scale על כל הכרטיס, לא על תוכן פנימי).
             pinSpacing:true => שומר מקום בזרימה, אין קריסה. */
      const START='inset(28% 44% round 3rem)', FULL='inset(16.25% 3.3% round 2.2rem)';
      /* opacity מפורש בשני הקצוות. clip-in הוא הסוג היחיד שלא נגע
         בשקיפות — הוא פותח צורה בלבד. מרגע שה-CSS מסתיר כל
         [data-animate] לפני הצביעה הראשונה, זה השאיר את הסקשן
         שקוף לצמיתות: הצורה נפתחה על אלמנט בלתי נראה. */
      gsap.fromTo(el,{clipPath:START, opacity:0},{clipPath:FULL, opacity:1,
        duration:1.5, ease:'power3.out', immediateRender:true,
        scrollTrigger:{trigger:el, start:'top bottom-=8', once:true}});
      /* יציאה — Option B (sticky): ה-.reel-wrap דביק (CSS) ומוחזק בראש
         המסך בזמן שהסקשן נגלל תחתיו. כאן רק מקטינים אותו scale 1→0.82
         לאורך גלילת הסקשן — כך הוא "מוחזק ואז נסוג" לתוך רקע הדף הבהיר.
         GSAP רק מנפיש property (scale), ללא pin => אין חישוב cross-pin,
         אין קפיצה. הכרטיס מלא (scale 1) בתחילת הצפייה. */
      gsap.fromTo(el,{scale:1},{scale:.82, ease:'none',
        scrollTrigger:{trigger:sec, start:'top top', end:'bottom bottom',
          scrub:true, id:'reel-exit'}});
    } else if(kind === 'scale-in'){
      gsap.fromTo(el,{scale:.9, opacity:0, y:40},
        {scale:1, opacity:1, y:0, duration:1.5, ease:'mdx',
         delay:(parseFloat(el.dataset.delay)||0) + lead,
         immediateRender:true, scrollTrigger:{trigger:el, start:'top bottom-=8', toggleActions:'play none none reverse'}});
    } else {
      /* תבנית החשיפה של הרפרנס: fade + translateY 80px, ~0.85s,
         עקומת החתימה, עם תמיכה ב-data-delay (מקביל ל-data-fade-delay).
         היה: y:44, 1.25s, power4.out — איטי כפול ובעקומה אחרת. */
      const from = kind === 'fade' ? {opacity:0} : {y:80, opacity:0};
      gsap.fromTo(el, from, {y:0, opacity:1,
        duration:1.5, ease:'mdx', delay:(parseFloat(el.dataset.delay)||0) + lead,
        immediateRender:true, scrollTrigger:st});
    }
  });

  /* ── פרלקסה: כל שכבה בקצב משלה, וזה מה שיוצר עומק ──
     נכתב ל-yPercent (כלומר transform) ולכן לא מתנגש במירכוז
     הפלקסבוקס ולא ב-top של הכיפה — אלה מאפייני פריסה נפרדים. */
  if(!reduce) document.querySelectorAll('[data-parallax]').forEach(el=>{
    const f = parseFloat(el.dataset.parallax) || 0;
    gsap.fromTo(el,{yPercent:-f*100},{yPercent:f*100, ease:'none',
      scrollTrigger:{trigger:el.closest('section')||el,
        start:'top bottom', end:'bottom top', scrub:1}});
  });

  /* ── זום-הווידאו הנפרד הוסר: ה-scale של היציאה (על .reel-wrap) כבר
     מכווץ את הווידאו איתו, וה-pin משנה את מיקומי ה-scrub — שילוב
     של שני scale-ים על אותו אזור נראה מוזר. ── */

  /* ── יציאה קשורה לגלילה ── */
  if(!reduce) document.querySelectorAll('[data-exit]').forEach(el=>{
    gsap.to(el,{y:-70, opacity:0, ease:'none',
      scrollTrigger:{trigger:el.closest('section')||el,
        start:'bottom 65%', end:'bottom top', scrub:true}});
  });

  /* ── חשיפות מתואמות (בסגנון הרפרנס): האלמנטים בסקשן זורמים פנימה
     יחד עם stagger, כאנימציה אחת אלגנטית — במקום כל אלמנט בנפרד. ── */
  if(!reduce){
    const sphereGrid = document.querySelector('.sphere-grid');
    if(sphereGrid){
      const els = sphereGrid.querySelectorAll('[data-animate]');
      /* fromTo ולא from: from מנפיש אל הערך *הטבעי* של האלמנט,
         ומאז שה-CSS מסתיר [data-animate] לפני הצביעה הראשונה
         הערך הטבעי הוא 0 — כלומר האנימציה הייתה רצה מ-0 ל-0
         והטקסט לא היה חוזר לעולם. מצב הסיום חייב להיות מפורש. */
      gsap.fromTo(els,{y:60, autoAlpha:0},{y:0, autoAlpha:1,
        duration:1.2, ease:'power3.out', stagger:.12, immediateRender:true,
        scrollTrigger:{trigger:sphereGrid, start:'top bottom-=8', toggleActions:'play none none reverse'}});
    }
    const workGrid = document.querySelector('.work-grid');
    if(workGrid){
      const cards = workGrid.querySelectorAll('.card');
      gsap.fromTo(cards,{y:72, autoAlpha:0},{y:0, autoAlpha:1,
        duration:1.15, ease:'power3.out', stagger:.13, immediateRender:true,
        scrollTrigger:{trigger:workGrid, start:'top bottom-=8', toggleActions:'play none none reverse'}});
    }

    /* hover scale מנוהל ב-GSAP: על כפתורים שמקבלים reveal (transform של
       GSAP, למשל ה-CTA בסקשן 2) תכונת ה-CSS scale לא מתחברת אמין עם
       ה-transform — GSAP חייב לנהל את שניהם. חל על כל ה-.cta באחידות.
       מוגבל ל-pointer:fine כדי שבמגע tap לא ישאיר כפתור מכווץ. */
    if(window.matchMedia('(pointer:fine)').matches){
      gsap.utils.toArray('.cta').forEach(btn=>{
        const set = (s,d)=>gsap.to(btn,{scale:s, duration:d, ease:'power2.out', overwrite:'auto'});
        btn.addEventListener('mouseenter',()=>set(.96,.4));
        btn.addEventListener('mouseleave',()=>set(1,.45));
        btn.addEventListener('mousedown', ()=>set(.935,.12));
        btn.addEventListener('mouseup',   ()=>set(.96,.12));
      });
    }
  }

  /* ── פרלקס טקסט הפוטר (בסגנון mdx): DIGITAL/FRAME נעים כלפי מעלה
     נגד הגלילה — עומק וכובד. ה-overflow טופל (foot: clip אופקי,
     foot-mark: visible אנכי) כך שהמילים לא נחתכות. ── */
  if(!reduce){
    const marks = document.querySelectorAll('.foot-mark__inner');
    if(marks.length) gsap.fromTo(marks,{yPercent:18},{yPercent:-14, ease:'none',
      scrollTrigger:{trigger:'.foot-mark', start:'top bottom', end:'bottom bottom', scrub:1}});
  }

  /* ── משיכה מגנטית על כפתור הניגון ──
     רק במכשירי מצביע: במגע אין ריחוף, וזה היה נתקע במצב "נמשך".
     quickTo מכין את הטווין מראש ולכן לא מקצה אובייקט בכל mousemove. */
  const reel = document.querySelector('.reel-play');
  if(reel && !reduce && matchMedia('(hover:hover) and (pointer:fine)').matches){
    const xTo = gsap.quickTo(reel,'x',{duration:.55,ease:'power3'});
    const yTo = gsap.quickTo(reel,'y',{duration:.55,ease:'power3'});
    const zone = reel.closest('.reel-wrap');
    const PULL = .22, RADIUS = 240;

    zone.addEventListener('mousemove', e=>{
      const r = reel.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width/2);
      const dy = e.clientY - (r.top  + r.height/2);
      const d  = Math.hypot(dx,dy);
      const k  = d > RADIUS ? 0 : (1 - d/RADIUS) * PULL;
      xTo(dx*k); yTo(dy*k);
    });
    zone.addEventListener('mouseleave', ()=>{ xTo(0); yTo(0); });
  }

  /* רשת ביטחון: תוכן לא נשאר בלתי-נראה בשקט אם טריגר כלשהו נכשל. */
  setTimeout(()=>{
    document.querySelectorAll('[data-animate]').forEach(el=>{
      if(getComputedStyle(el).opacity === '0'){ el.style.opacity=''; el.style.transform=''; }
      el.querySelectorAll('.w-i').forEach(w=>{
        if(getComputedStyle(w).opacity === '0'){ w.style.opacity=''; w.style.transform=''; }
      });
    });
  }, 5000);

  /* אם הפריימים לא נטענו (למשל תיקיית frames חסרה) — עוברים לגיבוי מצויר */
  const framesReady = !HAS_SEQ || ok > 0;
  if(!framesReady){
    console.warn('frames not loaded ('+failed+' failed) — using fallback sphere');
    showFallbackNote();
  }

  /* ★ הגלילה מריצה את הפריימים ★
     end ארוך יותר = יותר גלילה לכל פריים = תנועה רגועה וחלקה.
     scrub:1 מוסיף השהיה קלה שמחליקה את המעברים בין פריימים. */
  const seq={f:0};
  let lastDrawn=-1;
  const pinLen = isMobile ? '+=240%' : '+=340%';
  const seqTween = (HAS_SEQ && document.querySelector('.sphere-sec')) ? gsap.to(seq,{f:FRAME_COUNT-1,ease:'none',
    scrollTrigger:{trigger:'.sphere-sec',start:'top top',end:pinLen,
      pin:true,scrub:1,anticipatePin:1,refreshPriority:10,
      onUpdate:()=>{
        const idx=Math.round(seq.f);
        if(idx===lastDrawn) return;            // מצייר רק כשהפריים באמת השתנה
        lastDrawn=idx;
        framesReady ? draw(idx) : drawFallback(seq.f/(FRAME_COUNT-1));
      }}}) : null;
  if(!framesReady) drawFallback(0);

  /* ═══════════ CRAFT — טיימליין מוצמד עצמאי ═══════════
     מצב 1: הווידאו מנגן, הטקסט העליון גלוי, הגלולות אסופות
             סביבו, הקופי המרכזי שקוף.
     מצב 2: הטקסט העליון דוהה, הגלולות נפתחות לפינות,
             הקופי המרכזי נכנס.

     הסקשן הזה מוצמד בעצמו. הוא נפרד לחלוטין מ-seqTween:
     טריגר משלו, טווח משלו, ואפס נגיעה במנוע הפריימים. */
  let craftST = null;
  const craft = document.querySelector('.craft');

  if(craft){
    gsap.matchMedia().add('(min-width: 769px)', () => {

      /* מיקומי הפיזור מדויקים מהרפרנס: translate3d ב-rem, בסיס
         10px. אצלם LTR (X חיובי=ימין); אצלנו הסקשן RTL אך
         הגלולות ממוקמות ב-transform מוחלט, כך שהערכים תקפים
         כמות שהם. ממירים ל-px לפי חלון בזמן ריצה, יחסית לרפרנס
         שנמדד ב-1920 רוחב. */
      const REF_W = 1920, REF_H = 1080;
      const sx = () => innerWidth  / REF_W;
      const sy = () => innerHeight / REF_H;
      /* מיקומי הפתיחה = פינות הרפרנס שנמדדו מהצילום (±650 אופקי /
         ±280 אנכי ביחס למרכז, ברוחב 1920). סימטריים, רחוקים,
         מפנים את המרכז לסרטון — כמו mdx.so. */
      const spread = [
        ['.craft-pill--ux',  () => -655*sx(), () => -285*sy()],
        ['.craft-pill--dev', () =>  645*sx(), () => -270*sy()],
        ['.craft-pill--brd', () => -630*sx(), () =>  280*sy()],
        ['.craft-pill--aut', () =>  655*sx(), () =>  290*sy()]
      ];

      /* מצב התחלה: כל הגלולות מקובצות במרכז (x:0,y:0), קטנות ומוסתרות.
         בגלילה הן מתפוצצות החוצה לפינות ונחשפות — כמו הרפרנס.
         xPercent/yPercent:-50 ממרכזים כל גלולה על נקודת ה-50%/50%. */
      /* מצב סגור: ארבע הגלולות מקובצות סביב מרכז המכשיר, קטנות
         אך *גלויות*. קודם הן היו autoAlpha:0 — כלומר עד שלא גללת
         בתוך הסקשן לא היה שום רמז שיש כאן משהו שנפתח, והמחווה
         איבדה את ההתחלה שלה. ההיסטים הקטנים מונעים מהן להיערם
         אחת על השנייה לכתם אחד. */
      const cluster = [
        ['.craft-pill--ux',  -96, -62],
        ['.craft-pill--dev',  94, -54],
        ['.craft-pill--brd', -86,  58],
        ['.craft-pill--aut',  92,  66]
      ];
      gsap.set('.craft-copy', {autoAlpha:0});
      cluster.forEach(([sel,cx,cy]) =>
        gsap.set(sel, {xPercent:-50, yPercent:-50,
          x:()=>cx*sx(), y:()=>cy*sy(), scale:.58, autoAlpha:1}));

      const tl = gsap.timeline({
        scrollTrigger:{
          trigger:'.craft', start:'top top',
          /* גלילה אחת. 35% מגובה החלון ≈ החלקה אחת — הפיזור,
             יציאת הכותרת וכניסת הקופי מסתיימים במחווה אחת. */
          end:'+=35%',
          pin:true, scrub:.45, anticipatePin:1, refreshPriority:5, id:'craft-states'
        }
      });
      craftST = tl.scrollTrigger;

      /* ריחוף עדין על הגלולה עצמה (.craft-pill הפנימי). הפיזור יושב
         על שכבת-המיקום החיצונית, הריחוף על הגלולה — שני אלמנטים
         נפרדים, אז הם מרכיבים זה על זה בלי להתנגש. הטקסט ממורכז
         בתוך הגלולה ונע איתה כיחידה אחת. */
      const floatCfg = [[10,-8,3.1],[-9,7,3.6],[8,9,3.3],[-10,-7,3.9]];
      spread.forEach(([sel],i) => {
        const inner = document.querySelector(sel+' .craft-pill');
        if(!inner) return;
        const [ax,ay,dur]=floatCfg[i];
        gsap.to(inner, {x:ax, y:ay, duration:dur,
          ease:'sine.inOut', repeat:-1, yoyo:true, delay:i*.3});
      });

      /* הכותרת העליונה יוצאת, הגלולות מתפזרות לפינות,
         הקופי המרכזי נכנס — הכל על אותו פס גלילה קצר. */
      tl.to('.craft-flex', {autoAlpha:0, y:-30, ease:'power1.in'}, 0);
      spread.forEach(([sel,fx,fy]) => {
        tl.to(sel, {x:fx, y:fy, scale:1, autoAlpha:1, ease:'power2.out'}, 0);
      });
      tl
        .to('.craft-copy', {autoAlpha:1, ease:'power1.out'}, .25)
        .fromTo('.craft-copy > div', {scale:.96}, {scale:1, ease:'power1.out'}, .25);

      return () => {
        craftST = null;
        gsap.set(['.craft-copy','.craft-flex'], {clearProps:'all'});
        gsap.killTweensOf(spread.map(r=>r[0]));
        spread.forEach(([sel])=>{const f=document.querySelector(sel+' .craft-pill'); if(f) gsap.killTweensOf(f);});
        gsap.set(spread.map(r=>r[0]), {clearProps:'all'});
      };
    });
  }




  /* ניווט דביק */
  addEventListener('scroll',()=>document.getElementById('nav')?.classList.toggle('stuck',scrollY>60));

  /* ===== החלפת ערכת הניווט מעל סקשן כהה =====
     כשקו הניווט העליון חוצה את סקשן הפרויקטים השחור,
     כל אלמנטי הניווט הופכים בהירים (כמו ברפרנס). */
  (function(){
    const navEl=document.getElementById('nav');
    /* כל הסקשנים הכהים, לא רק הפרויקטים — הפוטר שחור באותה מידה */
    const darks=[...document.querySelectorAll('.work,.foot')];
    if(!navEl||!darks.length) return;
    const probe=()=>{
      const navMid=navEl.getBoundingClientRect().bottom*0.5;
      navEl.classList.toggle('on-dark', darks.some(d=>{
        const r=d.getBoundingClientRect();
        return r.top<=navMid && r.bottom>=navMid;
      }));
    };
    addEventListener('scroll',probe,{passive:true});
    addEventListener('resize',probe);
    probe();
  })();

  /* ===== מחוון הסקשנים בתחתית =====
     המצב הפעיל נקבע ע"י data-active-bar על ההורה, וה-CSS מגיב לו.
     הפס הפעיל = הסקשן שנמצא כרגע במסך. */
  const indicator=document.getElementById('secNav');
  const bars=indicator ? [...indicator.querySelectorAll('.bar')] : [];
  bars.forEach(b=>{
    b.style.pointerEvents='auto';
    b.addEventListener('click',()=>{
      const t=document.querySelector(b.dataset.go);
      if(t) lenis?lenis.scrollTo(t):t.scrollIntoView({behavior:'smooth'});
    });
  });
  /* offsetTop לא אמין כאן: סקשן 2 מוצמד (pin) ו-ScrollTrigger עוטף אותו
     ב-pin-spacer ומזיז אותו בטרנספורם, ו-Lenis גורם ל-scrollY לפגר.
     getBoundingClientRect משקף את המיקום המצויר בפועל — לכן הוא הנכון. */
  function updateSecNav(){
    const mid = innerHeight / 2;
    let cur = 1;                                // 1-based, תואם ל-data-active-bar
    bars.forEach((b,i)=>{
      const el = document.querySelector(b.dataset.go);
      if(!el) return;                           // מדלג על סקשן שעדיין לא קיים
      const r = el.getBoundingClientRect();
      if(r.top <= mid && r.bottom >= mid) cur = i + 1;   // הסקשן שחוצה את אמצע המסך
    });
    if(indicator) indicator.setAttribute('data-active-bar', cur);
  }
  /* מתעדכן בכל פריים של ScrollTrigger — מסונכרן עם ה-pin ועם Lenis */
  if(indicator){
    ScrollTrigger.addEventListener('refresh', updateSecNav);
    gsap.ticker.add(updateSecNav);
    updateSecNav();
  }

  /* קו-התקדמות הגלילה — אותה תבנית ticker כמו המחוון. משתמש בערך
     המוחלק של Lenis כשקיים (scrollY מפגר תחת Lenis), אחרת ב-scrollY
     המקורי, חלקי maxScroll שמביא בחשבון את ה-pin-spacers. */
  const progFill=document.querySelector('.scroll-prog__fill');
  if(progFill){
    gsap.set(progFill,{scaleY:0,transformOrigin:'top center'});
    const updateProg=()=>{
      const max=ScrollTrigger.maxScroll(window)||1;
      const cur=window.lenis?window.lenis.scroll:window.scrollY;
      gsap.set(progFill,{scaleY:Math.min(1,Math.max(0,cur/max))});
    };
    gsap.ticker.add(updateProg);
    updateProg();
  }

  /* ═══════════ תזמור גלילה ═══════════
     נבנה כאן, בסוף, ולא באמצע: ScrollTrigger.getAll() חייב לראות
     את כל הטריגרים — ובראשם רצף הפריימים — לפני מדידת העגינה.
     ───────────────────────────────────────── */

  const touch = matchMedia('(pointer:coarse)').matches;

  /* עגינה ומגנוט נבנו סביב סקשנים בגובה מסך מלא בדף הבית.
     בדף פנימי הסקשן הראשון מתחיל בראש הדף, ולכן ה-onEnter שלו
     נורה בגלילה הראשונה ומושך את הגולש חזרה למעלה — הדף ננעל.
     שני המנגנונים רצים רק כשההירו קיים. */
  const IS_HOME = !!document.querySelector('.hero');

  /* הטריגר של הפריימים נשמר במפורש. הגרסה הקודמת זיהתה אותו
     דרך t.scrub, שלא קיים על מופע ScrollTrigger (הוא ב-t.vars),
     ולכן רשימת האזורים המוגנים הייתה ריקה תמיד והעגינה נלחמה
     בסקראב לאורך כל הרצף. */
  const seqST = seqTween ? (seqTween.scrollTrigger || null) : null;

  let snapAt = [];
  const SNAP_TOL = .075;

  function buildSnap(){
    const max = ScrollTrigger.maxScroll(window);
    if(!max) return;
    const y = window.scrollY || window.pageYOffset || 0;
    snapAt = [...document.querySelectorAll('[data-snap]')]
      .map(sec => gsap.utils.clamp(0, max, sec.getBoundingClientRect().top + y) / max)
      .sort((a,b)=>a-b);
  }

  /* אזור מוגן: כל טווח ה-pin של הפריימים, בתוספת שוליים.
     בתוכו הגלילה חופשית לחלוטין ואיש לא נוגע בה. */
  function protectedZone(v){
    const max = ScrollTrigger.maxScroll(window);
    if(!max) return false;
    /* שני טווחי pin נפרדים: הפריימים והסקשן החדש.
       בתוך כל אחד מהם הגלילה חופשית ואיש לא נוגע בה. */
    return [seqST, craftST].some(st =>
      st && v > st.start/max - .03 && v < st.end/max + .03);
  }

  if(IS_HOME && !touch && !reduce && window.lenis){
    /* מגנוט בסגנון הרפרנס: בכניסה לסקשן (top 58%) מבצעים
       lenis.scrollTo אליו עם lock:true — מושך אותו בחוזקה למסך מלא,
       והאנימציות מתנגנות תוך כדי המשיכה. מדלגים על about הנעוץ.
       דגל pulling + טיימר בטיחות מונעים חטיפה כפולה/תקיעה. משך קצר. */
    let pulling = false;
    ['#services','#showreel','#work','#contact'].forEach(sel=>{
      const sec = document.querySelector(sel);
      if(!sec) return;
      ScrollTrigger.create({
        trigger: sec, start:'top 58%', end:'top 8%',
        onEnter:()=>{
          if(pulling || navScroll) return;
          pulling = true;
          window.lenis.scrollTo(sec, {duration:.8, lock:true,
            easing:t=>1-Math.pow(1-t,3),
            onComplete:()=>{ pulling = false; }});
          setTimeout(()=>{ pulling = false; }, 1200);
        }
      });
    });
  }

  if(IS_HOME){
    ScrollTrigger.addEventListener('refresh', buildSnap);
    buildSnap();
  }
  ScrollTrigger.refresh();

  /* ── נחיתה מדף פנימי (/#contact) ──
     הדפדפן קופץ לעוגן בזמן הטעינה, לפני שה-pins נבנו ולפני
     ש-ScrollTrigger חישב מחדש את הגבהים — ולכן הוא נוחת במקום
     הלא נכון. אחרי ה-refresh קופצים שוב, הפעם למיקום האמיתי. */
  if(location.hash && location.hash.length > 1){
    const t = document.querySelector(location.hash);
    if(t) requestAnimationFrame(()=>goTo(t, {immediate:true}));
  }

  /* עכבר (דסקטופ בלבד): פרלקסה עדינה על הכתמים, הפריים והעיגולים */
  if(matchMedia('(hover:hover)').matches){
    const depth=[26,-18,22,-14];
    if(canvas) gsap.set(canvas,{scale:1.06});
    const orbs=[...document.querySelectorAll('.orb-bg')];
    addEventListener('mousemove',e=>{
      const x=e.clientX/innerWidth-.5, y=e.clientY/innerHeight-.5;
      document.querySelectorAll('.blob').forEach((b,i)=>b.style.translate=`${x*depth[i]}px ${y*depth[i]}px`);
      gsap.to(canvas,{x:x*18,y:y*12,duration:1.4,ease:'power2.out'});
      /* עיגול ההירו: רק תנועה אנכית — כדי שהמירכוז האופקי יישאר מוחלט */
      orbs.forEach(o=>gsap.to(o,{y:y*18,duration:1.6,ease:'power2.out'}));
    });
  }
  /* נשימה עדינה לרקע של סקשן 3 */
  /* ── עומק בסקשן IDEAS ──────────────────────────────────
     שתי שכבות הרקע נעות בקצב שונה מהגלילה. ההפרש ביניהן
     הוא מה שיוצר את תחושת העומק; בלעדיו will-change מיותר.
     שתיהן על yPercent/scale בלבד — נשארות ב-compositor. */
  const ideas = document.querySelector('.ideas');
  if(ideas){
    /* הקשת (dome) והזוהר (glow) עולים מלמטה כשמגיעים לסקשן — בלי
       הסתרת opacity (כדי לא להתנגש עם הנשימה ולא להיתקע מוסתרים). */
    gsap.from('.ideas-layer--dome',{yPercent:55, duration:2.1, ease:'mdx',
      scrollTrigger:{trigger:ideas, start:'top bottom-=8', toggleActions:'play none none reverse'}});
    gsap.from('.ideas-layer--glow',{yPercent:70, scale:.88, duration:2.1, ease:'mdx', delay:.16,
      scrollTrigger:{trigger:ideas, start:'top bottom-=8', toggleActions:'play none none reverse'}});
    /* נשימה איטית על הזוהר, נפרדת מהגלילה */
    gsap.to('.ideas-layer--glow',{opacity:.82,duration:8,yoyo:true,repeat:-1,ease:'sine.inOut',delay:2});
  }

  addEventListener('resize',()=>{
    if(HAS_SEQ){ fit(); draw(Math.round(seq.f||0)); }
    ScrollTrigger.refresh();
  });
}

/* ============ גיבוי: ספירה מצוירת על קנבס (כשאין פריימים) ============ */
function drawFallback(prog){                 // prog: 0..1 = מיקום הגלילה
  if(!ctx) return;
  const cw=canvas.width, ch=canvas.height, r=Math.min(devicePixelRatio,2);
  ctx.clearRect(0,0,cw,ch);
  const cx=cw/2, cy=ch/2 - ch*0.02, R=Math.min(cw,ch)*0.26;
  const rot=prog*Math.PI*2;
  // הילה כתומה
  let halo=ctx.createRadialGradient(cx,cy,0,cx,cy,R*1.7);
  halo.addColorStop(0,'rgba(245,135,47,.35)');
  halo.addColorStop(.5,'rgba(255,184,120,.12)');
  halo.addColorStop(1,'rgba(255,184,120,0)');
  ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(cx,cy,R*1.7,0,7); ctx.fill();
  // גוף הכדור
  let body=ctx.createRadialGradient(cx-R*.3,cy-R*.3,R*.1,cx,cy,R);
  body.addColorStop(0,'rgba(255,252,248,.98)');
  body.addColorStop(.55,'rgba(255,236,214,.9)');
  body.addColorStop(1,'rgba(245,180,120,.35)');
  ctx.fillStyle=body; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.fill();
  // חלקיקים מסתובבים על פני הכדור
  for(let i=0;i<220;i++){
    const y=1-(i/219)*2, rr=Math.sqrt(1-y*y), th=i*2.399+rot;
    const px=Math.cos(th)*rr, pz=Math.sin(th)*rr;
    if(pz<-.1) continue;                     // רק החצי הקדמי
    const sx=cx+px*R*1.02, sy=cy+y*R*1.02;
    const a=.3+pz*.6, s=(.6+pz)* r*1.3;
    ctx.fillStyle=`rgba(255,255,255,${a})`;
    ctx.beginPath(); ctx.arc(sx,sy,s,0,7); ctx.fill();
  }
  // ליבה חמה
  let core=ctx.createRadialGradient(cx,cy,0,cx,cy,R*.5);
  core.addColorStop(0,'rgba(245,135,47,.5)');
  core.addColorStop(1,'rgba(245,135,47,0)');
  ctx.fillStyle=core; ctx.beginPath(); ctx.arc(cx,cy,R*.5,0,7); ctx.fill();
}
function showFallbackNote(){
  const n=document.createElement('div');
  n.style.cssText='position:fixed;bottom:16px;left:50%;translate:-50% 0;z-index:60;'+
    'background:rgba(20,27,36,.85);color:#fff;padding:10px 18px;border-radius:100px;'+
    'font-size:12px;letter-spacing:.02em;font-family:Heebo,sans-serif;direction:rtl';
  n.textContent='מציג ספירת גיבוי — תיקיית frames/ לא נטענה. פתח את הקובץ יחד עם התיקייה כדי לראות את הסרטון.';
  document.body.appendChild(n);
  setTimeout(()=>{n.style.transition='opacity .6s';n.style.opacity='0';setTimeout(()=>n.remove(),700)},6000);
}

preload(start);
