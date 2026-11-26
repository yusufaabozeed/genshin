/**
 * daily-genshin-db | Account Sync (Enka.Network UID + GOOD JSON) & Gemini Assistant
 * ---------------------------------------------------------------------------------
 * ملف جاهز للرفع على GitHub وربطه مباشرة في index.html عبر:
 *   <script src="account-sync.js"></script>
 * قبل قفلة </body> مباشرة.
 *
 * يتكامل تلقائياً مع متغيرات ودوال index.html:
 *   S, DB, LVL_STEPS, DAYS_AR, NEWS, NEWSD, save(), onCharChange(), recalcMaterials(), lastMissingSummary
 */

(function () {
  "use strict";

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
    const steps = window.LVL_STEPS || [];
    if (!steps.length) return 0;
    const lvl = Number(level) || 1;
    const a = Number(asc) || 0;

    // مطابقة دقيقة للـ Ascension والـ Level Cap
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
    const db = window.DB || {};
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

  // اسم السلاح من Enka عبر textMapHash أو مطابقة الاسم الإنجليزي
  function resolveEnkaWeaponId(item, wepByNorm) {
    if (!item) return "";
    // محاولة المطابقة عبر اسم السلاح إذا كان متاحاً أو via itemId
    const candidates = [
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

    const state = window.S;
    if (!state) throw new Error("كائن الحالة S غير متاح في الصفحة.");
    state.inv = state.inv || {};
    state.bCfg = state.bCfg || {};

    const { charByNorm, wepByNorm, matByNorm } = buildIndexes();
    let matchedMats = 0;

    // 1) تحديث المخزون S.inv مباشرة
    if (data.materials && typeof data.materials === "object") {
      for (const [goodKey, qty] of Object.entries(data.materials)) {
        const hit = matByNorm.get(normKey(goodKey));
        const id = hit ? hit.id : goodKey.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
        state.inv[id] = Math.max(0, Math.floor(Number(qty) || 0));
        if (hit) matchedMats++;
      }
    }

    // 2) تحديث مستويات وتالنت الشخصيات في S.bCfg
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

    // 3) ربط الأسلحة المجهزة من GOOD JSON بالشخصيات
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

    if (typeof window.save === "function") window.save();
    if (typeof window.onCharChange === "function") window.onCharChange();
    else if (typeof window.recalcMaterials === "function") window.recalcMaterials();

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
      (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
    ];

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
        break;
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

    const state = window.S;
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
      const depotCharId = TRAVELER_DEPOT_MAP[av.skillDepotId];
      const charHit = charByNorm.get(normKey(avatarId)) || (depotCharId ? charByNorm.get(depotCharId) : null);

      const level = Number(av.propMap?.["4001"]?.val || 1);
      const asc = Number(av.propMap?.["1002"]?.val || 0);
      const constellation = Array.isArray(av.talentIdList) ? av.talentIdList.length : 0;

      // استخراج التالنت الأساسي (بدون بونص C3/C5 حتى لا يربك الحاسبة)
      const baseSkills = Object.values(av.skillLevelMap || {});
      const tN = Math.min(10, Math.max(1, Number(baseSkills[0]) || 1));
      const tE = Math.min(10, Math.max(1, Number(baseSkills[1]) || 1));
      const tQ = Math.min(10, Math.max(1, Number(baseSkills[2]) || 1));

      let weaponInfo = null;
      const artifactsInfo = [];

      for (const eq of av.equipList || []) {
        if (eq.flat?.itemType === "ITEM_WEAPON") {
          const wId = resolveEnkaWeaponId(eq, wepByNorm);
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
      const charName = charHit ? (charHit.arName || charHit.name) : `Avatar #${avatarId}`;

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

    if (typeof window.save === "function") window.save();
    if (typeof window.onCharChange === "function") window.onCharChange();
    else if (typeof window.recalcMaterials === "function") window.recalcMaterials();

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
    const state = window.S || {};
    const db = window.DB || {};
    const charId = document.getElementById("charSelect")?.value || state.lastChar || "";
    const ch = db.characters?.[charId];
    const enkaBuild = state.enka?.builds?.[charId];

    const todayEn = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const todayAr = (window.DAYS_AR && window.DAYS_AR[todayEn]) || todayEn;

    const lines = [
      "أنت مساعد خبير في لعبة Genshin Impact تتحدث باللهجة المصرية بأسلوب عملي ومباشر.",
      `اليوم هو: ${todayAr} (${todayEn}).`
    ];

    if (Array.isArray(window.NEWS) && window.NEWS.length) {
      lines.push(`أخبار الباتش الحالية (${window.NEWSD || ""}): ${window.NEWS.join(" | ")}`);
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
      lines.push(
        `\n--- بيانات الشخصية الحالية من Enka.Network (UID: ${state.enka.uid}) ---`,
        `المستوى: Lv.${enkaBuild.level} (C${enkaBuild.constellation}) | التالنت: ${enkaBuild.talents.normal}/${enkaBuild.talents.skill}/${enkaBuild.talents.burst}`,
        `عدد قطع الآرتيفاكتس المجهزة: ${enkaBuild.artifacts.length} قطع.`
      );
    }

    if (typeof window.lastMissingSummary === "string" && window.lastMissingSummary.trim()) {
      lines.push(`\n--- ملخص حاسبة الموارد الناقصة ---\n${window.lastMissingSummary}`);
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
      const enka = window.S?.enka;
      if (!enka) return;
      uidInput.value = enka.uid || "";
      badge.style.display = "inline-block";
      badge.textContent = `${enka.nickname} • AR ${enka.ar}`;
      quickBox.innerHTML = "";

      Object.values(enka.builds || {}).forEach((b) => {
        if (!window.DB?.characters?.[b.id]) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "s";
        btn.style.fontSize = "12px";
        btn.textContent = `${b.name} (Lv.${b.level} C${b.constellation})`;
        btn.onclick = () => {
          const sel = document.getElementById("charSelect");
          if (sel) {
            sel.value = b.id;
            if (typeof window.onCharChange === "function") window.onCharChange();
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

    // تحديث زر "اسأل AI عن البيلد" في الحاسبة إن وجد
    const askAiBuildBtn = document.getElementById("askAiBuild");
    if (askAiBuildBtn) {
      askAiBuildBtn.textContent = "✨ حلل البيلد والنواقص مع Gemini";
    }
  }

  // التصدير العالمي للاستخدام البرمجي إذا لزم
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
