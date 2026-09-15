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

# ⚠ כתובת האתר בייצור. canonical ו-sitemap דורשים כתובות מוחלטות,
#   וכתובת שגויה כאן גרועה מכלום מבחינת גוגל. אם הדומיין שונה —
#   זו השורה היחידה שצריך לשנות, והשאר נגזר ממנה.
SITE = 'https://digital-frame-two.vercel.app'

# ⚠ מתג ההשקה. כל עוד False האתר מבקש במפורש לא להיאנדקס —
#   דומיין זמני עם תוכן זמני שנכנס למנוע החיפוש הופך לגרסה
#   מתחרה שצריך לנקות אחר כך. ביום המעבר לדומיין האמיתי:
#   לעדכן SITE, להחליף ל-True, ולהריץ את הגנרטור. זה הכל.
LIVE = False

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

# ⚠ תמונות: הקבצים מתארחים כרגע ב-Framer. כל עוד זה המצב, יום שבו
#   אתר ה-Framer ייסגר ישבור את התמונות כאן. להחליף בקבצים מקומיים
#   תחת /assets/work/ ברגע שיהיו.
FRAMER = 'https://framerusercontent.com/images/'

# (slug, שם, קטגוריה, תגיות-סינון, shot/img, קישור חי, תיאור)
PROJECTS = [
 ('roommate', 'RoomMate', 'UI/UX', 'ux', FRAMER + '6Q5ZLsV0rnGoGM2Kp0pfMUwLxEE.png?width=1024', '',
  'אפליקציה למציאת שותפים לדירה — אפיון מלא של חוויית המשתמש, מהחיפוש ועד ההתאמה.'),

 ('woodly', 'Woodly', 'UI/UX', 'ux', FRAMER + '1o2WvDhvCml3D3U7gAhnWudSnRA.png?width=1024', '',
  'חנות ומותג בעולם העץ — ממשק נקי שמעמיד את המוצר עצמו במרכז.'),

 ('fintechpro', 'FinTechPro', 'UI/UX', 'ux', FRAMER + 'QRZotjKyfzQfReboynBHygD38.png?width=393', 'https://fintechpro.framer.ai/',
  'ממשק למוצר פינטק — הצגת נתונים פיננסיים בצורה שקריאה גם למי שלא מהתחום.'),

 ('zion-covenant-gateways', 'Zion Covenant Gateways', 'UI/UX', 'ux', FRAMER + 'aWukSlwHGksZjJroc5x6qzZU.png?width=214', 'https://zioncovenantgateways.lovable.app/',
  'אתר תדמית שנבנה מקצה לקצה — אפיון, עיצוב ופיתוח.'),

 ('find-eat', 'Find Eat', 'UI/UX', 'ux', 'shot-a', '',
  'אפליקציה למציאת מקומות אוכל — דגש על מסלול החלטה קצר ככל האפשר.'),

 ('lohemet', 'המשפחה הלוחמת', 'UI/UX', 'ux', 'shot-b', '',
  'אתר לארגון קהילתי, עם דגש על נגישות ובהירות לקהל רחב.'),

 ('gimlaim', 'אתר הגימלאים', 'UI/UX', 'ux', 'shot-c', '',
  'אתר לקהל מבוגר — טיפוגרפיה גדולה, ניגודיות גבוהה וניווט שאי אפשר ללכת בו לאיבוד.'),

 ('rak-ayom', 'סופר רק היום', 'עיצוב', 'design', 'shot-a', '',
  'שפה ויזואלית לרשת סופרמרקט — מהלוגו ועד חומרי המדף.'),

 ('ptorzakan', 'פרויקט מזוקנים', 'עיצוב', 'design', 'shot-b', '',
  'מיתוג ועיצוב לפרויקט תוכן, כולל התאמה לרשתות החברתיות.'),

 ('ey-project', 'עיצוב מספרה', 'עיצוב', 'design', 'shot-c', '',
  'זהות ויזואלית לעסק בתחום העיצוב האישי — מהשלט ועד כרטיס הביקור.'),

 ('972beard', '972Beard', 'עיצוב', 'design', 'shot-a', '',
  'מיתוג למותג טיפוח לגברים, בשפה כהה ואיכותית.'),
]

