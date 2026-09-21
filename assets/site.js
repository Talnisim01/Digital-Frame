/* ═══════════ סקשנים 5–7 — לוגיקה ═══════════
   בלוק נפרד ועצמאי בכוונה: הוא לא נוגע ב-GSAP, ב-Lenis
   ולא ב-preload/start. אם רצף הפריימים ייפול, הפילטרים,
   הצ'יפים והטופס ימשיכו לעבוד. */
(function(){
  'use strict';

  /* ── שנה בפוטר ── */
  var yr = document.getElementById('yr');
  if(yr) yr.textContent = new Date().getFullYear();


  /* ── המחוון: פס פעיל + היעלמות אחרי craft ──
     data-active-bar היה מקובע ל-"1" ומעולם לא התעדכן.
     מאזין גלילה פשוט ולא ScrollTrigger — שום דבר חדש
     לא נכנס למנוע הגלילה. */
  (function(){
    var ind = document.getElementById('secNav');
    if(!ind) return;
    var bars  = [].slice.call(ind.querySelectorAll('.bar'));
    var last  = document.querySelector('#work');   /* הפרויקטים */
    var ticking = false;

    function sync(){
      ticking = false;
      var mid = innerHeight * 0.5, active = 1;
      bars.forEach(function(b,i){
        var t = document.querySelector(b.dataset.go);
        if(t && t.getBoundingClientRect().top <= mid) active = i + 1;
      });
      ind.setAttribute('data-active-bar', String(active));
      /* נעלם ברגע שהתחתית של craft עברה את ראש המסך */
      /* נעלמים ברגע שסקשן הפרויקטים מכסה יותר מחצי מסך */
      ind.classList.toggle('is-gone',
        !!last && last.getBoundingClientRect().top <= innerHeight * .55);
    }
    addEventListener('scroll', function(){
      if(!ticking){ ticking = true; requestAnimationFrame(sync); }
    }, {passive:true});
    addEventListener('resize', sync, {passive:true});
    sync();
  })();

  /* ── חזרה למעלה ──
     דרך lenis כשהוא פעיל, כדי שהתנועה תהיה זהה לשאר הניווט
     ולא תילחם במנוע הגלילה החלקה. */
  var topBtn = document.querySelector('.foot-backtop');
  if(topBtn){
    topBtn.addEventListener('click', function(){
      if(window.lenis) window.lenis.scrollTo(0);
      else window.scrollTo({top:0, behavior:'smooth'});
    });
  }


  /* ── תפריט ההמבורגר ──
     בלוק עצמאי. לא נוגע ב-GSAP, ב-ScrollTrigger ולא במנוע
     הפריימים; מה שהוא כן עושה הוא לעצור את lenis בזמן שהתפריט
     פתוח, אחרת הגלילה החלקה ממשיכה לרוץ מתחת לשכבה. */
  (function(){
    var menu   = document.getElementById('menu');
    var burger = document.querySelector('.burger');
    var closeB = document.getElementById('menuClose');
    if(!menu || !burger) return;

    var lastFocus = null;

    /* שנה בקרדיט */
    var y = menu.querySelector('.menu-yr');
    if(y) y.textContent = new Date().getFullYear();



    /* ── אנימציית כניסה ──
       שני הצדדים מתכנסים מכיוונים הפוכים, כמו ברפרנס: בלוק
       ההתחברות נכנס מצד אחד וטורי הניווט מהצד השני, עם stagger
       שמתעצם ככל שיורדים ברשימה.
       עצמאי לגמרי מ-ScrollTrigger — אין כאן טריגר גלילה. */
    var connectKids = menu.querySelectorAll('.menu__connect > *');
    var navKids     = menu.querySelectorAll('.menu__navigation--header, .menu__navigation-item');
    var footKids    = menu.querySelectorAll('.menu__socials-divider, .menu__socials--footer > *');

    function animateIn(){
      if(!window.gsap) return;
      gsap.killTweensOf([connectKids, navKids, footKids]);
      gsap.fromTo(connectKids, {x:26, autoAlpha:0},
        {x:0, autoAlpha:1, duration:.62, ease:'power3.out', stagger:.055, delay:.10});
      gsap.fromTo(navKids, {x:-30, autoAlpha:0},
        {x:0, autoAlpha:1, duration:.58, ease:'power3.out', stagger:.042, delay:.14});
      gsap.fromTo(footKids, {autoAlpha:0},
        {autoAlpha:1, duration:.5, ease:'power2.out', stagger:.05, delay:.30});
    }

    function resetAnim(){
      if(!window.gsap) return;
      gsap.killTweensOf([connectKids, navKids, footKids]);
      gsap.set([connectKids, navKids, footKids], {clearProps:'all'});
    }



    /* ── מתאר הכרטיס ──
       מלבן מעוגל שנגרעת ממנו פינה, כך שנשארת לשונית מוגבהת
       שבתוכה יושב ה-X. הקשת הקעורה והקמורה נפגשות משיקית,
       בלי קטע ישר ביניהן, ולכן המעבר הוא עקומה אחת רציפה. */
    var card = menu.querySelector('.menu__wrapper');

    function shapeCard(){
      if(!card) return;
      var w = card.offsetWidth, h = card.offsetHeight;
      if(!w || !h) return;
      if(matchMedia('(max-width:900px)').matches){ card.style.clipPath=''; return; }

      var R  = Math.min(40, w*0.022);   // פינות הכרטיס
      var Rt = 26;                      // פינת הלשונית
      /* צר יותר: ברפרנס הלשונית כמעט ריבועית (~110x77 ב-1920).
         קודם היא הייתה 151x74, כלומר מלבן. */
      var TW = Math.max(Rt + R + 40, Math.min(122, w*0.058));

      var navEl  = document.querySelector('nav');
      var padTop = parseFloat(getComputedStyle(menu).paddingTop) || 8;
      var navMid = navEl ? navEl.offsetHeight/2 : 45;
      var TH = Math.max(Rt + 30, 2*(navMid - padTop));
      var r  = TH - Rt;                 // נפגש עם Rt בדיוק
      var x  = w - TW;

      var d = [
        'M', R, TH,
        'H', x - r,
        /* sweep=0. עם 1 המרכז נופל למעלה-שמאל, הקשת מתנפחת
           החוצה ונוצרת גבעה קמורה במקום חתך פנימי. */
        'A', r, r, 0, 0, 0, x, TH - r,
        'V', Rt,
        'A', Rt, Rt, 0, 0, 1, x + Rt, 0,
        'H', w - R,
        'A', R, R, 0, 0, 1, w, R,
        'V', h - R,
        'A', R, R, 0, 0, 1, w - R, h,
        'H', R,
        'A', R, R, 0, 0, 1, 0, h - R,
        'V', TH + R,
        'A', R, R, 0, 0, 1, R, TH,
        'Z'
      ].join(' ');
      card.style.clipPath = 'path("' + d + '")';

      if(closeB){
        var cw = closeB.offsetWidth || 64, ch = closeB.offsetHeight || 64;
        closeB.style.right = Math.round(parseFloat(getComputedStyle(menu).paddingRight)
                              + TW/2 - cw/2) + 'px';
        closeB.style.top   = Math.round(padTop + TH/2 - ch/2) + 'px';
      }
    }
    addEventListener('resize', shapeCard, {passive:true});

    /* מסירים את hidden פעם אחת בטעינה. מכאן והלאה הנראות
       נשלטת ב-visibility בלבד — בלי display:none, ולכן שכבת
       הטשטוש כבר קיימת ולא נבנית מחדש בכל פתיחה. */
    menu.hidden = false;
    shapeCard();

    /* דפדפנים ישנים ללא תמיכה ב-inert מקבלים נפילה ל-tabindex="-1"
       על כל אלמנט ממוקד בתוך התפריט, עם שמירת הערך המקורי. */
    var INERT_OK = 'inert' in HTMLElement.prototype;
    function focusables(){
      return menu.querySelectorAll('a[href],button,input,textarea,select,[tabindex]');
    }
    function setInert(on){
      if(INERT_OK){
        if(on){ menu.setAttribute('inert',''); menu.setAttribute('aria-hidden','true'); }
        else  { menu.removeAttribute('inert'); menu.removeAttribute('aria-hidden'); }
        return;
      }
      [].forEach.call(focusables(), function(el){
        if(on){
          if(!el.hasAttribute('data-ti')) el.setAttribute('data-ti', el.getAttribute('tabindex') || '');
          el.setAttribute('tabindex','-1');
        } else {
          var prev = el.getAttribute('data-ti');
          if(prev === '' || prev === null) el.removeAttribute('tabindex');
          else el.setAttribute('tabindex', prev);
          el.removeAttribute('data-ti');
        }
      });
      menu.setAttribute('aria-hidden', on ? 'true' : 'false');
    }
    setInert(true);          /* התפריט נטען סגור */

    function open(){
      lastFocus = document.activeElement;
      shapeCard();
      menu.classList.add('is-open');
      menu.classList.remove('is-warm');
      animateIn();
      document.documentElement.classList.add('menu-open');
      setInert(false);
      burger.setAttribute('aria-expanded','true');
      if(window.lenis) window.lenis.stop();
      if(closeB) closeB.focus();
    }

    function close(){
      menu.classList.remove('is-open');
      resetAnim();
      document.documentElement.classList.remove('menu-open');
      /* inert ולא visibility בלבד: התפריט נשאר display:block עם
         opacity:0 כדי שאנימציית הסגירה תוכל לרוץ, ולכן הדפדפן
         ממשיך לראות בו אלמנט חי — 22 קישורים בלתי נראים במסלול
         ה-Tab של כל דף. inert מוציא את כל תת-העץ ממסלול המקלדת
         ומקוראי מסך, גם באמצע האנימציה. */
      setInert(true);
      burger.setAttribute('aria-expanded','false');
      if(window.lenis) window.lenis.start();
      if(lastFocus) lastFocus.focus();
    }

    burger.setAttribute('aria-expanded','false');
    burger.setAttribute('aria-controls','menu');
    /* מחממים ברגע שהעכבר נוגע או שהאצבע יורדת — זה קונה
       לדפדפן כמה עשרות מילישניות להרכיב את הטשטוש לפני
       שהפתיחה מתחילה. */
    function warm(){ if(!menu.classList.contains('is-open')) menu.classList.add('is-warm'); }
    burger.addEventListener('pointerenter', warm);
    burger.addEventListener('pointerdown', warm);
    burger.addEventListener('focus', warm);
    burger.addEventListener('click', open);
    if(closeB) closeB.addEventListener('click', close);

    /* לחיצה על הרקע עצמו סוגרת, לחיצה על התוכן לא */
    menu.addEventListener('click', function(e){
      if(e.target === menu) close();
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && menu.classList.contains('is-open')) close();
    });

    /* קישור בתפריט: סוגר ואז גולל, דרך lenis כשהוא פעיל */
    [].forEach.call(menu.querySelectorAll('[data-menu-link]'), function(a){
      a.addEventListener('click', function(e){
        var id = a.getAttribute('href');
        if(!id || id.charAt(0) !== '#') return;
        var t = document.querySelector(id);
        if(!t) return;
        e.preventDefault();
        close();
        /* אחרי ש-lenis חזר לפעול, אחרת הוא מתעלם מהבקשה */
        setTimeout(function(){
          if(window.lenis) window.lenis.scrollTo(t);
          else t.scrollIntoView({behavior:'smooth'});
        }, 120);
      });
    });
  })();

  /* ── פילטר הפרויקטים ──
     hidden ולא opacity: פריט מסונן יוצא מהזרימה ומעץ הנגישות גם יחד. */
  var filters = [].slice.call(document.querySelectorAll('.filt'));
  var cards   = [].slice.call(document.querySelectorAll('#workGrid .card'));

  filters.forEach(function(btn){
    btn.addEventListener('click', function(){
      var key = btn.dataset.filter;
      filters.forEach(function(b){ b.setAttribute('aria-pressed', String(b === btn)); });
      cards.forEach(function(c){
        var tags = (c.dataset.tags || '').split(/\s+/);
        c.hidden = !(key === 'all' || tags.indexOf(key) > -1);
      });
      /* הרשת התקצרה או התארכה — כל מיקומי הגלילה מתחתיה זזו */
      if(window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* אפקט Origin — המילוי מתרחב מנקודת כניסת הסמן וקורס לכיוון היציאה.
     ה-JS קובע רק את המשתנים; התנועה עצמה על עקומת החתימה ב-CSS.
     רק ב-pointer:fine (חסר משמעות במגע). */
  if(matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('.filt, .ghost').forEach(function(btn){
      function place(e, on){
        var r = btn.getBoundingClientRect();
        btn.style.setProperty('--ox', (e.clientX - r.left) + 'px');
        btn.style.setProperty('--oy', (e.clientY - r.top) + 'px');
        btn.style.setProperty('--od', (Math.max(r.width, r.height) * 2.3) + 'px');
        btn.style.setProperty('--os', on ? '1' : '0');
      }
      btn.addEventListener('mouseenter', function(e){ place(e, true); });
      btn.addEventListener('mouseleave', function(e){ place(e, false); });
    });
  }

  /* ── צ'יפים של תחומי עניין ── */
  [].forEach.call(document.querySelectorAll('.interest-option'), function(chip){
    chip.addEventListener('click', function(){
      var on = chip.getAttribute('aria-pressed') === 'true';
      chip.setAttribute('aria-pressed', String(!on));
    });
  });

  /* ── הטופס ──
     ⚠ אין שרת. השליחה פותחת את תוכנת המייל של המשתמש.
     להחלפה ב-endpoint אמיתי (Formspree / Vercel function / API):
     החלף את בלוק ה-mailto בקריאת fetch. */
  var form = document.getElementById('contactForm');
  if(!form) return;

  var note = form.querySelector('.form-status');
  var MAIL_TO = 'hello@digitalframe.co.il';      // ⚠ כתובת זמנית

  function setNote(msg, cls){
    note.textContent = msg;
    note.className = 'form-status' + (cls ? ' --is-' + cls : '');
  }

  /* מנקה סימון שגיאה ברגע שמתחילים לתקן — לא ממתין לשליחה הבאה */
  form.addEventListener('input', function(e){
    var f = e.target.closest('.form-group-field');
    if(f) f.classList.remove('--has-error');
  });

  form.addEventListener('submit', function(e){
    e.preventDefault();

    /* form.elements[...] ולא form.name:
       name/method/action/target הם מאפיינים של HTMLFormElement עצמו
       ומסתירים שדה בעל אותו שם. form.name.value היה זורק שגיאה. */
    var el = form.elements;
    var name  = el['name'].value.trim();
    var email = el['email'].value.trim();
    var bad   = [];

    if(!name)  bad.push(el['name']);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.push(el['email']);
    /* תיקון 13: בלי הסכמה מפורשת אין רשות לאסוף את הפרטים,
       ולכן זו עצירה ולא אזהרה. */
    if(el['consent'] && !el['consent'].checked) bad.push(el['consent']);

    [].forEach.call(form.querySelectorAll('.form-group-field'), function(f){ f.classList.remove('--has-error'); });

    if(bad.length){
      /* כל שדה נושא את השגיאה שלו. ההודעה הגלובלית נשארת כללית
         כדי לא לחזור על אותו מידע פעמיים. */
      var msgs = {name:'צריך למלא שם מלא', email:'כתובת אימייל לא תקינה',
                  consent:'צריך לאשר את מדיניות הפרטיות כדי שנוכל לחזור אליך'};
      bad.forEach(function(i){
        var f = i.closest('.form-group-field');
        f.classList.add('--has-error');
        var slot = f.querySelector('.form-error');
        if(slot) slot.textContent = msgs[i.name] || 'שדה חובה';
      });
      setNote('חסרים פרטים — הדגשתי אותם למעלה.', 'error');
      bad[0].focus();
      return;
    }

    var interests = [].filter.call(form.querySelectorAll('.interest-option'), function(c){
      return c.getAttribute('aria-pressed') === 'true';
    }).map(function(c){ return c.textContent.trim(); });

    var payload = {
      name:    name,
      email:   email,
      phone:   el['phone'].value.trim(),
      company: el['company'].value.trim(),
      message: el['message'].value.trim(),
      interests: interests,
      consent: true,
      website: el['website'] ? el['website'].value : '',   /* מלכודת דבש */
      page: location.pathname
    };

    /* נפילה חזרה ל-mailto. היא קיימת רק למקרה שהשרת לא זמין —
       אסור שגולש יישאר בלי דרך ליצור קשר בגלל תקלה אצלנו. */
    function fallbackToMail(){
      var body =
        'שם: '     + payload.name + '\n' +
        'חברה: '   + payload.company + '\n' +
        'אימייל: ' + payload.email + '\n' +
        'טלפון: '  + payload.phone + '\n' +
        'מעניין: ' + (interests.join(', ') || '—') + '\n\n' +
        payload.message;
      window.location.href = 'mailto:' + MAIL_TO +
        '?subject=' + encodeURIComponent('פנייה מהאתר — ' + payload.name) +
        '&body='    + encodeURIComponent(body);
      setNote('השליחה הישירה נכשלה — פתחתי לך את תוכנת המייל עם הפרטים.', 'error');
    }

    var btn = form.querySelector('[type="submit"]');
    if(btn) btn.disabled = true;
    setNote('שולח…', '');

    fetch('/api/contact', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    }).then(function(r){
      if(r.ok) return r.json();
      throw new Error('status ' + r.status);
    }).then(function(){
      form.reset();
      [].forEach.call(form.querySelectorAll('.interest-option'), function(c){
        c.setAttribute('aria-pressed','false');
      });
      setNote('תודה — מעבירים אותך…', 'success');
      /* replace ולא assign: הדף עם הטופס יוצא מההיסטוריה, כך ש"אחורה"
         לא מחזיר טופס מלא שאפשר לשלוח שוב. ההפניה קורית רק כאן,
         בענף ההצלחה — אם השרת נפל, הגולש נשאר עם הודעה כנה במקום
         עמוד תודה על פנייה שלא הגיעה. */
      window.location.replace('/thank-you');
    }).catch(function(){
      fallbackToMail();
    }).then(function(){
      if(btn) btn.disabled = false;
    });

  });

})();

/* ── חיווי הגלילה ──
   נעלם אחרי 60 פיקסלים של גלילה וחוזר בראש הדף. passive כדי
   לא לעכב את הגלילה עצמה. */
(function(){
  const cue = document.querySelector('.scroll-cue');
  if(!cue) return;
  const sync = () => cue.classList.toggle('is-gone', scrollY > 60);
  addEventListener('scroll', sync, {passive:true});
  sync();
})();

/* ── נגן הרקע של Vimeo ──
   ה-iframe נטען ריק ומקבל src רק כשהסקשן מתקרב למסך. שתי סיבות:
   לא לשלם רוחב פס על סרטון שאולי לא יגיעו אליו, ובעיקר — הפעלה
   בקוד במקום להסתמך על autoplay, שנדחה בנייד ובמצב חיסכון סוללה.
   background=1 נותן נגן בלי ממשק: בלי כפתורים, מושתק, בלולאה. */
(function(){
  var box = document.querySelector('.reel-video[data-vimeo-id]');
  if(!box) return;
  var frame = box.querySelector('.reel-frame');
  if(!frame) return;

  function load(){
    /* getAttribute ולא .src — כש-src ריק, המאפיין מחזיר את כתובת
       הדף (ערך אמיתי), והשומר הזה היה חוסם את הטעינה הראשונה. */
    if(frame.getAttribute('src')) return;
    var id = box.dataset.vimeoId;
    frame.src = 'https://player.vimeo.com/video/' + id +
                '?background=1&autoplay=1&loop=1&muted=1&autopause=0&dnt=1';
    /* is-ready רק אחרי onload — אחרת ה-poster נעלם לפני שיש
       מה להציג במקומו, ורואים מלבן שחור. */
    frame.addEventListener('load', function(){ box.classList.add('is-ready'); });
  }

  if(!('IntersectionObserver' in window)){ load(); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ load(); io.disconnect(); } });
  }, { rootMargin: '600px 0px' });   /* מקדימים בגלילה אחת, לא ברגע האחרון */
  io.observe(box);
})();

