#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Digital Frame — גנרטור הדפים הפנימיים
=====================================

למה הוא קיים
------------
הניווט, התפריט, סקשן צור-הקשר והפוטר הם ~22KB של מארקאפ. ב-19 דפים
זה מעל 400KB של שכפול, וכל תיקון בפוטר היה דורש 19 עריכות ידניות.
כאן יש מקור אחד לכל אחד מהם (_src/partials/), וטבלאות נתונים לשירותים
ולפרויקטים. הפלט הוא HTML סטטי רגיל — אין build step ב-Vercel ואין JS
שמזריק תוכן בזמן ריצה, ולכן אין פגיעה ב-SEO או בזמן הטעינה.

איך מריצים
----------
    python3 _src/build.py          # מייצר הכול לשורש הריפו

דף הבית
-------
index.html אינו נוצר מחדש — הוא נכתב ביד ומכוון פיקסל-פיקסל. הגנרטור
רק מחליף בו את ארבעת הבלוקים שבין סימני <!--@nav--> ... <!--/@nav-->,
כך שגם הוא ניזון מאותו מקור.

טוקן {{HOME}}
-------------
בדף הבית העוגנים חייבים להישאר "#services" כדי שהגלילה החלקה תתפוס
אותם. בדף פנימי הם חייבים להיות "/#services" כדי לחזור הביתה קודם.
זה ההבדל היחיד בין הרינדורים, ולכן הוא טוקן ולא שני עותקים.