# עבודות גרפיות — פריטי גלריה, בלי דף פרויקט משלהם.
# הטקסטים הם של טל, מתוך התיק שלו.
CREATIVE = [
 ('קרדלפ\'ס וויסקי', 'waW4cabHgqewTM9fRtbwcxNwxA0.png?width=1080',
  'עיצוב דרמטי ואקסקלוסיבי לוויסקי פרימיום — שילוב בין יוקרה, אלגנטיות וטעם מעודן.'),
 ('קפה נמס עלית', 'vikfSGS9aWNJM0PeY8fKuAigds.png?width=1080',
  'עיצוב חם ומעורר השראה לקפה של הבוקר הישראלי — נוסטלגיה וקלאסיקה עם טאץ\' מודרני.'),
 ('המקוריסטית', 'a7HIjSruz4JbbqL7DFpblTb2Wqk.png?width=1024',
  'עיצוב תדמית לעסק צעיר בתחום הלקים. מודרניות, נשיות וסטייל צבעוני שמדגישים את היופי שבפשטות.'),
 ('פוסטר לאפליקציית אישורי הגעה', 'ZxrLr0LoXMtJz3nNQkDiPTwnh4.png?width=1555',
  'אסתטיקה נקייה וטכנולוגיה, במטרה להפוך את ניהול האירוע לקל, מסודר ובטוח.'),
 ('CraftFest', 'XJWhVBabFeuyWn9wxNY4jO5gA.png?width=1080',
  'פוסטר לאירוע גיימינג — עתידנות, צבעוניות דינמית וכל הכוכבים בפריים אחד.'),
 ('New DJ', '8PGZsgmEhC7VLNYMs36iJPa8Cis.png?width=1080',
  'מיתוג ורקע לדי-ג\'יי — מוזיקה, אנרגיה וחופש יצירתי בווייב צעיר.'),
 ('פלייר לפנסיון כלבים', 'frNyKovJMTC5cObKI9HyT4tFk.png?width=666',
  'עיצוב קליל ואנרגטי שמשדר ביטחון ואמינות לבעלי כלבים.'),
 ('טורניר CS:GO', '0aZPK5lANpIFxRsD8Eq85u78Ho.png?width=1080',
  'פוסטר הכרזה בסגנון אורבני ובועט, שמדגיש את האדרנלין של עולם הגיימינג.'),
 ('לוגו לעסק בלונים', 'wQHJqBeA5wewo85kdPROi8BFhko.png?width=1000',
  'מיתוג ולוגו לעסק עיצובי בלונים לאירועים — מודרני, שמח ובלתי נשכח.'),
 ('פוסטר בעלי מקצוע', 'iiIMovDqecAXuf8bzrALiprVt4.png?width=2048',
  'שירותי צביעה וחידוש הבית — ויזואליות נקייה וחלוקת צבעים שמשדרת מקצועיות.'),
]


# ============================================================
# מסמכים משפטיים
# ============================================================
# ⚠ הנוסחים נכתבו כבסיס עבודה ואינם ייעוץ משפטי. לפני עלייה
#   לאוויר יש למלא את הפרטים המסומנים ב-⚠ ולהעביר לעורך דין.
# ⚠ המעבר לעוסק מורשה: לעדכן את BUSINESS למספר עוסק מורשה,
#   ובדף הנגישות להחליף את פסקת הפטור בהצהרת עמידה בתקן.

BUSINESS = {
    'name':    'Digital Frame',
    'legal':   '⚠ שם בעל העסק המלא',
    'id':      '⚠ מספר עוסק',
    'address': '⚠ כתובת העסק',
    'phone':   '⚠ טלפון',
    'mail':    MAIL,
}
B = BUSINESS