/* ============================================================
   כפתור וואטסאפ צף — התנהגות בלבד
   ============================================================
   המארקאפ יושב במעטפת של הגנרטור (שכבת ה-Layout של כל 33
   הדפים), ולכן הכפתור קיים ב-HTML ועובד גם בלי JS. כאן רק
   שני דברים: התאמת ההודעה לדף, וכללי הנראות.

   שלושת כללי הנראות, כולם כדי שלא יתחרה במשהו אחר:
   1. מופיע רק אחרי 400px גלילה — בהירו יש CTA ראשי משלו.
   2. נעלם כשהתפריט פתוח — הוא מרחף מעל אותה שכבה.
   3. נעלם כשסקשן צור-הקשר על המסך — קיצור דרך לטופס שנמצא
      שלושה סנטימטרים משם הוא רעש. */
(function(){
  var btn = document.querySelector('.wa');
  if(!btn) return;

  /* שם הדף לתוך ההודעה, כדי שהפנייה תגיע עם הקשר. נלקח מהכותרת
     ולא ממפה ידנית, כך שדף חדש בגנרטור עובד מאליו.
     encodeURIComponent עוטף את ההודעה כולה — בלעדיו רווח, & או
     סימן שאלה בכותרת היו שוברים את הקישור. */
  function pageLabel(){
    if(location.pathname === '/' || location.pathname === '/index.html') return 'הדף הראשי';
    var t = (document.title || '').split('—')[0].trim();
    return t || 'האתר';
  }
  var phone = btn.getAttribute('data-wa-phone') || '972526665582';
  btn.href = 'https://wa.me/' + phone + '?text=' +
    encodeURIComponent('היי, הגעתי מ' + pageLabel() + ' באתר ואשמח לפרטים.');

  var root = document.documentElement;
  var contactNear = false;

  function sync(){
    var show = scrollY > 400 && !contactNear && !root.classList.contains('menu-open');
    btn.classList.toggle('is-on', show);
  }

  addEventListener('scroll', sync, {passive:true});

  var contact = document.querySelector('.contact');
  if(contact && 'IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      contactNear = es[0].isIntersecting;
      sync();
    }, {rootMargin:'-10% 0px -10% 0px'}).observe(contact);
  }

  /* התפריט לא משדר אירוע — עוקבים אחרי המחלקה על <html> */
  if('MutationObserver' in window){
    new MutationObserver(sync).observe(root, {attributes:true, attributeFilter:['class']});
  }

  sync();
})();

