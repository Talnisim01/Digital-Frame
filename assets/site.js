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

    function open(){
      lastFocus = document.activeElement;
      shapeCard();
      menu.classList.add('is-open');
      menu.classList.remove('is-warm');
      animateIn();
      document.documentElement.classList.add('menu-open');
      burger.setAttribute('aria-expanded','true');
      if(window.lenis) window.lenis.stop();
      if(closeB) closeB.focus();
    }

    function close(){
      menu.classList.remove('is-open');
      resetAnim();
      document.documentElement.classList.remove('menu-open');
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

    var body =
      'שם: '     + name + '\n' +
      'חברה: '   + el['company'].value.trim() + '\n' +
      'אימייל: ' + email + '\n' +
      'טלפון: '  + el['phone'].value.trim() + '\n' +
      'מעניין: ' + (interests.join(', ') || '—') + '\n\n' +
      el['message'].value.trim();

    window.location.href = 'mailto:' + MAIL_TO +
      '?subject=' + encodeURIComponent('פנייה מהאתר — ' + name) +
      '&body='    + encodeURIComponent(body);

    setNote('נפתחת אצלך תוכנת המייל עם הפרטים. לא נפתחה? כתוב לנו ל־' + MAIL_TO, 'success');
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