PRIVACY = [
 ('מי אנחנו', [
  f'אתר זה מופעל על ידי {B["legal"]}, שעוסק בשם המסחרי {B["name"]} '
  f'(מספר עוסק {B["id"]}), מכתובת {B["address"]}.',
  f'לכל פנייה בנושא פרטיות: {B["mail"]} או {B["phone"]}.',
  'מדיניות זו מנוסחת בלשון זכר מטעמי נוחות בלבד ומתייחסת לכל המגדרים.']),

 ('איזה מידע נאסף', [
  'מידע שאתה מוסר ביוזמתך — בעת מילוי טופס יצירת קשר באתר: שם מלא, '
  'כתובת אימייל, מספר טלפון, שם העסק, תחומי העניין שסימנת ותוכן ההודעה. '
  'מסירת המידע אינה חובה חוקית, אך בלעדיה לא נוכל לחזור אליך.',
  'מידע שנאסף אוטומטית — בעת הגלישה עשויים להיאסף נתונים טכניים כגון '
  'כתובת IP, סוג הדפדפן והמכשיר, הדפים שנצפו, משך השהייה ומקור ההגעה לאתר. '
  'נתונים אלה משמשים בעיקר לצורכי תפעול ומדידה, ואינם משמשים לזיהוי אישי.',
  '⚠ אם באתר מותקנים כלי מדידה או פרסום (Google Analytics, Meta Pixel וכדומה) — '
  'יש לפרט אותם כאן בשמם.']),

 ('למה משתמשים במידע', [
  'המידע משמש למטרות הבאות בלבד:',
  '<ul>'
  '<li>מענה לפנייתך ויצירת קשר חוזר.</li>'
  '<li>מתן השירותים שסוכמו והתקשרות שוטפת במסגרתם.</li>'
  '<li>ניהול תקין של האתר, אבטחתו ושיפור חוויית השימוש בו.</li>'
  '<li>עמידה בחובות חוקיות החלות עלינו, לרבות חובות דיווח ותיעוד.</li>'
  '</ul>',
  'לא נשלח אליך דיוור שיווקי אלא אם נתת לכך הסכמה נפרדת ומפורשת, '
  'ובכל הודעה כזו תוכל להסיר את עצמך.']),

 ('הבסיס לאיסוף המידע', [
  'איסוף המידע ושמירתו נעשים על יסוד הסכמתך, הניתנת בעת סימון תיבת האישור '
  'בטופס, ובהתאם להוראות חוק הגנת הפרטיות, התשמ"א-1981 ותקנותיו. '
  'ההסכמה ניתנת מרצון חופשי וניתן לחזור בה בכל עת בפנייה אלינו.']),

 ('מסירת מידע לצדדים שלישיים', [
  'איננו מוכרים ואיננו משכירים מידע אישי. מידע עשוי להימסר במקרים הבאים:',
  '<ul>'
  '<li>לספקי שירות הפועלים עבורנו — אחסון האתר, שירותי דואר אלקטרוני, '
  'מערכות ניהול לקוחות וכלי מדידה — ורק במידה הדרושה לאספקת השירות.</li>'
  '<li>כאשר מסירת המידע נדרשת לפי דין, צו שיפוטי או דרישת רשות מוסמכת.</li>'
  '<li>לשם הגנה על זכויותינו במקרה של מחלוקת משפטית.</li>'
  '</ul>',
  'חלק מספקי השירות מאחסנים מידע מחוץ לישראל. במקרים אלה המידע מועבר '
  'בכפוף להוראות הדין החל על העברת מידע לחו"ל.']),

 ('עוגיות (Cookies)', [
  'האתר עושה שימוש בקבצי עוגיות — קבצי טקסט קטנים הנשמרים בדפדפן. '
  'עוגיות חיוניות נדרשות לתפקוד הבסיסי של האתר ואינן טעונות הסכמה. '
  'עוגיות מדידה או פרסום, ככל שקיימות, ייעשו בהתאם להסכמתך.',
  'ניתן לחסום או למחוק עוגיות דרך הגדרות הדפדפן. חסימה עשויה לפגוע '
  'בחלק מתפקודי האתר.']),

 ('אבטחת מידע', [
  'האתר מאובטח בפרוטוקול HTTPS, והגישה למידע מוגבלת למי שנדרש לכך '
  'לצורך מתן השירות. אנו נוקטים אמצעים סבירים להגנה על המידע, אך אין '
  'מערכת שהיא חסינה לחלוטין, ואיננו יכולים להתחייב לחסינות מוחלטת מפני '
  'גישה בלתי מורשית.']),

 ('כמה זמן נשמר המידע', [
  'פרטי פנייה שלא הבשילה להתקשרות יישמרו לתקופה סבירה לצורך מענה ומעקב, '
  'ולאחר מכן יימחקו. מידע הקשור להתקשרות בפועל יישמר כל עוד נדרש לצורך '
  'מתן השירות ולתקופות הקבועות בדין לעניין תיעוד ודיווח.']),

 ('הזכויות שלך', [
  'על פי חוק הגנת הפרטיות עומדות לך הזכויות הבאות:',
  '<ul>'
  '<li>לעיין במידע המוחזק אודותיך.</li>'
  '<li>לבקש תיקון מידע שאינו נכון, שלם, ברור או מעודכן.</li>'
  '<li>לבקש את מחיקת המידע, בכפוף לחובות שמירה על פי דין.</li>'
  '<li>לחזור בך מהסכמתך לאיסוף המידע ולשימוש בו.</li>'
  '</ul>',
  f'לממש כל אחת מהזכויות האלה אפשר בפנייה אל {B["mail"]}. נשיב לפנייתך '
  'בתוך זמן סביר ובהתאם למועדים הקבועים בדין.']),

 ('שינויים במדיניות', [
  'אנו רשאים לעדכן מדיניות זו מעת לעת. הנוסח המחייב הוא זה המפורסם '
  'בעמוד זה, ומועד העדכון האחרון מופיע בראשו. שימוש באתר לאחר עדכון '
  'מהווה הסכמה לנוסח המעודכן.']),
]