/* ============================================================
   באנר הסכמת עוגיות
   ============================================================
   הבאנר עצמו הוא רק ממשק. ההחלטה המשפטית כבר התקבלה קודם,
   ב-consent.js, שרץ לפני GTM ומגדיר הכל כ-denied. כאן רק
   אוספים את הבחירה ומעבירים אותה הלאה.

   שלושה כללים שנגזרים מכך:
   1. הבאנר לא חוסם את הדף — אפשר לגלול ולקרוא בזמן שהוא פתוח.
      חסימה מלאה היא דפוס אפל שגם פוגע בשיעור הקריאה.
   2. "רק הכרחי" זמין באותה בולטות כמו "מאשר". סירוב שדורש
      שלוש לחיצות יותר מאישור אינו הסכמה חופשית.
   3. סגירה בלי בחירה אינה הסכמה: הבאנר יחזור בביקור הבא.
   ============================================================ */
(function(){
  var C = window.DFConsent;
  if(!C) return;

  var root = document.documentElement;

  function build(){
    var el = document.createElement('div');
    el.className = 'cc';
    el.setAttribute('role','dialog');
    el.setAttribute('aria-live','polite');
    el.setAttribute('aria-label','הסכמה לשימוש בעוגיות');
    el.innerHTML =
      '<div class="cc__in">' +
        '<p class="cc__text">אנחנו משתמשים בעוגיות כדי להבין איך האתר מתפקד ולשפר אותו. ' +
        'אפשר לאשר הכול, או להסתפק בהכרחי בלבד. ' +
        '<a href="/privacy-policy">מדיניות הפרטיות</a></p>' +
        '<div class="cc__btns">' +
          '<button type="button" class="cc__btn" data-cc="necessary">רק הכרחי</button>' +
          '<button type="button" class="cc__btn cc__btn--yes" data-cc="all">מאשר הכול</button>' +
        '</div>' +
      '</div>';
    return el;
  }

  var banner = null;

  function hide(){
    if(!banner) return;
    banner.classList.remove('is-on');
    root.style.setProperty('--dock-offset','0px');
    setTimeout(function(){ if(banner){ banner.remove(); banner = null; } }, 450);
  }

  function lift(){
    /* מרים את כל מה שמרחף בתחתית המסך — כרגע כפתור הוואטסאפ.
       נמדד בפועל ולא מוערך, כי גובה הבאנר משתנה עם הטקסט. */
    if(!banner) return;
    root.style.setProperty('--dock-offset', Math.round(banner.offsetHeight) + 'px');
  }

  function show(){
    banner = build();
    document.body.appendChild(banner);
    requestAnimationFrame(function(){
      banner.classList.add('is-on');
      lift();
    });
    addEventListener('resize', lift, {passive:true});

    banner.addEventListener('click', function(e){
      var b = e.target.closest('[data-cc]');
      if(!b) return;
      var all = b.dataset.cc === 'all';
      C.save({ analytics: all, ads: all });
      hide();
    });
  }

  if(!C.decided()) show();

  /* פתיחה מחדש מהפוטר — חובה שתהיה דרך לחזור מהחלטה */
  document.addEventListener('click', function(e){
    var t = e.target.closest('[data-cc-open]');
    if(!t) return;
    e.preventDefault();
    C.reset();
    if(!banner) show();
  });
})();

