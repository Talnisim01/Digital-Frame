#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
_src/images.py — המרת מקורות התמונה לגרסאות שמוגשות בפועל
==========================================================
המקורות ב-assets/Work/ הם קבצי עבודה: עד 4096 פיקסלים ועד 26MB.
הכרטיס באתר הוא ~660px רוחב והגלריה ~380px, כלומר מגישים פי חמישה
ממה שנראה אי פעם.

הסקריפט מייצר WebP בשלושה רוחבים לתוך assets/work-web/, וה-srcset
בדפים נותן לכל מכשיר את הגודל הנכון. המקורות נשארים בריפו כארכיון
ולא מוגשים לאיש.

    python3 _src/images.py
"""
import os, glob
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, 'assets', 'Work')     # ⚠ W גדולה — כך הועלה, ו-Vercel רגיש לאותיות
OUT  = os.path.join(ROOT, 'assets', 'work-web')
WIDTHS = (400, 800, 1600)

# שמות קבצים בעברית מייצרים כתובות בעברית — עובד, אבל מכוער
# בשיתופים ושביר בכלים מסוימים. שני אלה מתורגמים ידנית.
RENAME = {
    'פוסטר טורניר CSGO': 'csgo-tournament',
    'פלייר ללא מחיר':    'gym-flyer',
    '12 (1)':            '972beard',
    'Photoapp for web':  'roommate',
}

def slug(name):
    stem = os.path.splitext(name)[0]
    if stem in RENAME:
        return RENAME[stem]
    return stem.replace(' ', '-').replace('(', '').replace(')', '').lower()

def main():
    os.makedirs(OUT, exist_ok=True)
    total_in = total_out = 0
    rows = []
    for path in sorted(glob.glob(os.path.join(SRC, '*'))):
        if os.path.isdir(path):
            continue
        name = os.path.basename(path)
        try:
            im = Image.open(path).convert('RGB')
        except Exception as e:
            print('skip', name, e); continue
        total_in += os.path.getsize(path)
        s = slug(name)
        made = []
        for w in WIDTHS:
            if w > im.width * 1.05:        # לא מגדילים מקור קטן
                continue
            h = round(im.height * w / im.width)
            out = os.path.join(OUT, f'{s}-{w}.webp')
            im.resize((w, h), Image.LANCZOS).save(out, 'WEBP', quality=82, method=6)
            total_out += os.path.getsize(out)
            made.append(w)
        rows.append((name, s, im.size, made))
    import json
    manifest = {s: made for _, s, _, made in rows}
    with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1, sort_keys=True)
    for name, s, size, made in rows:
        print(f'{name[:34]:34} → {s[:24]:24} {size[0]}x{size[1]}  {made}')
    print(f'\n{len(rows)} מקורות: {total_in/1e6:.1f}MB  →  {total_out/1e6:.1f}MB בגרסאות המוגשות')

if __name__ == '__main__':
    main()