TERMS = [
 ('כללי', [
  f'תנאים אלה מסדירים את השימוש באתר {B["name"]} ובשירותים המוצעים בו. '
  'הגלישה באתר מהווה הסכמה לתנאים במלואם. מי שאינו מסכים להם מתבקש '
  'שלא לעשות שימוש באתר.',
  'התנאים מנוסחים בלשון זכר מטעמי נוחות בלבד ומתייחסים לכל המגדרים.']),

 ('השירותים והמידע באתר', [
  'התכנים באתר נועדו להצגת פעילות העסק ותחומי העיסוק שלו. אין בהם הצעה '
  'מחייבת, התחייבות לתוצאה או ייעוץ מקצועי בכל תחום.',
  'התקשרות בפועל נעשית בהסכם נפרד בכתב, הכולל היקף עבודה, לוחות זמנים '
  'ותמורה. בכל סתירה בין האתר לבין הסכם ספציפי — ההסכם גובר.',
  'מחירים, זמינות ותיאורי שירות עשויים להשתנות ללא הודעה מוקדמת.']),

 ('שימוש מותר ואסור', [
  'מותר להשתמש באתר לצרכים אישיים ועסקיים לגיטימיים בלבד. חל איסור על:',
  '<ul>'
  '<li>העתקה, שכפול או הפצה של תכני האתר ללא אישור בכתב.</li>'
  '<li>איסוף אוטומטי של מידע מהאתר, לרבות באמצעות סורקים או רובוטים.</li>'
  '<li>ניסיון לחדור למערכות האתר, לשבש את פעולתו או להעמיס עליו.</li>'
  '<li>שימוש בטופס יצירת הקשר לשליחת תוכן פוגעני, מטעה או פרסומי.</li>'
  '</ul>']),

 ('קניין רוחני', [
  'כל זכויות היוצרים באתר — לרבות העיצוב, הקוד, הטקסטים, הסימנים המסחריים '
  'והתמונות — שייכות לבעלי האתר או לצדדים שלישיים שהעניקו רישיון לשימוש בהן. '
  'אין להעתיק, לשכפל, לפרסם או ליצור יצירה נגזרת ללא אישור מראש ובכתב.',
  'עבודות המוצגות בעמוד הפרויקטים מוצגות לצורכי הדגמה. זכויות במותגים '
  'ובחומרים של לקוחות שמורות ללקוחות עצמם.']),

 ('קישורים ותכנים של צד שלישי', [
  'האתר עשוי לכלול קישורים לאתרים חיצוניים. אין לנו שליטה על תוכנם או '
  'על מדיניות הפרטיות שלהם, ואיננו אחראים להם. הכניסה אליהם היא באחריות '
  'המשתמש בלבד.']),

 ('אחריות והגבלתה', [
  'האתר ותכניו מוצעים כפי שהם. איננו מתחייבים שהאתר יפעל ללא הפרעות או '
  'תקלות, ואיננו אחראים לנזק שייגרם משימוש בתכניו או מהסתמכות עליהם.',
  'אין באמור כדי לגרוע מאחריות שאינה ניתנת להגבלה על פי דין.']),

 ('פרטיות', [
  'איסוף המידע באתר והשימוש בו מוסדרים ב<a href="/privacy-policy">מדיניות '
  'הפרטיות</a>, המהווה חלק בלתי נפרד מתנאים אלה.']),

 ('שינוי התנאים וזמינות האתר', [
  'אנו רשאים לעדכן תנאים אלה, לשנות את מבנה האתר או להפסיק את פעילותו, '
  'כולה או חלקה, בכל עת וללא הודעה מוקדמת. הנוסח המחייב הוא המפורסם '
  'בעמוד זה במועד השימוש.']),

 ('דין וסמכות שיפוט', [
  'על תנאים אלה יחולו דיני מדינת ישראל בלבד. סמכות השיפוט הבלעדית בכל '
  '⚠ סכסוך תהיה נתונה לבתי המשפט המוסמכים במחוז ⚠ המחוז המבוקש.']),

 ('יצירת קשר', [
  f'בכל שאלה בנוגע לתנאים אלה: {B["mail"]}.']),
]