/* ============================================================
   שכבת נגן השואוריל
   ============================================================
   הסקשן מציג נגן רקע מושתק. לחיצה על "צפו בשואוריל" פותחת
   שכבה מלאה עם סאונד ושליטה — פס זמן, השהיה, השתקה וחזרה.

   ארבע החלטות שנגזרות מהמבנה:
   1. ה-iframe של השכבה נטען ריק ומקבל src רק בפתיחה. נגן Vimeo
      מלא שוקל מאות KB, ואין סיבה לשלם עליהם למי שלא לחץ.
   2. Lenis נעצר בזמן שהשכבה פתוחה. בלי זה גלגלת מעל הנגן
      מגלגלת את הדף שמאחור, והמגנוט מושך לסקשן אחר.
   3. inert על השכבה הסגורה — אחרת שלושת הכפתורים שבתוכה
      יושבים במסלול ה-Tab של כל דף, בדיוק כמו שקרה בתפריט.
   4. השליטה עוברת דרך postMessage ולא דרך Player API של Vimeo:
      זה אותו פרוטוקול בדיוק, בלי 40KB של ספרייה נוספת.
   ============================================================ */
(function(){
  var box = document.getElementById('reelBox');
  var opener = document.querySelector('.reel-play');
  if(!box || !opener) return;

  var frame = box.querySelector('.rlb__frame');
  var fill  = box.querySelector('.rlb__fill');
  var track = box.querySelector('[data-rlb="seek"]');
  var muteB = box.querySelector('[data-rlb="mute"]');
  var toggl = box.querySelector('[data-rlb="toggle"]');
  var host  = document.querySelector('.reel-video[data-vimeo-id]');
  var id    = host ? host.dataset.vimeoId : '';
  var lastFocus = null, duration = 0, muted = false, playing = false;

  function send(method, value){
    if(!frame.contentWindow) return;
    frame.contentWindow.postMessage(JSON.stringify(
      value === undefined ? {method:method} : {method:method, value:value}
    ), 'https://player.vimeo.com');
  }

  function open(){
    lastFocus = document.activeElement;
    if(!frame.getAttribute('src')){
      /* api=1 פותח את ערוץ ה-postMessage. בלעדיו הנגן מתנגן
         אבל לא עונה לשום פקודה. */
      /* controls=0 הוא מה שמסיר את הפקדים של Vimeo. title/byline/
         portrait מסירים רק את הכיתוב — הנגן שלהם המשיך להופיע
         מעל שלנו. keyboard=0 כדי ששני הנגנים לא יגיבו לאותו רווח. */
      frame.src = 'https://player.vimeo.com/video/' + id +
                  '?api=1&autoplay=1&muted=0&playsinline=1&controls=0&keyboard=0' +
                  '&title=0&byline=0&portrait=0&dnt=1';
    } else {
      send('play');
    }
    box.removeAttribute('inert');
    box.removeAttribute('aria-hidden');
    box.classList.add('is-on');
    document.documentElement.classList.add('rlb-open');
    if(window.lenis) window.lenis.stop();
    playing = true; muted = false;
    muteB.textContent = 'MUTE';

    /* מלכודת פוקוס: כל שאר הדף הופך inert. בלי זה Tab בורח
       לכפתורים שמאחורי הנגן — נמדד: הפוקוס נחת על craft-pill.
       זו הדרך המודרנית במקום ללכוד ידנית את Tab ו-Shift+Tab. */
    [].forEach.call(document.body.children, function(el){
      if(el !== box && !el.hasAttribute('inert')){
        el.setAttribute('inert','');
        el.setAttribute('data-rlb-inert','');
      }
    });

    /* focus() על אלמנט שה-visibility שלו עדיין hidden נופל בשקט,
       ונמדד שהמעבר לוקח ~200ms. ממתינים לאירוע האמיתי ולא לתזמון
       מנוחש; transitionend על visibility הוא הסימן שהשכבה באמת שם.
       ה-setTimeout הוא רשת ביטחון למקרה שהמעבר לא ירה כלל
       (למשל prefers-reduced-motion). */
    var closeBtn = box.querySelector('[data-rlb="close"]');
    var focused = false;
    function grab(){
      if(focused) return;
      if(getComputedStyle(box).visibility !== 'visible') return;
      focused = true;
      closeBtn.focus();
      box.removeEventListener('transitionend', grab);
    }
    box.addEventListener('transitionend', grab);
    setTimeout(grab, 320);
    setTimeout(grab, 700);
  }

  function close(){
    send('pause');
    box.classList.remove('is-on');
    box.setAttribute('inert','');
    box.setAttribute('aria-hidden','true');
    document.documentElement.classList.remove('rlb-open');
    if(window.lenis) window.lenis.start();
    [].forEach.call(document.querySelectorAll('[data-rlb-inert]'), function(el){
      el.removeAttribute('inert');
      el.removeAttribute('data-rlb-inert');
    });
    if(lastFocus) lastFocus.focus();
  }

  opener.addEventListener('click', function(e){ e.preventDefault(); open(); });

  /* לחיצה על גוף הווידאו עצמו מנגנת ומשהה — הציפייה מכל נגן
     במסך מלא. הכפתור המרכזי הוא הביטוי הוויזואלי של אותה פעולה. */
  var stage = box.querySelector('.rlb__stage');
  var center = document.createElement('button');
  center.type = 'button';
  center.className = 'rlb__center';
  center.setAttribute('data-rlb','toggle');
  center.setAttribute('aria-label','נגן או השהה');
  center.innerHTML =
    '<svg class="rlb__pause" aria-hidden="true"><use href="#ico-pause"/></svg>' +
    '<svg class="rlb__play" aria-hidden="true"><use href="#ico-play"/></svg>';
  stage.appendChild(center);

  box.addEventListener('click', function(e){
    var b = e.target.closest('[data-rlb]');
    /* לחיצה על הרקע סוגרת — ציפייה סטנדרטית משכבה מלאה */
    if(!b){ if(e.target === box) close(); return; }
    var act = b.dataset.rlb;
    if(act === 'close') close();
    if(act === 'toggle'){ playing = !playing; send(playing ? 'play' : 'pause');
                          box.classList.toggle('is-paused', !playing);
                          b.setAttribute('aria-label', playing ? 'השהה' : 'נגן'); }
    if(act === 'mute'){ muted = !muted; send('setVolume', muted ? 0 : 1);
                        b.textContent = muted ? 'UNMUTE' : 'MUTE';
                        b.classList.toggle('is-off', muted); }
  });

  function seekFromEvent(e){
    if(!duration) return;
    var r = track.getBoundingClientRect();
    /* הדף RTL אבל פס הזמן מתקדם משמאל לימין, כמו בכל נגן */
    var ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    send('setCurrentTime', ratio * duration);
    fill.style.width = (ratio * 100) + '%';
  }
  track.addEventListener('click', seekFromEvent);
  track.addEventListener('keydown', function(e){
    if(!duration) return;
    var step = e.key === 'ArrowRight' ? -5 : e.key === 'ArrowLeft' ? 5 : 0;
    if(!step) return;
    e.preventDefault();
    send('getCurrentTime');
    track.dataset.nudge = step;          /* מיושם כשהתשובה חוזרת */
  });

  addEventListener('keydown', function(e){
    if(e.key === 'Escape' && box.classList.contains('is-on')) close();
  });

  /* תשובות מהנגן */
  addEventListener('message', function(e){
    if(e.origin !== 'https://player.vimeo.com') return;
    var d;
    try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch(err){ return; }

    if(d.event === 'ready'){
      send('addEventListener', 'playProgress');
      send('addEventListener', 'finish');
      send('getDuration');
      return;
    }
    if(d.method === 'getDuration'){ duration = d.value || 0; return; }
    if(d.method === 'getCurrentTime' && track.dataset.nudge){
      send('setCurrentTime', Math.max(0, (d.value || 0) + (+track.dataset.nudge)));
      track.dataset.nudge = '';
      return;
    }
    if(d.event === 'playProgress' && d.data){
      duration = d.data.duration || duration;
      var pct = d.data.percent * 100;
      fill.style.width = pct + '%';
      track.setAttribute('aria-valuenow', Math.round(pct));
      return;
    }
    /* ברפרנס אין לופ: בסיום הנגן פשוט נסגר. זו התנהגות טובה
       יותר מלופ, שכולא את הגולש בסרטון שכבר ראה. */
    if(d.event === 'finish'){ playing = false; close(); }
  });
})();

