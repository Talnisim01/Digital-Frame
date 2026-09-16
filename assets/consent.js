/* ============================================================
   consent.js — Google Consent Mode v2
   ============================================================
   הקובץ הזה חייב לרוץ לפני תגית ה-GTM, ובלי defer או async.
   זו אינה העדפה אלא הסדר היחיד שעובד: GTM שנטען לפני שהוגדרה
   ברירת המחדל יורה פעם אחת בלי הסכמה, וזו בדיוק ההפרה שהבאנר
   נועד למנוע. פעם אחת מספיקה.

   הקובץ קטן בכוונה ומוטמע לפני הכל, כדי שלא יעכב את הדף.
   ============================================================ */
(function (w, d) {
  'use strict';

  var KEY = 'df_consent_v1';

  /* dataLayer ו-gtag חייבים להתקיים לפני GTM, אחרת הפקודות
     שנשלחות כאן פשוט נופלות לרצפה. */
  w.dataLayer = w.dataLayer || [];
  function gtag() { w.dataLayer.push(arguments); }
  w.gtag = w.gtag || gtag;

  /* ---------- ברירת מחדל: הכל חסום ---------- */
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    /* אלה נדרשים לתפקוד בסיסי ואבטחה ואינם טעוני הסכמה */
    functionality_storage: 'granted',
    security_storage: 'granted',
    /* חלון המתנה קצר: נותן לגולש רגע להחליט במקום שהתגיות
       יירו מיד עם "denied" ויאבדו את האירוע לגמרי */
    wait_for_update: 500
  });

  /* צמצום נתונים כל עוד אין הסכמה לפרסום */
  gtag('set', 'ads_data_redaction', true);

  /* שימור ייחוס הקמפיין דרך הכתובת כשאין עוגיות. בלי זה ליד
     שהגיע מקמפיין ממומן נראה בדוחות כתנועה ישירה. */
  gtag('set', 'url_passthrough', true);

  /* ---------- שחזור החלטה קודמת ---------- */
  function read() {
    try {
      var raw = w.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      /* מצב פרטי או אחסון חסום — מתייחסים לזה כאל "טרם הוחלט".
         עדיף לשאול שוב מאשר להניח הסכמה. */
      return null;
    }
  }

  function apply(state) {
    var v = state.analytics ? 'granted' : 'denied';
    var a = state.ads ? 'granted' : 'denied';
    gtag('consent', 'update', {
      analytics_storage: v,
      ad_storage: a,
      ad_user_data: a,
      ad_personalization: a
    });
    gtag('set', 'ads_data_redaction', !state.ads);
    w.dataLayer.push({
      event: 'consent_update',
      consent_analytics: state.analytics,
      consent_ads: state.ads
    });
  }

  var saved = read();
  if (saved) apply(saved);

  /* ---------- ממשק לבאנר ---------- */
  w.DFConsent = {
    KEY: KEY,
    get: read,
    /* decided=false כשהגולש עוד לא בחר — אז הבאנר מוצג */
    decided: function () { return !!read(); },
    save: function (state) {
      state = { analytics: !!state.analytics, ads: !!state.ads, at: new Date().toISOString() };
      try { w.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
      apply(state);
      return state;
    },
    /* מאפשר לפתוח מחדש את הבחירה מהפוטר */
    reset: function () {
      try { w.localStorage.removeItem(KEY); } catch (e) {}
    }
  };
})(window, document);