ACCESS = [
 ('המחויבות שלנו', [
  f'{B["name"]} רואה חשיבות במתן שירות לכלל הציבור, לרבות אנשים עם מוגבלות, '
  'ופועלת לשיפור נגישות האתר באופן שוטף.',
  'הצהרה זו מתייחסת לנגישות האתר בלבד.']),

 ('רמת הנגישות באתר', [
  'האתר נבנה תוך הקפדה על עקרונות תקן ישראלי 5568, המבוסס על הנחיות '
  'WCAG 2.0 ברמה AA. בין היתר בוצעו ההתאמות הבאות:',
  '<ul>'
  '<li>מבנה HTML סמנטי ותקין, עם הגדרת שפה וכיוון עברי (RTL).</li>'
  '<li>קישור "דילוג לתוכן הראשי" בראש כל עמוד.</li>'
  '<li>ניווט מלא באמצעות מקלדת, עם סימון ברור של המוקד הנוכחי.</li>'
  '<li>תיאורים חלופיים לאלמנטים גרפיים ולכפתורים.</li>'
  '<li>ניגודיות צבעים בטקסט התוכן בהתאם לדרישת התקן.</li>'
  '<li>כיבוד העדפת המערכת להפחתת תנועה — האנימציות נעצרות בהתאם.</li>'
  '<li>טפסים עם תוויות מקושרות והודעות שגיאה מילוליות.</li>'
  '</ul>']),

 ('מגבלות ידועות', [
  'האתר כולל אנימציות ותנועה המהוות חלק מהשפה העיצובית. מי שהגדיר במערכת '
  'ההפעלה העדפה להפחתת תנועה יקבל גרסה סטטית.',
  '⚠ תוכני וידאו באתר אינם כוללים כתוביות בשלב זה. חובת הנגשת וידאו חלה '
  'על גופים מסוימים בלבד; ככל שתחול עלינו — נשלים זאת.',
  'ייתכנו עמודים או רכיבים שטרם הונגשו במלואם. אנו פועלים לתקן זאת.']),

 ('פנייה בנושא נגישות', [
  'נתקלת בבעיה, או שיש לך הצעה לשיפור? נשמח לשמוע ולטפל.',
  f'רכז הנגישות: {B["legal"]}',
  f'אימייל: {B["mail"]} · טלפון: {B["phone"]}',
  'נעשה מאמץ להשיב לכל פנייה בתוך זמן סביר.']),

 ('מעמד רגולטורי', [
  '⚠ הפסקה הזו נכונה כל עוד העסק רשום כעוסק פטור: על פי תקנות שוויון '
  'זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), עוסק פטור זכאי לפטור '
  'מביצוע התאמות נגישות בשירותי אינטרנט, ואף על פי כן בחרנו לבצע התאמות '
  'מרצון. עם המעבר לעוסק מורשה יש להחליף פסקה זו בהצהרת עמידה מלאה בתקן.']),
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

def cta_btn(href, label):
    ext = ' target="_blank" rel="noopener"' if href.startswith('http') else ''
    return f'<a href="{href}" class="cta"{ext}><span class="wave-text">{label}</span>\\n      {ARROW}</a>'


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

def media_of(src, alt):
    """גרדיאנט זמני או תמונה אמיתית — לפי מה שיש לפרויקט."""
    if src.startswith('http') or src.startswith('/'):
        return (f'<img class="card-img" src="{src}" alt="{alt}" '
                f'loading="lazy" decoding="async">')
    return f'<div class="card-shot {src}"></div>'


def card(slug, name, cat, tag, src, live=''):
    """כרטיס פרויקט. data-tags הוא מה שהפילטר ב-site.js מחפש —
    בלעדיו כל לחיצה על פילטר הייתה מסתירה את כל הרשת."""
    return (f'    <a class="card" href="/projects/{slug}" data-tags="{tag}" data-animate="fade-up">\n'
            f'      <div class="card-media">{media_of(src, name)}</div>\n'
            f'      <div class="card-foot">\n'
            f'        <span class="card-name">{name}\n          {ARROW}\n        </span>\n'
            f'        <span class="card-tags">{cat}</span>\n'
            f'      </div>\n    </a>')


def canonical_of(path):
    """'services/index.html' -> 'https://.../services'  |  '404.html' -> None"""
    if path == '404.html':
        return None                      # לדף שגיאה אין canonical
    clean = path[:-len('index.html')].rstrip('/')
    return SITE + ('/' + clean if clean else '/')


def page(path, title, desc, body, extra_css=True):
    """עוטף גוף-דף במעטפת המשותפת ומחזיר HTML שלם."""
    css = '\n<link rel="stylesheet" href="/assets/pages.css">' if extra_css else ''
    url = canonical_of(path)
    seo = ''
    if url:
        seo = (f'<link rel="canonical" href="{url}">\n'
               f'<meta property="og:url" content="{url}">\n')
    if not LIVE:
        seo = '<meta name="robots" content="noindex,nofollow">\n' + seo
    seo += (f'<meta property="og:image" content="{SITE}/og-image.png">\n'
            f'<meta property="og:image:width" content="1200">\n'
            f'<meta property="og:image:height" content="630">\n'
            f'<meta property="og:site_name" content="Digital Frame">\n'
            f'<meta property="og:locale" content="he_IL">\n'
            f'<meta name="twitter:card" content="summary_large_image">')
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
{seo}
<script>
/* חייב לרוץ לפני הצביעה הראשונה — ראו "מניעת הבזק" ב-site.css */
(function(d){{
  var h = d.documentElement;
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches) h.classList.add('js-anim');
  setTimeout(function(){{ if(!window.gsap) h.classList.remove('js-anim'); }}, 4000);
}})(document);
</script>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#141B24">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@100;200;300;400;500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">{css}
</head>
<body class="page">

