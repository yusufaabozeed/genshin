/**
 * daily-genshin-db | Account Sync (Enka.Network UID + GOOD JSON) & Gemini Assistant
 * ---------------------------------------------------------------------------------
 * ملف جاهز للرفع على GitHub وربطه مباشرة في index.html عبر:
 *   <script src="account-sync.js"></script>
 * قبل قفلة </body> مباشرة.
 */

(function () {
  "use strict";

  // الوصول الآمن للمتغيرات العامة المعرّفة بـ let/const أو window في index.html
  const getState = () => (typeof S !== "undefined" ? S : window.S);
  const getDB = () => (typeof DB !== "undefined" ? DB : window.DB) || {};
  const getLvlSteps = () => (typeof LVL_STEPS !== "undefined" ? LVL_STEPS : window.LVL_STEPS) || [];
  const getDaysAr = () => (typeof DAYS_AR !== "undefined" ? DAYS_AR : window.DAYS_AR) || {};
  const getNews = () => (typeof NEWS !== "undefined" ? NEWS : window.NEWS) || [];
  const getNewsDate = () => (typeof NEWSD !== "undefined" ? NEWSD : window.NEWSD) || "";
  const getMissingSummary = () =>
    typeof lastMissingSummary !== "undefined" ? lastMissingSummary : window.lastMissingSummary || "";

  const persistState = () => {
    if (typeof save === "function") save();
    else if (typeof window.save === "function") window.save();
  };

  const refreshCharUI = () => {
    if (typeof onCharChange === "function") onCharChange();
    else if (typeof window.onCharChange === "function") window.onCharChange();
    else if (typeof recalcMaterials === "function") recalcMaterials();
    else if (typeof window.recalcMaterials === "function") window.recalcMaterials();
  };

  const TRAVELER_DEPOT_MAP = {
    504: "aether", 704: "lumine", // Anemo
    506: "aether", 706: "lumine", // Geo
    507: "aether", 707: "lumine", // Electro
    508: "aether", 708: "lumine", // Dendro
    502: "aether", 702: "lumine", // Hydro
    503: "aether", 703: "lumine"  // Pyro
  };

  const ELEMENT_BY_DEPOT = {
    504: "Anemo", 704: "Anemo",
    506: "Geo",   706: "Geo",
    507: "Electro", 707: "Electro",
    508: "Dendro", 708: "Dendro",
    502: "Hydro", 702: "Hydro",
    503: "Pyro",  703: "Pyro"
  };

  function normKey(str) {
    return String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  // تحويل (Level + Ascension) إلى أقرب index في مصفوفة LVL_STEPS داخل index.html
  function levelAscToStepIndex(level, asc) {
    const steps = getLvlSteps();
    if (!steps.length) return 0;
    const lvl = Number(level) || 1;
    const a = Number(asc) || 0;

    let bestIdx = 0;
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (s.asc < a) {
        bestIdx = i;
      } else if (s.asc === a) {
        if (lvl >= s.lvl) bestIdx = i;
        else if (i > 0 && steps[i - 1].asc === a) bestIdx = i - 1;
        else bestIdx = i;
      }
    }
    return Math.max(0, Math.min(steps.length - 1, bestIdx));
  }

  // بناء فهارس بحث سريعة من DB.characters و DB.weapons و DB.materials
  function buildIndexes() {
    const db = getDB();
    const charByNorm = new Map();
    const wepByNorm = new Map();
    const matByNorm = new Map();

    Object.values(db.characters || {}).forEach((c) => {
      [c.id, c.name, c.arName, c.enkaId].filter(Boolean).forEach((k) => {
        charByNorm.set(normKey(k), c);
      });
    });

    Object.values(db.weapons || {}).forEach((w) => {
      [w.id, w.name, w.arName, w.enkaId].filter(Boolean).forEach((k) => {
        wepByNorm.set(normKey(k), w);
      });
    });

    Object.values(db.materials || {}).forEach((m) => {
      [m.id, m.name, m.arName].filter(Boolean).forEach((k) => {
        matByNorm.set(normKey(k), m);
      });
    });

    return { charByNorm, wepByNorm, matByNorm };
  }

  // =========================================================================
  // قاموس ترجمة IDs الخاص بـ Enka.Network (الشخصيات والأسلحة) مع كاش محلي
  // =========================================================================
  const ENKA_DICT_KEY = "enka_store_dict_v1";
  let enkaDictCache = null;

  async function getEnkaDictionary() {
    if (enkaDictCache) return enkaDictCache;
    try {
      const cached = JSON.parse(localStorage.getItem(ENKA_DICT_KEY) || "null");
      if (cached && cached.avatars && cached.names && Date.now() - (cached.ts || 0) < 7 * 864e5) {
        enkaDictCache = cached;
        return cached;
      }
    } catch {}

    const charUrls = [
      "https://cdn.jsdelivr.net/gh/EnkaNetwork/API-docs@master/store/characters.json",
      "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/characters.json"
    ];
    const locUrls = [
      "https://cdn.jsdelivr.net/gh/EnkaNetwork/API-docs@master/store/loc.json",
      "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/loc.json"
    ];

    async function fetchFirstJson(urls) {
      for (const u of urls) {
        try {
          const r = await fetch(u);
          if (r.ok) return await r.json();
        } catch {}
      }
      return null;
    }

    const [charsRaw, locRaw] = await Promise.all([fetchFirstJson(charUrls), fetchFirstJson(locUrls)]);
    const enLoc = locRaw?.en || {};
    const avatars = {};

    if (charsRaw && typeof charsRaw === "object") {
      for (const [avId, meta] of Object.entries(charsRaw)) {
        const hash = String(meta?.NameTextMapHash || "");
        const sideIcon = String(meta?.SideIconName || "").replace(/^UI_AvatarIcon_Side_/, "");
        avatars[avId] = {
          enName: enLoc[hash] || "",
          sideIcon
        };
      }
    }

    const dict = { ts: Date.now(), avatars, names: enLoc };
    if (Object.keys(avatars).length > 0) {
      enkaDictCache = dict;
      try {
        localStorage.setItem(ENKA_DICT_KEY, JSON.stringify(dict));
      } catch {}
    }
    return dict;
  }

  function resolveEnkaCharacter(av, dict, charByNorm) {
    const avatarId = String(av.avatarId || "");
    const depotCharId = TRAVELER_DEPOT_MAP[av.skillDepotId];
    if (depotCharId && charByNorm.has(depotCharId)) {
      return charByNorm.get(depotCharId);
    }

    const meta = dict?.avatars?.[avatarId];
    const candidates = [
      avatarId,
      meta?.enName,
      meta?.sideIcon
    ].filter(Boolean);

    for (const c of candidates) {
      const hit = charByNorm.get(normKey(c));
      if (hit) return hit;
    }
    return null;
  }

  function resolveEnkaWeaponId(item, dict, wepByNorm) {
    if (!item) return "";
    const hash = String(item.flat?.nameTextMapHash || "");
    const locName = dict?.names?.[hash] || "";
    const candidates = [
      locName,
      item.weaponName,
      item.flat?.name,
      String(item.itemId || "")
    ].filter(Boolean);

    for (const c of candidates) {
      const hit = wepByNorm.get(normKey(c));
      if (hit) return hit.id;
    }
    return "";
  }

  // =========================================================================
  // 1. استيراد المخزون والشخصيات بصيغة GOOD JSON
  // =========================================================================
  function importGoodJson(rawText) {
    let data;
    try {
      data = typeof rawText === "string" ? JSON.parse(rawText) : rawText;
    } catch {
      throw new Error("ملف JSON غير صالح — تأكد من اختيار ملف بصيغة .json صحيحة.");
    }

    if (!data || data.format !== "GOOD") {
      throw new Error('الملف ليس بصيغة GOOD JSON (يجب أن يحتوي على "format": "GOOD").');
    }

    const state = getState();
    if (!state) throw new Error("تعذر الوصول لبيانات التطبيق المحلية (State).");
    state.inv = state.inv || {};
    state.bCfg = state.bCfg || {};

    const { charByNorm, wepByNorm, matByNorm } = buildIndexes();
    let matchedMats = 0;

    if (data.materials && typeof data.materials === "object") {
      for (const [goodKey, qty] of Object.entries(data.materials)) {
        const hit = matByNorm.get(normKey(goodKey));
        const id = hit ? hit.id : goodKey.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
        state.inv[id] = Math.max(0, Math.floor(Number(qty) || 0));
        if (hit) matchedMats++;
      }
    }

    let matchedChars = 0;
    if (Array.isArray(data.characters)) {
      for (const c of data.characters) {
        const hit = charByNorm.get(normKey(c.key));
        if (!hit) continue;
        matchedChars++;
        const prev = state.bCfg[hit.id] || {};
        const stepIdx = levelAscToStepIndex(c.level, c.ascension);
        state.bCfg[hit.id] = {
          cCur: stepIdx,
          cTar: Math.max(prev.cTar ?? 13, stepIdx),
          tN1: Math.min(10, Math.max(1, Number(c.talent?.auto) || 1)),
          tN2: Math.max(prev.tN2 ?? 6, Number(c.talent?.auto) || 1),
          tE1: Math.min(10, Math.max(1, Number(c.talent?.skill) || 1)),
          tE2: Math.max(prev.tE2 ?? 9, Number(c.talent?.skill) || 1),
          tQ1: Math.min(10, Math.max(1, Number(c.talent?.burst) || 1)),
          tQ2: Math.max(prev.tQ2 ?? 9, Number(c.talent?.burst) || 1),
          wepId: prev.wepId || hit.recommendedWeapons?.[0]?.weaponId || "",
          wCur: prev.wCur ?? 0,
          wTar: prev.wTar ?? 13
        };
      }
    }

    if (Array.isArray(data.weapons)) {
      for (const w of data.weapons) {
        if (!w.location) continue;
        const charHit = charByNorm.get(normKey(w.location));
        const wepHit = wepByNorm.get(normKey(w.key));
        if (charHit && state.bCfg[charHit.id]) {
          const wStep = levelAscToStepIndex(w.level, w.ascension);
          if (wepHit) state.bCfg[charHit.id].wepId = wepHit.id;
          state.bCfg[charHit.id].wCur = wStep;
          state.bCfg[charHit.id].wTar = Math.max(state.bCfg[charHit.id].wTar ?? 13, wStep);
        }
      }
    }

    persistState();
    refreshCharUI();

    return {
      source: data.source || "GOOD Scanner",
      matchedMats,
      matchedChars
    };
  }

  // =========================================================================
  // 2. جلب بيانات الحساب من Enka.Network عبر UID
  // =========================================================================
  async function fetchEnkaByUid(uid) {
    const cleanUid = String(uid || "").trim();
    if (!/^\d{9,10}$/.test(cleanUid)) {
      throw new Error("رقم الـ UID يجب أن يتكون من 9 أو 10 أرقام صحيحة.");
    }

    const endpoint = `https://enka.network/api/uid/${cleanUid}`;
    const proxyGenerators = [
      (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
    ];

    const dictPromise = getEnkaDictionary();
    let payload = null;
    let lastErr = null;

    for (const makeUrl of proxyGenerators) {
      try {
        const res = await fetch(makeUrl(endpoint), {
          headers: { Accept: "application/json" }
        });
        if (res.status === 400) throw new Error("صيغة الـ UID مرفوضة (400).");
        if (res.status === 404) throw new Error("الحساب غير موجود (404). تأكد من الرقم والسيرفر.");
        if (res.status === 424) throw new Error("سيرفرات Genshin في صيانة حالياً (424).");
        if (res.status === 429) throw new Error("طلبات كثيرة، انتظر دقيقة وجرب تاني (429).");
        if (!res.ok) throw new Error(`خطأ من Enka API (${res.status})`);
        payload = await res.json();
        if (payload && typeof payload === "object") break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!payload) {
      throw lastErr || new Error("تعذر الاتصال بـ Enka.Network حالياً.");
    }

    if (!Array.isArray(payload.avatarInfoList) || !payload.avatarInfoList.length) {
      throw new Error('قائمة الشخصيات مخفية داخل اللعبة — فعّل "Show Character Details" في البروفايل ثم أعد المحاولة.');
    }

    const dict = await dictPromise;
    const state = getState();
    if (!state) throw new Error("تعذر الوصول لبيانات التطبيق المحلية (State).");

    state.bCfg = state.bCfg || {};
    state.enka = {
      uid: cleanUid,
      nickname: payload.playerInfo?.nickname || "Traveler",
      ar: payload.playerInfo?.level || 1,
      worldLevel: payload.playerInfo?.worldLevel || 0,
      updatedAt: new Date().toISOString(),
      builds: {}
    };

    const { charByNorm, wepByNorm } = buildIndexes();
    const syncedList = [];

    for (const av of payload.avatarInfoList) {
      const avatarId = String(av.avatarId);
      const charHit = resolveEnkaCharacter(av, dict, charByNorm);

      const level = Number(av.propMap?.["4001"]?.val || 1);
      const asc = Number(av.propMap?.["1002"]?.val || 0);
      const constellation = Array.isArray(av.talentIdList) ? av.talentIdList.length : 0;

      // استخراج التالنت الأساسي (بدون بونص C3/C5)
      const baseSkills = Object.values(av.skillLevelMap || {});
      const tN = Math.min(10, Math.max(1, Number(baseSkills[0]) || 1));
      const tE = Math.min(10, Math.max(1, Number(baseSkills[1]) || 1));
      const tQ = Math.min(10, Math.max(1, Number(baseSkills[2]) || 1));

      let weaponInfo = null;
      const artifactsInfo = [];

      for (const eq of av.equipList || []) {
        if (eq.flat?.itemType === "ITEM_WEAPON") {
          const wId = resolveEnkaWeaponId(eq, dict, wepByNorm);
          weaponInfo = {
            id: wId,
            itemId: eq.itemId,
            level: eq.weapon?.level || 1,
            ascension: eq.weapon?.promoteLevel || 0,
            refinement: (Object.values(eq.weapon?.affixMap || {})[0] || 0) + 1,
            rarity: eq.flat?.rankLevel || 4
          };
        } else if (eq.flat?.itemType === "ITEM_RELIQUARY") {
          artifactsInfo.push({
            slot: eq.flat?.equipType || "",
            level: (eq.reliquary?.level || 1) - 1,
            rarity: eq.flat?.rankLevel || 5,
            mainStat: eq.flat?.reliquaryMainstat || null,
            substats: eq.flat?.reliquarySubstats || []
          });
        }
      }

      const canonicalId = charHit ? charHit.id : avatarId;
      const dictName = dict?.avatars?.[avatarId]?.enName;
      const charName = charHit ? (charHit.arName || charHit.name) : (dictName || `Avatar #${avatarId}`);

      state.enka.builds[canonicalId] = {
        id: canonicalId,
        name: charName,
        element: ELEMENT_BY_DEPOT[av.skillDepotId] || charHit?.element || "",
        level,
        ascension: asc,
        constellation,
        talents: { normal: tN, skill: tE, burst: tQ },
        weapon: weaponInfo,
        artifacts: artifactsInfo
      };

      if (charHit) {
        const prev = state.bCfg[charHit.id] || {};
        const cStep = levelAscToStepIndex(level, asc);
        const wStep = weaponInfo ? levelAscToStepIndex(weaponInfo.level, weaponInfo.ascension) : (prev.wCur ?? 0);

        state.bCfg[charHit.id] = {
          cCur: cStep,
          cTar: Math.max(prev.cTar ?? 13, cStep),
          tN1: tN,
          tN2: Math.max(prev.tN2 ?? 6, tN),
          tE1: tE,
          tE2: Math.max(prev.tE2 ?? 9, tE),
          tQ1: tQ,
          tQ2: Math.max(prev.tQ2 ?? 9, tQ),
          wepId: weaponInfo?.id || prev.wepId || charHit.recommendedWeapons?.[0]?.weaponId || "",
          wCur: wStep,
          wTar: Math.max(prev.wTar ?? 13, wStep)
        };
        syncedList.push({ id: charHit.id, name: charName, level, constellation });
      }
    }

    // تحديد أول شخصية تمت مزامنتها تلقائياً في القائمة إذا كانت موجودة
    if (syncedList[0]) {
      const sel = document.getElementById("charSelect");
      if (sel && Array.from(sel.options).some((o) => o.value === syncedList[0].id)) {
        sel.value = syncedList[0].id;
      }
    }

    persistState();
    refreshCharUI();

    return {
      nickname: state.enka.nickname,
      ar: state.enka.ar,
      syncedList
    };
  }

  // =========================================================================
  // 3. بناء ملخص ذكي لمساعد Gemini (مقارنة Enka + البيلد + الدنجنز المتاحة اليوم)
  // =========================================================================
  function buildGeminiContextPrompt(userQuestion) {
    const state = getState() || {};
    const db = getDB();
    const charId = document.getElementById("charSelect")?.value || state.lastChar || "";
    const ch = db.characters?.[charId];
    const enkaBuild = state.enka?.builds?.[charId];

    const todayEn = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const daysAr = getDaysAr();
    const todayAr = daysAr[todayEn] || todayEn;

    const lines = [
      "أنت مساعد خبير في لعبة Genshin Impact تتحدث باللهجة المصرية بأسلوب عملي ومباشر.",
      `اليوم هو: ${todayAr} (${todayEn}).`
    ];

    const news = getNews();
    if (Array.isArray(news) && news.length) {
      lines.push(`أخبار الباتش الحالية (${getNewsDate()}): ${news.join(" | ")}`);
    }

    if (state.g) {
      lines.push(`عداد الـ Wish: ${state.g.p || 0} سحبة من آخر 5★ (${state.g.gu ? "مضمون" : "50/50"}).`);
    }

    if (ch) {
      lines.push(`\n--- الشخصية المختارة حالياً: ${ch.name} (${ch.arName || ch.name}) [${ch.element} / ${ch.weaponType}] ---`);
      if (ch.talentPriority) {
        lines.push(`أولوية التالنت الموصى بها: ${ch.talentPriority.join(" > ")}`);
      }
      if (Array.isArray(ch.recommendedWeapons) && ch.recommendedWeapons.length) {
        const wepNames = ch.recommendedWeapons
          .slice(0, 3)
          .map((rw) => `${db.weapons?.[rw.weaponId]?.name || rw.weaponId} (${rw.tag})`)
          .join(" | ");
        lines.push(`أفضل الأسلحة المقترحة: ${wepNames}`);
      }
      if (Array.isArray(ch.recommendedArtifacts) && ch.recommendedArtifacts.length) {
        const topArt = ch.recommendedArtifacts[0];
        const setNames = (topArt.sets || [])
          .map((s) => `${db.artifacts?.[s.setId]?.name || s.setId} (${s.pieces}pc)`)
          .join(" + ");
        lines.push(`أفضل طقم آرتيفاكتس: ${setNames} — ${topArt.note || ""}`);
      }
      if (ch.artifactStats?.breakpoints) {
        lines.push(`الأرقام المستهدفة (Breakpoints): ${ch.artifactStats.breakpoints}`);
      }
    }

    if (enkaBuild) {
      const wepName = enkaBuild.weapon?.id
        ? (db.weapons?.[enkaBuild.weapon.id]?.name || enkaBuild.weapon.id)
        : "غير محدد";
      lines.push(
        `\n--- بيانات الشخصية الحالية من Enka.Network (UID: ${state.enka.uid}) ---`,
        `المستوى: Lv.${enkaBuild.level} (C${enkaBuild.constellation}) | التالنت: ${enkaBuild.talents.normal}/${enkaBuild.talents.skill}/${enkaBuild.talents.burst}`,
        `السلاح المجهز: ${wepName} (Lv.${enkaBuild.weapon?.level || 1} R${enkaBuild.weapon?.refinement || 1}) | عدد الآرتيفاكتس: ${enkaBuild.artifacts.length} قطع.`
      );
    }

    const missing = getMissingSummary();
    if (typeof missing === "string" && missing.trim()) {
      lines.push(`\n--- ملخص حاسبة الموارد الناقصة ---\n${missing}`);
    }

    lines.push(`\nسؤال المستخدم: ${userQuestion || "قيم البيلد بتاعي واعملي خطة صرف ريزن للأسبوع ده."}`);
    return lines.join("\n");
  }

  // =========================================================================
  // 4. حقن الواجهة في index.html تلقائياً عند تحميل الصفحة
  // =========================================================================
  function injectAccountSyncUI() {
    const calcPane = document.getElementById("st-calc");
    if (!calcPane || document.getElementById("account-sync-card")) return;

    const card = document.createElement("div");
    card.className = "card";
    card.id = "account-sync-card";
    card.innerHTML = `
      <div class="row" style="justify-content:space-between">
        <h2>🔄 مزامنة الحساب والمخزون</h2>
        <span class="mu" style="font-size:12px">Enka.Network + GOOD JSON</span>
      </div>

      <div class="build-box">
        <div class="row" style="justify-content:space-between">
          <b>🆔 جلب الشخصيات تلقائياً عبر UID</b>
          <span id="enkaPlayerBadge" class="badge ok" style="display:none"></span>
        </div>
        <div class="row" style="margin-top:6px">
          <input type="text" id="enkaUidInput" maxlength="10" placeholder="اكتب الـ UID (9 أرقام)" style="flex:1;min-width:140px">
          <button type="button" class="p" id="btnEnkaSync">جلب من Enka</button>
        </div>
        <div id="enkaQuickChars" class="row" style="margin-top:6px;flex-wrap:wrap"></div>
      </div>

      <div class="build-box">
        <div class="row" style="justify-content:space-between">
          <b>📦 استيراد المخزون (GOOD JSON)</b>
          <label for="goodJsonFile" class="s" style="cursor:pointer;padding:6px 10px;border-radius:8px;display:inline-block">اختر ملف .json</label>
          <input type="file" id="goodJsonFile" accept=".json,application/json" style="display:none">
        </div>
        <div class="mu" style="font-size:12px;margin-top:4px">يدعم ملفات Inventory Kamera و Irminsul و Artiscan لتعبئة المخزون تلقائياً.</div>
      </div>

      <div id="syncFeedbackMsg" class="mu" style="font-size:13px;margin-top:6px"></div>
    `;

    calcPane.insertBefore(card, calcPane.firstChild);

    const uidInput = document.getElementById("enkaUidInput");
    const feedback = document.getElementById("syncFeedbackMsg");
    const badge = document.getElementById("enkaPlayerBadge");
    const quickBox = document.getElementById("enkaQuickChars");

    function renderEnkaChips() {
      const state = getState();
      const db = getDB();
      const enka = state?.enka;
      if (!enka) return;
      uidInput.value = enka.uid || "";
      badge.style.display = "inline-block";
      badge.textContent = `${enka.nickname} • AR ${enka.ar}`;
      quickBox.innerHTML = "";

      Object.values(enka.builds || {}).forEach((b) => {
        if (!db?.characters?.[b.id]) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "s";
        btn.style.fontSize = "12px";
        btn.textContent = `${b.name} (Lv.${b.level} C${b.constellation})`;
        btn.onclick = () => {
          const sel = document.getElementById("charSelect");
          if (sel) {
            sel.value = b.id;
            refreshCharUI();
          }
        };
        quickBox.append(btn);
      });
    }

    renderEnkaChips();

    document.getElementById("btnEnkaSync").onclick = async () => {
      feedback.style.color = "";
      feedback.textContent = "⏳ جاري الاتصال بـ Enka.Network وجلب بيانات العرض...";
      try {
        const res = await fetchEnkaByUid(uidInput.value);
        feedback.style.color = "var(--ok, #4ade80)";
        feedback.textContent = `✔ تمت المزامنة للاعب ${res.nickname} (AR ${res.ar}) — تم تحديث ${res.syncedList.length} شخصيات في الحاسبة.`;
        renderEnkaChips();
      } catch (err) {
        feedback.style.color = "var(--bad, #f87171)";
        feedback.textContent = `⚠️ ${err.message}`;
      }
    };

    document.getElementById("goodJsonFile").onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const res = importGoodJson(text);
        feedback.style.color = "var(--ok, #4ade80)";
        feedback.textContent = `✔ تم استيراد المخزون (${res.source}): ${res.matchedMats} مورد و ${res.matchedChars} شخصية.`;
      } catch (err) {
        feedback.style.color = "var(--bad, #f87171)";
        feedback.textContent = `⚠️ ${err.message}`;
      } finally {
        e.target.value = "";
      }
    };
  }

  function upgradeAiTabToGemini() {
    const aiPane = document.getElementById("p-ai");
    if (!aiPane) return;

    const titleEl = aiPane.querySelector("h2");
    if (titleEl) titleEl.textContent = "✨ مساعد الأكونت الذكي (Gemini)";

    const descEl = aiPane.querySelector(".mu");
    if (descEl) {
      descEl.textContent =
        "اكتب سؤالك واضغط الزرار: هينسخ ملخص أكونتك (بيلد Enka + النواقص + الدنجنز المتاحة النهاردة) ويفتحلك Gemini جاهز للصق.";
    }

    const sendBtn = document.getElementById("send");
    if (sendBtn) {
      sendBtn.textContent = "نسخ التقرير وفتح Gemini ↗";
      sendBtn.onclick = async () => {
        const qBox = document.getElementById("q");
        const fullPrompt = buildGeminiContextPrompt(qBox?.value?.trim());
        try {
          await navigator.clipboard.writeText(fullPrompt);
          sendBtn.textContent = "✔ تم نسخ التقرير! جاري فتح Gemini...";
        } catch {
          sendBtn.textContent = "جاري فتح Gemini...";
        }
        window.open("https://gemini.google.com/app", "_blank", "noopener");
        setTimeout(() => {
          sendBtn.textContent = "نسخ التقرير وفتح Gemini ↗";
        }, 2500);
      };
    }

    const askAiBuildBtn = document.getElementById("askAiBuild");
    if (askAiBuildBtn) {
      askAiBuildBtn.textContent = "✨ حلل البيلد والنواقص مع Gemini";
    }
  }

  window.AccountSync = {
    importGoodJson,
    fetchEnkaByUid,
    buildGeminiContextPrompt
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      injectAccountSyncUI();
      upgradeAiTabToGemini();
    });
  } else {
    injectAccountSyncUI();
    upgradeAiTabToGemini();
  }
})();
