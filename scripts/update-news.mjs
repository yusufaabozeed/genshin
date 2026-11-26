// بيجيب آخر أخبار HoYoLAB الرسمية ويحدّث الجزء "official" في news.json.
// لو أي حاجة فشلت، news.json بيفضل زي ما هو (مفيش حاجة بتتكسر).
// ملحوظة: الـ API ده غير موثّق رسمياً، ممكن يتغيّر شكله.
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "news.json";
const BASE = "https://bbs-api-os.hoyolab.com/community/post/wapi/getNewsList";
const old = JSON.parse(readFileSync(FILE, "utf8"));
const items = [];

// 1 = إعلانات، 2 = إيفنتات، 3 = معلومات
for (const type of [1, 2, 3]) {
  try {
    const r = await fetch(`${BASE}?gids=2&page_size=10&type=${type}`, {
      headers: { "x-rpc-language": "en-us", "user-agent": "Mozilla/5.0", accept: "application/json" },
    });
    const j = await r.json();
    if (j.retcode !== 0) throw new Error(`retcode ${j.retcode} ${j.message}`);
    for (const it of j.data?.list ?? []) {
      const p = it.post;
      if (p?.post_id && p?.subject) items.push({ id: String(p.post_id), title: p.subject, ts: Number(p.created_at) || 0 });
    }
  } catch (e) {
    console.error(`type ${type} failed:`, e.message);
  }
}

if (!items.length) {
  console.log("No items fetched; keeping existing news.json");
  process.exit(0);
}

const seen = new Set();
old.official = items
  .sort((a, b) => b.ts - a.ts)
  .filter((x) => !seen.has(x.id) && seen.add(x.id))
  .slice(0, 12)
  .map((x) => ({
    title: x.title,
    url: `https://www.hoyolab.com/article/${x.id}`,
    date: x.ts ? new Date(x.ts * 1000).toISOString().slice(0, 10) : "",
  }));
old.updated = new Date().toISOString().slice(0, 10);

writeFileSync(FILE, JSON.stringify(old, null, 2) + "\n");
console.log(`Updated with ${old.official.length} items`);