<a href="#main" class="skip">דילוג לתוכן הראשי</a>

{NAV}

{MENU}

<main id="main">

{body}

{CONTACT}

</main>

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

    cards = '\n'.join(card(sl, n, c, t, m, lv) for sl, n, c, t, m, lv, _ in PROJECTS[:3])

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
    cards = '\n'.join(card(sl, n, c, t, m, lv) for sl, n, c, t, m, lv, _ in PROJECTS)

    gallery = '\n'.join(
        f'''    <figure class="art" data-animate="fade-up">
      <img src="{FRAMER}{img}" alt="{title}" loading="lazy" decoding="async">
      <figcaption>
        <b>{title}</b>
        <span>{desc}</span>
      </figcaption>
    </figure>''' for title, img, desc in CREATIVE)

    body = f'''<section class="work work--page" id="work">

  <div class="work-head">
    <p class="eyebrow" data-animate="fade">פרויקטים</p>
    <h1 class="work-title" data-animate="title">המלאכה שלנו,<br><strong>הביטוי שלך.</strong></h1>
  </div>

  <div class="work-filters" role="group" aria-label="סינון פרויקטים" data-animate="fade-up">
    <button class="filt" type="button" data-filter="all"    aria-pressed="true">הכול</button>
    <button class="filt" type="button" data-filter="ux"     aria-pressed="false">UI/UX</button>
    <button class="filt" type="button" data-filter="design" aria-pressed="false">עיצוב ומיתוג</button>
  </div>

  <div class="work-grid" id="workGrid">
{cards}
  </div>

  <span class="scroll-cue" aria-hidden="true">
    <span class="scroll-cue__track"><span class="scroll-cue__dot"></span></span>
  </span>

</section>

<section class="sec lay" id="creative">
  <div class="sec-head">
    <h2 class="sec-title" data-animate="title">עבודות <strong>גרפיות</strong></h2>
    <p class="sec-sub" data-animate="fade-up">פוסטרים, לוגואים ומיתוג — עבודות בודדות מתוך העשייה השוטפת.</p>
  </div>
  <div class="art-grid">
{gallery}
  </div>
</section>'''
    return page('projects/index.html', 'פרויקטים — Digital Frame',
                'עבודות נבחרות של Digital Frame — UI/UX, מיתוג, עיצוב ופיתוח.', body)