תוכן
----
⚠ כל הטקסטים כאן הם זמניים ומסומנים ב-PLACEHOLDER. הם נועדו לתת
לשלד נפח אמיתי כדי שאפשר יהיה לשפוט פריסה וטיפוגרפיה. להחליף
בתוכן אמיתי לפני עלייה לאוויר.
"""

import os, re, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P    = os.path.join(ROOT, '_src', 'partials')

def partial(name):
    return open(os.path.join(P, f'{name}.html'), encoding='utf-8').read()

NAV, MENU, CONTACT, FOOTER = map(partial, ('nav', 'menu', 'contact', 'footer'))

MAIL = 'hello@digitalframe.co.il'

# ⚠ פרופילי הרשתות — מקור אחד לכל 25 המופעים בכל דף.
#   כל עוד הערך הוא '#' הקישור לא מוביל לשום מקום. להחליף בכתובות אמיתיות.
SOCIAL = {
    'INSTAGRAM': '#',
    'FACEBOOK':  '#',
    'LINKEDIN':  '#',
    'YOUTUBE':   '#',
    'TIKTOK':    '#',
}


def resolve(html, home='/'):
    """מחליף את טוקני המעטפת. {{HOME}} ריק בדף הבית, '/' בדף פנימי."""
    html = html.replace('{{HOME}}', home)
    for net, url in SOCIAL.items():
        html = html.replace('{{SOCIAL_%s}}' % net, url)
    return html


# ============================================================
# נתונים
# ============================================================

# (slug, שם, eyebrow, lede, [מה כלול], [שלבי התהליך])
SERVICES = [
 ('ui-ux', 'אפיון ו-UI/UX', 'חוויית משתמש',
  'לפני שבונים — מחליטים. אפיון מסודר שקובע מה המשתמש רואה, לאן הוא לוחץ, ומה קורה אחרי.',
  [('מפת מסכים', 'כל מסך באתר או במערכת, והקשר ביניהם, לפני שורת קוד אחת.'),
   ('אבות טיפוס', 'מודל לחיץ שאפשר להתנסות בו ולתקן בזול.'),
   ('מערכת עיצוב', 'צבעים, טיפוגרפיה ורכיבים — פעם אחת, לכל הפרויקט.'),
   ('בדיקות משתמשים', 'אנשים אמיתיים מול המסך, לפני ההשקה ולא אחריה.')],
  [('שיחת עומק', 'מי הלקוח שלך, מה הוא צריך, ואיפה הוא נתקע היום.'),
   ('מיפוי מסעות', 'כל נתיב שהמשתמש עובר, מהפרסומת ועד הסגירה.'),
   ('אפיון ועיצוב', 'מסכים מדויקים, במידות אמיתיות, עם התוכן האמיתי.'),
   ('מסירה לפיתוח', 'קבצים מסודרים והנחיות שלא משאירות מקום לפרשנות.')]),

 ('web-development', 'בניית אתרים', 'פיתוח',
  'אתר מהיר, נגיש, ובנוי RTL מהיסוד — לא תבנית שנדחסה לעברית.',
  [('קוד ייעודי', 'בלי תוספים מיותרים ובלי משקל שלא ביקשת.'),
   ('ביצועים', 'טעינה מהירה בנייד, כי שם רוב הגולשים שלך.'),
   ('נגישות', 'תקן ישראלי, ניווט מקלדת וקונטרסט נכון.'),
   ('ניהול עצמאי', 'עדכון תוכן בלי לחכות לנו.')],
  [('אפיון טכני', 'מה האתר צריך לעשות, ומה הוא לא צריך.'),
   ('בנייה', 'מהשלד ועד האנימציות, בסבבים עם צילומי מסך.'),
   ('בדיקות', 'דפדפנים, מכשירים, מהירות, טפסים.'),
   ('עלייה לאוויר', 'דומיין, תעודת אבטחה, אנליטיקס ומעקב.')]),

 ('branding', 'מיתוג', 'זהות',
  'שפה ויזואלית שנשארת עקבית בין פוסט, אתר, הצעת מחיר ושלט.',
  [('לוגו', 'בכל הגרסאות והפורמטים שתצטרך.'),
   ('פלטה וטיפוגרפיה', 'צבעים וגופנים עם כללים ברורים מתי משתמשים במה.'),
   ('ספר מותג', 'מסמך אחד שכל ספק חיצוני יכול לעבוד לפיו.'),
   ('תבניות', 'מצגת, מסמך והצעת מחיר בשפה אחת.')],
  [('אבחון', 'איפה המותג עומד היום ומול מי.'),
   ('כיוונים', 'שתיים-שלוש שפות ויזואליות לבחירה.'),
   ('פיתוח', 'הכיוון הנבחר מפותח לכל נקודות המגע.'),
   ('מסירה', 'קבצי מקור, ספר מותג ותבניות עבודה.')]),

 ('campaigns', 'קמפיינים', 'מדיה',
  'קמפיינים בפייסבוק, אינסטגרם וגוגל שנמדדים בפניות — לא בחשיפות.',
  [('אסטרטגיה', 'לאיזה קהל, עם איזה מסר, ובאיזה תקציב.'),
   ('קריאייטיב', 'מודעות שנבנות לפלטפורמה ולא מועתקות בין רשתות.'),
   ('מדידה', 'פיקסל, המרות ודוח שאתה באמת מבין.'),
   ('אופטימיזציה', 'כיבוי מה שלא עובד והגדלה של מה שכן.')],
  [('הגדרת יעד', 'כמה פניות, באיזו עלות, ועד מתי.'),
   ('הקמה', 'חשבון, פיקסל, קהלים ומבנה קמפיין.'),
   ('הרצה', 'שבועיים ראשונים של איסוף נתונים ותיקונים.'),
   ('ניהול שוטף', 'דוח חודשי והחלטות על סמך מספרים.')]),

 ('business-automation', 'אוטומציה עסקית', 'תהליכים',
  'כל מה שאתה מקליד פעמיים ביום יכול לקרות לבד. אנחנו בונים את מה שביניהם.',
  [('מיפוי תהליך', 'מה קורה היום, צעד אחר צעד, כולל מה שנשכח.'),
   ('חיבור מערכות', 'CRM, טפסים, חשבוניות ווואטסאפ מדברים ביניהם.'),
   ('התראות', 'הודעה לאדם הנכון ברגע הנכון.'),
   ('בקרה', 'לוח שמראה מה רץ ומה נתקע.')],
  [('תצפית', 'יושבים על התהליך הקיים ומודדים כמה זמן הוא לוקח.'),
   ('תכנון', 'מה מתאמת, מה נשאר אנושי, ולמה.'),
   ('בנייה', 'התהליך נבנה, נבדק על מקרי קצה, ומועלה.'),
   ('ליווי', 'חודש ראשון של כוונון מול המציאות.')]),

 ('ecommerce', 'חנויות אונליין', 'מכירה',
  'חנות שעובדת בעברית, עם משלוחים ותשלומים ישראליים ומסלול קנייה קצר.',
  [('הקמת חנות', 'קטלוג, קטגוריות, מלאי וּוריאציות.'),
   ('תשלומים', 'סליקה ישראלית וחשבונית אוטומטית.'),
   ('משלוחים', 'חברות שליחויות, נקודות איסוף ומעקב.'),
   ('אופטימיזציה', 'צמצום נטישת עגלה ושיפור אחוז ההמרה.')],
  [('מיפוי קטלוג', 'כמה מוצרים, אילו וריאציות, איזה מלאי.'),
   ('בנייה', 'חנות, עיצוב והזרמת מוצרים.'),
   ('חיבורים', 'סליקה, חשבוניות, משלוחים ומייל.'),
   ('השקה', 'בדיקת הזמנה מקצה לקצה לפני שהיא אמיתית.')]),

 ('whatsapp-automation', 'אוטומציית וואטסאפ', 'שיחות',
  'הלקוח מקבל תשובה בשנייה, בערוץ שהוא כבר פתוח אצלו — וגם אתה מקבל.',
  [('מענה אוטומטי', 'תשובות לשאלות שחוזרות, מסביב לשעון.'),
   ('סינון פניות', 'מי רלוונטי מגיע אליך, השאר מקבל מענה.'),
   ('עדכוני סטטוס', 'הזמנה יצאה, הגיעה, מוכנה לאיסוף.'),
   ('חיבור למערכת', 'כל שיחה נרשמת במקום שבו אתה עובד.')],
  [('תרחישים', 'אילו הודעות נכנסות, ומה התשובה הנכונה לכל אחת.'),
   ('בנייה', 'הזרימה נבנית, כולל נפילה לאדם כשצריך.'),
   ('בדיקה', 'שיחות אמיתיות מול המספר לפני הפעלה.'),
   ('הפעלה', 'עלייה מדורגת עם מעקב על מה שנופל.')]),

 ('management-systems', 'מערכות ניהול', 'מערכות',
  'מערכת שנבנית סביב איך שהעסק שלך באמת עובד, במקום להתאים את העסק לתוכנה.',
  [('ניהול הזמנות', 'מהפנייה ועד המסירה, במסך אחד.'),
   ('לקוחות וספקים', 'כל ההיסטוריה במקום אחד.'),
   ('הרשאות', 'כל אחד רואה את מה שהוא צריך.'),
   ('דוחות', 'המספרים שמעניינים אותך, לא תבנית גנרית.')],
  [('אפיון', 'תהליכי העבודה האמיתיים, כולל היוצאים מן הכלל.'),
   ('אב טיפוס', 'גרסה ראשונה שאפשר ללחוץ עליה תוך שבועות.'),
   ('פיתוח', 'סבבים קצרים עם משוב מהצוות שישתמש.'),
   ('הטמעה', 'הדרכה, העברת נתונים וליווי בחודש הראשון.')]),

 ('integrations', 'אינטגרציות', 'חיבורים',
  'המערכות שכבר יש לך, מדברות ביניהן. בלי ייצוא לאקסל ובלי הקלדה כפולה.',
  [('חיבור API', 'בין מערכות שלא תוכננו לדבר.'),
   ('סנכרון נתונים', 'שני צדדים, מקור אמת אחד.'),
   ('טיפול בכשלים', 'ניסיון חוזר והתראה כשמשהו נופל.'),
   ('תיעוד', 'כדי שמישהו אחר יוכל לתחזק את זה אחרינו.')],
  [('מיפוי', 'אילו מערכות, אילו שדות, ולאיזה כיוון.'),
   ('בנייה', 'החיבור נבנה בסביבת בדיקות.'),
   ('אימות', 'הרצה על נתונים אמיתיים לפני מעבר.'),
   ('מעבר', 'העברה לייצור עם מעקב שבוע ראשון.')]),

 ('maintenance', 'תחזוקה ותמיכה', 'שוטף',
  'אתר ומערכת הם דבר חי. עדכונים, גיבויים ותקלות — באחריותנו.',
  [('עדכונים', 'גרסאות, אבטחה ותוספים.'),
   ('גיבויים', 'אוטומטיים, ועם שחזור שנבדק.'),
   ('ניטור', 'מתריעים כשהאתר נופל לפני שאתה מגלה.'),
   ('שינויים שוטפים', 'בנק שעות לתוספות ותיקונים.')],
  [('מיפוי מצב', 'מה קיים, מה מיושן, מה מסוכן.'),
   ('סידור', 'עדכון, גיבוי והידוק אבטחה.'),
   ('שגרה', 'בדיקה תקופתית קבועה.'),
   ('זמינות', 'ערוץ ישיר לתקלות דחופות.')]),
]

# (slug, שם, תגיות, shot class, תיאור קצר, [(כותרת, [פסקאות])], מטא)
PROJECTS = [
 ('jepeto-style', 'Jepeto Style', 'מיתוג / UI/UX', 'shot-a',
  'מותג רהיטים בהתאמה אישית — שפה ויזואלית חדשה ומערכת מכירה שמלווה אותה.',
  [('האתגר', ['⚠ טקסט זמני. כאן נכנס התיאור האמיתי של נקודת הפתיחה: מה היה, מה לא עבד, ומה הלקוח ביקש שישתנה.']),
   ('הפתרון', ['⚠ טקסט זמני. מה נבנה בפועל — מיתוג, קטלוג, מערכת, קמפיין — ולמה דווקא ככה.']),
   ('התוצאה', ['⚠ טקסט זמני. מספרים אם יש, ואם אין — מה השתנה בעבודה היומיומית.'])],
  [('לקוח', 'Jepeto Style'), ('שנה', '2026'), ('שירותים', 'מיתוג · UI/UX'), ('היקף', 'פרויקט מלא')]),

 ('redbeary', 'RedBeary', 'פיתוח / UI/UX', 'shot-b',
  'מותג מזרנים ומצעים — חנות מהירה בעברית ומסלול קנייה מקוצר.',
  [('האתגר', ['⚠ טקסט זמני.']), ('הפתרון', ['⚠ טקסט זמני.']), ('התוצאה', ['⚠ טקסט זמני.'])],
  [('לקוח', 'RedBeary'), ('שנה', '2026'), ('שירותים', 'פיתוח · UI/UX'), ('היקף', 'חנות אונליין')]),

 ('piece4you', 'Piece4You', 'פיתוח / אוטומציה', 'shot-c',
  'מערכת ניהול הזמנות שמחברת לקוחות, ספקים ווואטסאפ לתהליך אחד.',
  [('האתגר', ['⚠ טקסט זמני.']), ('הפתרון', ['⚠ טקסט זמני.']), ('התוצאה', ['⚠ טקסט זמני.'])],
  [('לקוח', 'Piece4You'), ('שנה', '2026'), ('שירותים', 'פיתוח · אוטומציה'), ('היקף', 'מערכת ניהול')]),
]


# ============================================================
# רכיבים חוזרים
# ============================================================

ARROW = ('<span class="arw-box">'
         '<svg class="arw a1" viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 18L6 6M6 6h9M6 6v9"/></svg>'
         '<svg class="arw a2" viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 18L6 6M6 6h9M6 6v9"/></svg>'
         '</span>')

def cta(href, label, cls='cta'):
    return f'<a href="{href}" class="{cls}"><span class="wave-text">{label}</span>\n      {ARROW}</a>'

def head(eyebrow, title, lede='', button=None):
    """ראש דף אחיד — הדפוס חוזר בכל הדפים הפנימיים.

    ltr_title: מפצל הכותרות עוטף כל מילה ב-span נפרד. בהקשר RTL
    המילים זורמות מימין לשמאל, ולכן שם לועזי בן שתי מילים מתהפך
    ("Jepeto Style" -> "Style Jepeto"). dir="ltr" על הכותרת מחזיר
    את סדר המילים; היישור לימין נשמר ב-pages.css.
    """
    plain = re.sub(r'<[^>]+>', '', title)
    ltr = 'ltr' if plain.strip() and all(ord(c) < 0x590 for c in plain) else ''
    attr = ' dir="ltr"' if ltr else ''
    out = ['<section class="page-head lay">',
           f'  <p class="eyebrow" data-animate="fade">{eyebrow}</p>',
           f'  <h1 class="page-title"{attr} data-animate="title">{title}</h1>']
    if lede:
        out.append(f'  <p class="page-lede" data-animate="fade-up">{lede}</p>')
    if button:
        out.append(f'  <div data-animate="fade-up">{cta(*button)}</div>')
    out.append("""  <span class="scroll-cue" aria-hidden="true">
    <span class="scroll-cue__track"><span class="scroll-cue__dot"></span></span>
  </span>""")
    out.append('</section>')
    return '\n'.join(out)

def card(slug, name, tags, shot):
    return (f'    <a class="card" href="/projects/{slug}" data-animate="fade-up">\n'
            f'      <div class="card-media"><div class="card-shot {shot}"></div></div>\n'
            f'      <div class="card-foot">\n'
            f'        <span class="card-name">{name}\n          {ARROW}\n        </span>\n'
            f'        <span class="card-tags">{tags}</span>\n'
            f'      </div>\n    </a>')

def page(path, title, desc, body, extra_css=True):
    """עוטף גוף-דף במעטפת המשותפת ומחזיר HTML שלם."""
    css = '\n<link rel="stylesheet" href="/assets/pages.css">' if extra_css else ''
    html = f'''<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@100;200;300;400;500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">{css}
</head>
<body class="page">

{NAV}

{MENU}

{body}

{CONTACT}

{FOOTER}

<div class="scroll-prog" aria-hidden="true"><span class="scroll-prog__fill"></span></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/CustomEase.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js"></script>
<script src="/assets/engine.js"></script>
<script src="/assets/site.js"></script>

</body>
</html>
'''
    return resolve(html, '/')


def write(path, html):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, 'w', encoding='utf-8').write(html)
    return path, len(html)


# ============================================================
# תבניות הדפים
# ============================================================

def tpl_service(slug, name, eyebrow, lede, includes, steps):
    tiles = '\n'.join(
        f'''    <div class="tile" data-animate="fade-up">
      <span class="tile__num">0{i+1}</span>
      <h3 class="tile__title">{t}</h3>
      <p class="tile__text">{d}</p>
    </div>''' for i, (t, d) in enumerate(includes))

    stepz = '\n'.join(
        f'''    <div class="step" data-animate="fade-up">
      <div>
        <h3>{t}</h3>
        <p>{d}</p>
      </div>
    </div>''' for t, d in steps)

    cards = '\n'.join(card(s, n, tg, sh) for s, n, tg, sh, *_ in PROJECTS)

    body = f'''{head(eyebrow, name, lede, (f'/contact', 'לדבר על זה'))}

<hr class="rule">

<section class="sec lay">
  <div class="sec-head">
    <h2 class="sec-title" data-animate="title">מה <strong>כלול</strong></h2>
    <p class="sec-sub" data-animate="fade-up">ארבעה מרכיבים שחוזרים בכל פרויקט מהסוג הזה.</p>
  </div>
  <div class="tiles">
{tiles}
  </div>
</section>

<hr class="rule">

<section class="sec lay">
  <div class="sec-head">
    <h2 class="sec-title" data-animate="title">איך זה <strong>עובד</strong></h2>
    <p class="sec-sub" data-animate="fade-up">ארבעה שלבים, עם נקודת עצירה לאישור בסוף כל אחד.</p>
  </div>
  <div class="steps">
{stepz}
  </div>
</section>

<section class="work" id="work">
  <div class="work-head">
    <h2 class="work-title" data-animate="title">עבודות <strong>בתחום</strong></h2>
    <a href="/projects" class="ghost" data-animate="fade"><span class="wave-text">כל הפרויקטים</span>
      {ARROW}</a>
  </div>
  <div class="work-grid">
{cards}
  </div>
</section>'''
    return page(f'{slug}/index.html', f'{name} — Digital Frame', lede, body)


def tpl_services_index():
    tiles = '\n'.join(
        f'''    <a class="tile" href="/{slug}" data-animate="fade-up">
      <span class="tile__num">{i+1:02d}</span>
      <h3 class="tile__title">{name}</h3>
      <p class="tile__text">{lede}</p>
      <span class="tile__go">לפרטים {ARROW}</span>
    </a>''' for i, (slug, name, eyebrow, lede, *_ ) in enumerate(SERVICES))

    body = f'''{head('שירותים',
                     'כל מה שצריך<br><strong>תחת קורת גג אחת.</strong>',
                     'אסטרטגיה, קריאייטיב, פיתוח ואוטומציה — עשרה שירותים שנבנים אחד על השני '
                     '<span class="dim">ולא כל אחד בנפרד.</span>')}

<hr class="rule">

<section class="sec lay">
  <div class="tiles">
{tiles}
  </div>
</section>'''
    return page('services/index.html', 'שירותים — Digital Frame',
                'עשרה שירותים: אפיון ו-UI/UX, בניית אתרים, מיתוג, קמפיינים, אוטומציה עסקית ועוד.', body)


def tpl_projects_index():
    cards = '\n'.join(card(s, n, tg, sh) for s, n, tg, sh, *_ in PROJECTS)
    body = f'''<section class="work work--page" id="work">

  <div class="work-head">
    <p class="eyebrow" data-animate="fade">פרויקטים</p>
    <h1 class="work-title" data-animate="title">המלאכה שלנו,<br><strong>הביטוי שלך.</strong></h1>
  </div>

  <div class="work-filters" role="group" aria-label="סינון פרויקטים" data-animate="fade-up">
    <button class="filt" type="button" data-filter="all"   aria-pressed="true">הכול</button>
    <button class="filt" type="button" data-filter="ux"    aria-pressed="false">UI/UX</button>
    <button class="filt" type="button" data-filter="dev"   aria-pressed="false">פיתוח</button>
    <button class="filt" type="button" data-filter="brand" aria-pressed="false">מיתוג</button>
    <button class="filt" type="button" data-filter="auto"  aria-pressed="false">אוטומציה</button>
  </div>

  <span class="scroll-cue" aria-hidden="true">
    <span class="scroll-cue__track"><span class="scroll-cue__dot"></span></span>
  </span>

  <div class="work-grid" id="workGrid">
{cards}
  </div>

</section>'''
    return page('projects/index.html', 'פרויקטים — Digital Frame',
                'עבודות נבחרות של Digital Frame — מיתוג, UI/UX, פיתוח ואוטומציה.', body)


def tpl_case(i, slug, name, tags, shot, summary, sections, meta):
    nxt = PROJECTS[(i + 1) % len(PROJECTS)]
    metas = '\n'.join(f'    <div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in meta)
    secs = '\n'.join(
        f'''  <section class="sec lay case-body">
    <h2 data-animate="fade-up">{t}</h2>
    <div data-animate="fade-up">
{"".join(f"      <p>{p}</p>" for p in ps)}
    </div>
  </section>''' for t, ps in sections)

    body = f'''{head(tags, name, summary)}

<section class="lay" data-animate="scale-in">
  <!-- ⚠ מילוי גרדיאנט זמני. להחליף ב-<img loading="lazy"> של הפרויקט. -->
  <div class="case-visual"><div class="card-shot {shot}"></div></div>
</section>

<dl class="case-meta lay">
{metas}
</dl>

<hr class="rule">

{secs}

<a class="case-next" href="/projects/{nxt[0]}">
  <div class="lay">
    <span class="case-next__label">הפרויקט הבא</span>
    <span class="case-next__name" dir="ltr">{nxt[1]} {ARROW}</span>
  </div>
</a>'''
    return page(f'projects/{slug}/index.html', f'{name} — Digital Frame', summary, body)


def tpl_about():
    body = f'''{head('עלינו',
                     'סטודיו קטן,<br><strong>אחריות מלאה.</strong>',
                     'אנחנו לא מעבירים אותך בין ארבעה ספקים. האסטרטגיה, העיצוב, הפיתוח והאוטומציה '
                     '<span class="dim">יושבים באותו מקום, ולכן הם מדברים אותה שפה.</span>',
                     ('/contact', 'בואו נדבר'))}

<hr class="rule">

<section class="sec lay case-body">
  <h2 data-animate="fade-up">איך אנחנו עובדים</h2>
  <div data-animate="fade-up">
    <p>⚠ טקסט זמני. כאן נכנס הסיפור האמיתי — איך התחלת, מה מייחד את הדרך שלך, ולמה לקוח צריך לבחור דווקא בך.</p>
    <p>⚠ טקסט זמני. פסקה שנייה: הגישה לעבודה — סבבים קצרים, החלטות על סמך מספרים, ואחריות מקצה לקצה.</p>
  </div>
</section>

<section class="lay">
  <div class="stats">
    <div class="stat" data-animate="fade-up"><b>+40</b><span>פרויקטים שהושלמו</span></div>
    <div class="stat" data-animate="fade-up"><b>+6</b><span>שנות ניסיון</span></div>
    <div class="stat" data-animate="fade-up"><b>4</b><span>תחומי התמחות</span></div>
    <div class="stat" data-animate="fade-up"><b>100%</b><span>בעברית, RTL מהיסוד</span></div>
  </div>
  <!-- ⚠ מספרים זמניים — להחליף באמיתיים לפני עלייה לאוויר. -->
</section>

<section class="sec lay">
  <div class="sec-head">
    <h2 class="sec-title" data-animate="title">במה אנחנו <strong>עוסקים</strong></h2>
  </div>
  <div class="tiles">
{chr(10).join(f"""    <a class="tile" href="/{s}" data-animate="fade-up">
      <h3 class="tile__title">{n}</h3>
      <p class="tile__text">{l}</p>
      <span class="tile__go">לפרטים {ARROW}</span>
    </a>""" for s, n, e, l, *_ in SERVICES[:6])}
  </div>
</section>'''
    return page('about-us/index.html', 'עלינו — Digital Frame',
                'סטודיו שמחבר אסטרטגיה, קריאייטיב, פיתוח ואוטומציה תחת קורת גג אחת.', body)


def tpl_contact():
    body = head('צור קשר',
                'נתחיל בשיחה<br><strong>של עשר דקות.</strong>',
                f'ספר לנו מה אתה מנסה להשיג, ונחזור אליך עם כיוון ראשוני — בלי התחייבות. '
                f'<span class="dim">אפשר גם ישירות למייל: {MAIL}</span>')
    return page('contact/index.html', 'צור קשר — Digital Frame',
                'נתחיל בשיחה קצרה. השאר פרטים ונחזור אליך עם כיוון ראשוני.', body)


def tpl_text(slug, title, eyebrow, sections):
    secs = '\n'.join(f'  <h2>{t}</h2>\n' + '\n'.join(f'  <p>{p}</p>' for p in ps)
                     for t, ps in sections)
    body = f'''{head(eyebrow, title)}

<hr class="rule">

<section class="sec lay">
  <div class="prose">
    <p class="updated">עודכן לאחרונה: ספטמבר 2026</p>
{secs}
  </div>
</section>'''
    return page(f'{slug}/index.html', f'{title} — Digital Frame', title, body)


def tpl_404():
    body = f'''<section class="nf">
  <div>
    <p class="nf__code">4<b>0</b>4</p>
    <p>הדף שחיפשת לא קיים, או שהכתובת השתנתה. אפשר לחזור לדף הבית או לעבור לפרויקטים.</p>
    <div>{cta('/', 'לדף הבית')}</div>
  </div>
</section>'''
    html = page('404.html', 'הדף לא נמצא — Digital Frame', 'הדף שחיפשת לא קיים.', body)
    # ב-404 אין טעם בטופס יצירת קשר המלא — הוא מסיח מהפעולה היחידה שרוצים
    return html.replace(resolve(CONTACT, '/'), '')


# ============================================================
# דף הבית — החלפת הבלוקים המסומנים בלבד
# ============================================================

def patch_home():
    path = os.path.join(ROOT, 'index.html')
    src = open(path, encoding='utf-8').read()
    for tag, blk in (('nav', NAV), ('menu', MENU), ('contact', CONTACT), ('footer', FOOTER)):
        # בדף הבית העוגנים נשארים מקומיים -> {{HOME}} ריק
        new = resolve(blk, '')
        src = re.sub(f'<!--@{tag}-->.*?<!--/@{tag}-->',
                     lambda m: f'<!--@{tag}-->\n{new}\n<!--/@{tag}-->',
                     src, flags=re.S)
    open(path, 'w', encoding='utf-8').write(src)
    return 'index.html', len(src)


# ============================================================
# ריצה
# ============================================================

def main():
    out = [patch_home()]

    out.append(write('services/index.html', tpl_services_index()))
    for s in SERVICES:
        out.append(write(f'{s[0]}/index.html', tpl_service(*s)))

    out.append(write('projects/index.html', tpl_projects_index()))
    for i, p in enumerate(PROJECTS):
        out.append(write(f'projects/{p[0]}/index.html', tpl_case(i, *p)))

    out.append(write('about-us/index.html', tpl_about()))
    out.append(write('contact/index.html', tpl_contact()))

    PRIVACY = [('מי אנחנו', ['⚠ טקסט זמני. שם העסק, מספר עוסק ודרכי יצירת קשר.']),
               ('אילו נתונים נאספים', ['⚠ טקסט זמני. פרטים שנמסרים בטופס, נתוני שימוש ועוגיות.']),
               ('למה משתמשים בהם', ['⚠ טקסט זמני. מענה לפניות, שיפור השירות ומדידת ביצועים.']),
               ('שיתוף עם צד שלישי', ['⚠ טקסט זמני. ספקי אחסון, אנליטיקס ופרסום.']),
               ('הזכויות שלך', ['⚠ טקסט זמני. עיון, תיקון ומחיקה של מידע.'])]
    TERMS   = [('כללי', ['⚠ טקסט זמני. השימוש באתר מהווה הסכמה לתנאים.']),
               ('קניין רוחני', ['⚠ טקסט זמני. התכנים והעיצוב שייכים לבעלי האתר.']),
               ('אחריות', ['⚠ טקסט זמני. מגבלת אחריות לשימוש בתכנים.']),
               ('שינויים בתנאים', ['⚠ טקסט זמני. התנאים עשויים להתעדכן מעת לעת.'])]
    out.append(write('privacy-policy/index.html', tpl_text('privacy-policy', 'מדיניות פרטיות', 'משפטי', PRIVACY)))
    out.append(write('terms/index.html',          tpl_text('terms', 'תנאי שימוש', 'משפטי', TERMS)))
    out.append(write('404.html', tpl_404()))

    # /work הוחלף ב-/projects (כמו ברפרנס). ה-redirect יושב ב-vercel.json.
    old = os.path.join(ROOT, 'work')
    if os.path.isdir(old):
        shutil.rmtree(old)
        print('הוסר: work/  (redirect ל-/projects ב-vercel.json)')

    total = sum(n for _, n in out)
    for p, n in out:
        print(f'{n:7,d}  {p}')
    print(f'\n{len(out)} דפים · {total:,} תווים')


if __name__ == '__main__':
    main()
