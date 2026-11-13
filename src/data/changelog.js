/**
 * What's new — shown to returning visitors the first time they open the site
 * after an update (see components/layout/WhatsNew).
 *
 * HOW TO PUBLISH AN UPDATE NOTE
 *  1. Add a new object at the TOP of RELEASES (newest first).
 *  2. Use the same number as "version" in package.json (a test fails if they differ).
 *  3. Write short, plain Persian sentences about what the visitor will notice.
 *     type: 'new' (جدید) | 'improved' (بهبود) | 'fixed' (رفع اشکال)
 */
export const RELEASES = [
  {
    id: '0.7.0',
    date: '2026-11-10',
    title: '۲۰ دستور و استفاده‌ی آفلاین',
    changes: [
      { type: 'new', text: '۱۲ دستور جدید اضافه شد؛ حالا ۲۰ دستور داریم، از جمله کته، عدس‌پلو، آش ساده، سالاد شیرازی و شیر برنج. دسته‌های «دسر» و «سالاد و پیش‌غذا» هم دستور دارند.' },
      { type: 'new', text: 'دانشپز را می‌توانی روی گوشی نصب کنی و دستورهایی که قبلاً باز کرده‌ای بدون اینترنت هم کار می‌کنند.' },
      { type: 'improved', text: 'اگر اینترنت قطع شود، سایت می‌گوید آفلاین هستی و توضیح می‌دهد کدام بخش‌ها (قیمت تازه و ورود مدیر) به اینترنت نیاز دارند.' },
      { type: 'improved', text: 'وقتی نسخه‌ی جدیدی آماده شد، با یک دکمه‌ی «به‌روزرسانی» می‌توانی آن را فعال کنی.' },
    ],
  },
  {
    id: '0.6.0',
    date: '2026-11-09',
    title: 'اطلاع‌رسانی تازه‌ها',
    changes: [
      { type: 'new', text: 'از این به بعد، بعد از هر به‌روزرسانی، اولین باری که سایت را باز می‌کنی همین پنجره نشان می‌دهد چه چیزهایی عوض شده.' },
      { type: 'new', text: 'با دکمه‌ی «تازه‌ها» در پایین صفحه، هر وقت خواستی می‌توانی تغییرات اخیر را دوباره ببینی.' },
    ],
  },
  {
    id: '0.5.0',
    date: '2026-11-08',
    title: 'ظاهر فشرده‌تر و مسیر کامل‌تر',
    changes: [
      { type: 'improved', text: 'ظاهر سایت فشرده‌تر و مرتب‌تر شد، به‌خصوص روی موبایل؛ صفحه‌ها خیلی کوتاه‌تر شدند و کمتر باید اسکرول کنی.' },
      { type: 'new', text: 'اگر آشپزی نیمه‌تمام داری، در صفحه‌ی اصلی کارت «ادامه‌ی آشپزی» را می‌بینی.' },
      { type: 'new', text: 'صفحه‌ی هر دستور حالا مراحل پخت و «نکات و اشتباه‌های رایج» را هم نشان می‌دهد.' },
      { type: 'fixed', text: 'در «با مواد موجود»، نمک و روغن موجود فرض می‌شوند؛ انتخاب تخم‌مرغ و گوجه دیگر نتیجه‌ی خالی نمی‌دهد.' },
      { type: 'fixed', text: 'اگر اطلاعات ذخیره‌شده‌ی مرورگرت خراب باشد، سایت دیگر خطا نمی‌دهد.' },
    ],
  },
  {
    id: '0.3.0',
    date: '2026-11-05',
    title: 'حالت آشپزی قدم‌به‌قدم',
    changes: [
      { type: 'new', text: 'حالت آشپزی: هر بار یک مرحله با تایمر، نشانه‌ی آماده شدن و نکته‌های ایمنی.' },
      { type: 'new', text: 'پیشرفت آشپزی و تایمرها بعد از بستن یا بازخوانی صفحه هم می‌مانند.' },
    ],
  },
];

export const CHANGE_TYPES = {
  new: { label: 'جدید', tone: 'success' },
  improved: { label: 'بهبود', tone: 'primary' },
  fixed: { label: 'رفع اشکال', tone: 'accent' },
};