def tpl_case(i, slug, name, cat, tag, src, live, summary):
    nxt = PROJECTS[(i + 1) % len(PROJECTS)]
    cta = ''
    if live:
        cta = f'''
  <div class="lay" data-animate="fade-up" style="padding-top:clamp(20px,3vh,36px)">
    {cta_btn(live, 'לצפייה באתר')}
  </div>'''

    body = f'''{head(cat, name, summary)}

<section class="lay" data-animate="scale-in">
  <div class="case-visual">{media_of(src, name)}</div>
</section>
{cta}

<dl class="case-meta lay">
    <div><dt>תחום</dt><dd>{cat}</dd></div>
    <div><dt>שנה</dt><dd>⚠ שנה</dd></div>
    <div><dt>מה נעשה</dt><dd>⚠ שירותים</dd></div>
    <div><dt>היקף</dt><dd>⚠ היקף</dd></div>
</dl>

<hr class="rule">

  <section class="sec lay case-body">
    <h2 data-animate="fade-up">האתגר</h2>
    <div data-animate="fade-up">
      <p>⚠ טקסט זמני. נקודת הפתיחה: מה היה, מה לא עבד, ומה הלקוח ביקש שישתנה.</p>
    </div>
  </section>

  <section class="sec lay case-body">
    <h2 data-animate="fade-up">הפתרון</h2>
    <div data-animate="fade-up">
      <p>⚠ טקסט זמני. מה נבנה בפועל, ולמה דווקא ככה.</p>
    </div>
  </section>

  <section class="sec lay case-body">
    <h2 data-animate="fade-up">התוצאה</h2>
    <div data-animate="fade-up">
      <p>⚠ טקסט זמני. מספרים אם יש, ואם אין — מה השתנה בעבודה היומיומית.</p>
    </div>
  </section>

<a class="case-next" href="/projects/{nxt[0]}">
  <div class="lay">
    <span class="case-next__label">הפרויקט הבא</span>
    <span class="case-next__name"{' dir="ltr"' if all(ord(ch) < 0x590 for ch in nxt[1]) else ''}>{nxt[1]} {ARROW}</span>
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
    def block(x):
        # מחרוזת שמתחילה בתג נכתבת כמו שהיא (רשימות), השאר עטוף בפסקה
        return f'  {x}' if x.lstrip().startswith('<') else f'  <p>{x}</p>'
    secs = '\n\n'.join(f'  <h2>{t}</h2>\n' + '\n'.join(block(x) for x in ps)
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

def home_seo():
    """בלוק ה-SEO של דף הבית — נכתב מאותו מקור כמו שאר הדפים,
    אחרת ביום ההשקה הוא היה נשאר מאחור עם noindex."""
    tags = []
    if not LIVE:
        tags.append('<meta name="robots" content="noindex,nofollow">')
    tags += [
        f'<link rel="canonical" href="{SITE}/">',
        '<meta name="description" content="Digital Frame — סטודיו שמחבר אסטרטגיה, קריאייטיב, פיתוח ואוטומציה: אתרים, מיתוג, קמפיינים ומערכות ניהול.">',
        '<meta property="og:title" content="Digital Frame — שיווק דיגיטלי ואוטומציה">',
        '<meta property="og:description" content="סטודיו שמחבר אסטרטגיה, קריאייטיב, פיתוח ואוטומציה תחת קורת גג אחת.">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:url" content="{SITE}/">',
        f'<meta property="og:image" content="{SITE}/og-image.png">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:site_name" content="Digital Frame">',
        '<meta property="og:locale" content="he_IL">',
        '<meta name="twitter:card" content="summary_large_image">',
    ]
    return '\n'.join(tags)


def patch_home():
    path = os.path.join(ROOT, 'index.html')
    src = open(path, encoding='utf-8').read()
    for tag, blk in (('nav', NAV), ('menu', MENU), ('contact', CONTACT),
                     ('footer', FOOTER), ('seo', home_seo())):
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
    for i, pr in enumerate(PROJECTS):
        out.append(write(f'projects/{pr[0]}/index.html', tpl_case(i, *pr)))

    out.append(write('about-us/index.html', tpl_about()))
    out.append(write('contact/index.html', tpl_contact()))

    out.append(write('privacy-policy/index.html', tpl_text('privacy-policy', 'מדיניות פרטיות', 'משפטי', PRIVACY)))
    out.append(write('terms/index.html',          tpl_text('terms', 'תנאי שימוש', 'משפטי', TERMS)))
    out.append(write('accessibility/index.html',  tpl_text('accessibility', 'הצהרת נגישות', 'משפטי', ACCESS)))
    out.append(write('404.html', tpl_404()))

    # /work הוחלף ב-/projects (כמו ברפרנס). ה-redirect יושב ב-vercel.json.
    old = os.path.join(ROOT, 'work')
    if os.path.isdir(old):
        shutil.rmtree(old)
        print('הוסר: work/  (redirect ל-/projects ב-vercel.json)')

    # ── sitemap + robots ──
    # נגזרים מרשימת הדפים שנכתבה בפועל, ולכן לא יכולים להתיישן:
    # דף חדש בגנרטור מופיע בהם מאליו.
    from datetime import date
    today = date.today().isoformat()
    urls = []
    for path, _ in out:
        u = canonical_of(path)
        if not u:
            continue
        # דף הבית ראשון בעדיפות, אחריו אינדקסים, אחריהם השאר
        depth = u[len(SITE):].strip('/').count('/')
        prio  = '1.0' if u.rstrip('/') == SITE else ('0.8' if depth == 0 else '0.6')
        urls.append((u, prio))
    urls.sort(key=lambda t: (-float(t[1]), t[0]))

    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u, prio in urls:
        sitemap += ['  <url>', f'    <loc>{u}</loc>', f'    <lastmod>{today}</lastmod>',
                    f'    <priority>{prio}</priority>', '  </url>']
    sitemap.append('</urlset>')
    out.append(write('sitemap.xml', '\n'.join(sitemap) + '\n'))

    if LIVE:
        robots = f"""# Digital Frame
User-agent: *
Allow: /

# מקורות הגנרטור אינם תוכן — אין טעם שיאונדקסו
Disallow: /_src/

Sitemap: {SITE}/sitemap.xml
"""
    else:
        robots = """# Digital Frame — סביבה זמנית, לפני השקה.
# האתר עדיין מכיל תוכן זמני ולכן אינו מיועד לאינדוקס.
# ההיפוך נעשה דרך LIVE ב-_src/build.py.
User-agent: *
Disallow: /
"""
    out.append(write('robots.txt', robots))

    total = sum(n for _, n in out)
    for p, n in out:
        print(f'{n:7,d}  {p}')
    print(f'\n{len(out)} דפים · {total:,} תווים')


if __name__ == '__main__':
    main()
