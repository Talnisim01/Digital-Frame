/**
 * POST /api/contact — קליטת טופס יצירת הקשר
 * ==========================================
 *
 * למה זה קיים
 * -----------
 * הטופס עבד עד היום דרך mailto: — הוא פתח את תוכנת המייל של הגולש
 * וציפה שהוא ילחץ "שלח" בעצמו. בפועל זה נופל בחלק גדול מהמקרים
 * (מובייל, Gmail בדפדפן, מי שאין לו תוכנת מייל מוגדרת), והגולש
 * בטוח ששלח. פניות אבדו בלי שאף אחד ידע.
 *
 * בנוסף, תיקון 13 דורש תיעוד של ההסכמה. ב-mailto שום דבר לא נשמר
 * אצלנו, ולכן לא היה מה להציג.
 *
 * הגדרה נדרשת (חד־פעמית)
 * ----------------------
 * 1. ב-Make.com: תרחיש חדש עם טריגר "Custom webhook". להעתיק את
 *    כתובת ה-Webhook.
 * 2. ב-Vercel: Project Settings → Environment Variables →
 *    MAKE_WEBHOOK_URL = הכתובת מהשלב הקודם. (Production + Preview)
 * 3. ב-Make: לחבר את מה שרוצים — מייל, שורה בגיליון, הודעת
 *    וואטסאפ, כרטיס ב-CRM.
 *
 * בלי המשתנה הזה ה-endpoint מחזיר 503 והטופס נופל חזרה ל-mailto,
 * כך שלעולם אין מצב שבו הגולש נתקע בלי דרך ליצור קשר.
 */

const MAX = { name: 100, email: 150, phone: 40, company: 120, message: 4000 };

function clean(v, limit) {
  return typeof v === 'string' ? v.trim().slice(0, limit) : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  let data = req.body;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { data = null; }
  }
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ ok: false, error: 'bad_request' });
  }

  /* מלכודת דבש: שדה מוסתר שגולש אמיתי לעולם לא ממלא.
     בוט שממלא הכל אוטומטית ייתפס כאן. מחזירים 200 בכוונה —
     בוט שמקבל שגיאה מנסה שוב, בוט שמקבל הצלחה ממשיך הלאה. */
  if (clean(data.website, 100)) {
    return res.status(200).json({ ok: true });
  }

  const name    = clean(data.name, MAX.name);
  const email   = clean(data.email, MAX.email);
  const phone   = clean(data.phone, MAX.phone);
  const company = clean(data.company, MAX.company);
  const message = clean(data.message, MAX.message);
  const interests = Array.isArray(data.interests)
    ? data.interests.slice(0, 10).map(i => clean(i, 40)).filter(Boolean)
    : [];

  const errors = [];
  if (!name) errors.push('name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.push('email');
  /* אותה בדיקה שרצה בדפדפן, שוב בשרת: ולידציה בצד לקוח היא
     נוחות למשתמש, לא אכיפה — אפשר לעקוף אותה בקלות. */
  if (data.consent !== true && data.consent !== '1') errors.push('consent');
  if (errors.length) {
    return res.status(422).json({ ok: false, error: 'validation', fields: errors });
  }

  const hook = process.env.MAKE_WEBHOOK_URL;
  if (!hook) {
    return res.status(503).json({ ok: false, error: 'not_configured' });
  }

  const payload = {
    name, email, phone, company, message, interests,
    consent: true,
    /* תיעוד ההסכמה — מה שצריך להציג אם יישאלו */
    consentText: 'אישור איסוף פרטים לצורך מענה לפנייה, לפי מדיניות הפרטיות',
    submittedAt: new Date().toISOString(),
    page: clean(data.page, 200),
    userAgent: clean(req.headers['user-agent'], 300),
    ip: clean(
      (req.headers['x-forwarded-for'] || '').toString().split(',')[0],
      60
    ),
  };

  try {
    const upstream = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      console.error('make webhook responded', upstream.status);
      return res.status(502).json({ ok: false, error: 'upstream' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('make webhook failed', err && err.message);
    return res.status(502).json({ ok: false, error: 'upstream' });
  }
}