/* ============================================================
   פאנל נגישות
   ============================================================
   ההתאמות נשמרות ב-localStorage ומוחלות כמחלקות על <html>.
   ההחלה הראשונית קורית כבר בסקריפט המוטבע בראש הדף — כאן רק
   הממשק. כך מי שבחר בהגדלה לא רואה הבזק של גודל רגיל בכל
   מעבר דף.
   ============================================================ */
(function(){
  var KEY = 'df_a11y_v1';
  var btn = document.getElementById('a11yBtn');
  var panel = document.getElementById('a11yPanel');
  if(!btn || !panel) return;
  var root = document.documentElement;

  var state = { text:0, contrast:false, still:false, links:false };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch(e){}

  var TEXT_LABELS = ['רגיל', 'גדול', 'גדול מאוד'];

  function apply(){
    root.classList.remove('a11y-text-1','a11y-text-2');
    if(state.text) root.classList.add('a11y-text-' + state.text);
    root.classList.toggle('a11y-contrast', !!state.contrast);
    root.classList.toggle('a11y-still',    !!state.still);
    root.classList.toggle('a11y-links',    !!state.links);

    /* עצירת אנימציות צריכה גם לעצור את Lenis ואת GSAP, לא רק את
       מעברי ה-CSS — אחרת הגלילה החלקה והרצף ממשיכים לנוע. */
    if(window.gsap) gsap.globalTimeline.timeScale(state.still ? 0 : 1);
    /* Lenis נעצר ולא נהרס: stop() מחזיר את הגלילה הטבעית של
       הדפדפן, ו-start() מחזיר אותה כשמבטלים. destroy() היה
       דורש לאתחל מחדש את כל המנוע. */
    if(window.lenis){
      if(state.still) window.lenis.stop(); else window.lenis.start();
    }

    [].forEach.call(panel.querySelectorAll('[data-a11y]'), function(b){
      var k = b.dataset.a11y, lab = b.querySelector('.a11y__state');
      if(k === 'text'){
        b.setAttribute('aria-pressed', state.text ? 'true' : 'false');
        if(lab) lab.textContent = TEXT_LABELS[state.text];
      } else if(k in state){
        b.setAttribute('aria-pressed', state[k] ? 'true' : 'false');
        if(lab) lab.textContent = state[k] ? 'פעיל' : 'כבוי';
      }
    });
  }

  function save(){
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){}
  }

  var lastFocus = null;
  function open(){
    lastFocus = document.activeElement;
    panel.removeAttribute('inert');
    panel.removeAttribute('aria-hidden');
    panel.classList.add('is-on');
    btn.setAttribute('aria-expanded','true');
    /* ממתינים למעבר האמיתי: focus() על אלמנט שעדיין
       visibility:hidden נופל בשקט — כפי שנמדד בנגן. */
    var first = panel.querySelector('.a11y__item');
    var done = false;
    function grab(){
      if(done || getComputedStyle(panel).visibility !== 'visible') return;
      done = true; first.focus();
    }
    panel.addEventListener('transitionend', grab, {once:true});
    setTimeout(grab, 380);
  }
  function close(){
    panel.classList.remove('is-on');
    panel.setAttribute('inert','');
    panel.setAttribute('aria-hidden','true');
    btn.setAttribute('aria-expanded','false');
    if(lastFocus) lastFocus.focus();
  }

  btn.addEventListener('click', function(){
    panel.classList.contains('is-on') ? close() : open();
  });

  panel.addEventListener('click', function(e){
    var b = e.target.closest('[data-a11y]');
    if(!b) return;
    var k = b.dataset.a11y;
    if(k === 'close'){ close(); return; }
    if(k === 'reset'){ state = { text:0, contrast:false, still:false, links:false }; }
    else if(k === 'text'){ state.text = (state.text + 1) % 3; }
    else { state[k] = !state[k]; }
    apply(); save();
  });

  addEventListener('keydown', function(e){
    if(e.key === 'Escape' && panel.classList.contains('is-on')) close();
  });

  apply();
})();
