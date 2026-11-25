# ديلي جنشن

صفحة بتتابع الديلي والويكلي وعداد الحظ، وبتجيب أخبار اللعبة، وبتفتحلك Claude بسؤال جاهز.

## التركيب (مرة واحدة)

1. على GitHub: **New repository** (إسمه مثلاً `genshin-daily`)، وخليه Public.
2. إرفع الملفات: **Add file → Upload files**.
   - `index.html` و `news.json` و `scripts/update-news.mjs`.
   - ملف `.github/workflows/news.yml`: لو نظامك بيخبّي الفولدرات اللي بتبدأ بنقطة، إعمله بإيدك من **Add file → Create new file** واكتب في خانة الإسم `.github/workflows/news.yml` والصق محتواه.
3. فعّل الصفحة: **Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save**.
   اللينك هيبقى: `https://<إسمك>.github.io/genshin-daily/`
4. شغّل تحديث الأخبار أول مرة: **Actions → Update Genshin news → Run workflow**.
   لو فشل بسبب الصلاحيات: **Settings → Actions → General → Workflow permissions → Read and write permissions**.

بعد كده الأخبار بتتحدث لوحدها كل يوم الساعة 6 الصبح UTC.

## ملاحظات

- التقدم (الديلي والحظ) بيتحفظ في متصفحك بس.
- قسم **من HoYoLAB** بيعتمد على API غير موثّق رسمياً. لو شكله إتغيّر أو وقف، الصفحة بتكمل شغل عادي بالأخبار اللي في `news.json`، وتقدر تعدّل `highlights` فيه بإيدك.
- متحطش أي كوكيز أو باسورد خاص بحسابك في الريبو أبداً.
