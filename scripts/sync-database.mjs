import fs from "node:fs";
import genshindb from "genshin-db";

const slug = (str) =>
  String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const overrides = fs.existsSync("./data/builds-overrides.json")
  ? JSON.parse(fs.readFileSync("./data/builds-overrides.json", "utf8"))
  : {};

// Map English / Arabic names if available in genshin-db
const arChars = {};
try {
  // Check if Arabic is supported or fallback to English
  const names = genshindb.characters("names", { matchCategories: true }) || [];
  for (const n of names) {
    const c = genshindb.characters(n);
    if (c) arChars[slug(c.name)] = c.name;
  }
} catch {}

// 1. Sync Materials
const materialsDb = {
  mora: { id: "mora", name: "Mora", arName: "مورا", rarity: 3, category: "currency" },
  heros_wit: { id: "heros_wit", name: "Hero's Wit", arName: "كتاب خبرة (بنفسجي)", rarity: 4, category: "exp" },
  mystic_enhancement_ore: { id: "mystic_enhancement_ore", name: "Mystic Enhancement Ore", arName: "كريستال تطوير الأسلحة", rarity: 3, category: "weapon_exp" },
  crown_of_insight: { id: "crown_of_insight", name: "Crown of Insight", arName: "تاج التالنت (Crown)", rarity: 5, category: "crown" }
};

const allMatNames = genshindb.materials("names", { matchCategories: true }) || [];
for (const mName of allMatNames) {
  const m = genshindb.materials(mName);
  if (!m) continue;
  const id = slug(m.name);
  materialsDb[id] = {
    id,
    name: m.name,
    rarity: Number(m.rarity) || 1,
    category: m.category || m.typeText || "material",
    days: m.daysOfWeek || [],
    domain: m.dropDomainName || ""
  };
}

// 2. Sync Artifacts
const artifactsDb = {};
const allArtNames = genshindb.artifacts("names", { matchCategories: true }) || [];
for (const aName of allArtNames) {
  const a = genshindb.artifacts(aName);
  if (!a || !a.effect4Pc) continue;
  const id = slug(a.name);
  artifactsDb[id] = {
    id,
    name: a.name,
    rarityList: a.rarityList || [4, 5],
    twoPiece: a.effect2Pc || "",
    fourPiece: a.effect4Pc || ""
  };
}

// 3. Sync Weapons
const weaponsDb = {};
const allWeaponNames = genshindb.weapons("names", { matchCategories: true }) || [];
for (const wName of allWeaponNames) {
  const w = genshindb.weapons(wName);
  if (!w || Number(w.rarity) < 3) continue;
  const id = slug(w.name);

  // Extract ascension materials from ascend1..ascend6
  const c = w.costs || {};
  const a1 = c.ascend1 || [];
  const a2 = c.ascend2 || [];
  const a4 = c.ascend4 || [];
  const a6 = c.ascend6 || [];

  const nonMora = (arr) => arr.filter((x) => slug(x.name) !== "mora");
  const d1 = nonMora(a1)[0]?.name || "";
  const d2 = nonMora(a2)[0]?.name || "";
  const d3 = nonMora(a4)[0]?.name || "";
  const d4 = nonMora(a6)[0]?.name || "";

  const e1 = nonMora(a1)[1]?.name || "";
  const e2 = nonMora(a4)[1]?.name || "";
  const e3 = nonMora(a6)[1]?.name || "";

  const m1 = nonMora(a1)[2]?.name || "";
  const m2 = nonMora(a4)[2]?.name || "";
  const m3 = nonMora(a6)[2]?.name || "";

  weaponsDb[id] = {
    id,
    name: w.name,
    rarity: Number(w.rarity) || 4,
    type: w.weaponText || w.weaponType || "Sword",
    substat: w.mainStatText || "",
    substatVal90: w.baseStatText || "",
    effectName: w.effectName || "",
    tiers: {
      domain: [slug(d1), slug(d2), slug(d3), slug(d4)].filter(Boolean),
      elite: [slug(e1), slug(e2), slug(e3)].filter(Boolean),
      common: [slug(m1), slug(m2), slug(m3)].filter(Boolean)
    }
  };
}

// Helper: auto-generate smart weapon & artifact recommendations when no manual override exists
function generateAutoBuild(charObj, weaponsMap, artifactsMap) {
  const sameTypeWeapons = Object.values(weaponsMap).filter(
    (w) => w.type.toLowerCase() === charObj.weaponType.toLowerCase()
  );
  const sub = (charObj.substat || "").toLowerCase();
  const preferredSub = sub.includes("crit")
    ? ["CRIT Rate", "CRIT DMG", "ATK%"]
    : sub.includes("energy")
    ? ["Energy Recharge", "CRIT Rate", "Elemental Mastery"]
    : sub.includes("elemental mastery")
    ? ["Elemental Mastery", "Energy Recharge"]
    : sub.includes("hp")
    ? ["HP%", "Energy Recharge", "CRIT Rate"]
    : sub.includes("def")
    ? ["DEF%", "Energy Recharge"]
    : ["CRIT Rate", "CRIT DMG", "ATK%", "Energy Recharge"];

  const scoreWeapon = (w) => {
    let s = w.rarity * 10;
    if (preferredSub.some((p) => w.substat.toLowerCase().includes(p.toLowerCase()))) s += 15;
    if (w.substat.toLowerCase().includes("crit")) s += 8;
    return s;
  };

  const topWeapons = sameTypeWeapons
    .sort((a, b) => scoreWeapon(b) - scoreWeapon(a))
    .slice(0, 4)
    .map((w, idx) => ({
      weaponId: w.id,
      tag: idx === 0 ? `أقوى خيار (${w.rarity}★)` : `${w.rarity}★ مناسب (${w.substat || "DPS"})`
    }));

  const elemArtMap = {
    Pyro: ["crimson_witch_of_flames", "marechaussee_hunter", "emblem_of_severed_fate"],
    Hydro: ["golden_troupe", "heart_of_depth", "emblem_of_severed_fate"],
    Electro: ["emblem_of_severed_fate", "thundering_fury", "gilded_dreams"],
    Cryo: ["blizzard_strayer", "marechaussee_hunter", "emblem_of_severed_fate"],
    Dendro: ["deepwood_memories", "gilded_dreams"],
    Anemo: ["viridescent_venerer", "desert_pavilion_chronicle"],
    Geo: ["scroll_of_the_hero_of_cinder_city", "golden_troupe", "husk_of_opulent_dreams"]
  };

  const candidates = (elemArtMap[charObj.element] || ["emblem_of_severed_fate", "noblesse_oblige"])
    .filter((id) => artifactsMap[id]);

  const recommendedArtifacts = candidates.slice(0, 2).map((setId, idx) => ({
    sets: [{ setId, pieces: 4 }],
    note: idx === 0 ? `طقم أساسي مناسب لعنصر ${charObj.element}` : "بديل قوي حسب دور الشخصية في الفريق"
  }));

  return {
    talentPriority: ["skill", "burst", "normal"],
    recommendedWeapons: topWeapons,
    recommendedArtifacts,
    artifactStats: {
      sands: sub.includes("hp") ? ["HP%", "Energy Recharge"] : sub.includes("def") ? ["DEF%", "Energy Recharge"] : sub.includes("mastery") ? ["Elemental Mastery", "Energy Recharge"] : ["ATK%", "Energy Recharge"],
      goblet: [`${charObj.element} DMG Bonus`, "Elemental Mastery"],
      circlet: ["CRIT Rate", "CRIT DMG"],
      substats: ["CRIT Rate / DMG", "Energy Recharge", sub.includes("hp") ? "HP%" : sub.includes("def") ? "DEF%" : "ATK% / EM"],
      breakpoints: "CRIT Ratio 1:2 | ER: 130%-180% حسب الفريق"
    }
  };
}

// 4. Sync All Characters
const charactersDb = {};
const allCharNames = genshindb.characters("names", { matchCategories: true }) || [];
for (const cName of allCharNames) {
  const c = genshindb.characters(cName);
  if (!c) continue;
  const id = slug(c.name);
  const t = genshindb.talents(cName);

  const costs = c.costs || {};
  const a1 = (costs.ascend1 || []).filter((x) => slug(x.name) !== "mora");
  const a2 = (costs.ascend2 || []).filter((x) => slug(x.name) !== "mora");
  const a4 = (costs.ascend4 || []).filter((x) => slug(x.name) !== "mora");
  const a6 = (costs.ascend6 || []).filter((x) => slug(x.name) !== "mora");

  // Gems: a1[0] (T1), a2[0] (T2), a4[0] (T3), a6[0] (T4)
  const gems = [slug(a1[0]?.name), slug(a2[0]?.name), slug(a4[0]?.name), slug(a6[0]?.name)].filter(Boolean);
  // Boss mat: a2[1]
  const boss = slug(a2[1]?.name || "");
  // Local specialty: a1[1]
  const specialty = slug(a1[1]?.name || "");
  // Common enemy drops: a1[2] (T1), a4[3] (T2), a6[3] (T3)
  const common = [slug(a1[2]?.name), slug(a4[3]?.name), slug(a6[3]?.name)].filter(Boolean);

  // Talent costs: lvl2 (T1 book), lvl3 (T2 book), lvl7 (T3 book + weekly boss)
  const tCosts = t?.costs || {};
  const l2 = (tCosts.lvl2 || []).filter((x) => slug(x.name) !== "mora");
  const l3 = (tCosts.lvl3 || []).filter((x) => slug(x.name) !== "mora");
  const l7 = (tCosts.lvl7 || []).filter((x) => slug(x.name) !== "mora");

  const books = [slug(l2[0]?.name), slug(l3[0]?.name), slug(l7[0]?.name)].filter(Boolean);
  const weeklyBoss = slug(l7[2]?.name || "");

  const baseChar = {
    id,
    name: c.name,
    arName: overrides[id]?.arName || c.name,
    rarity: Number(c.rarity) || 5,
    element: c.elementText || "None",
    weaponType: c.weaponText || "Sword",
    substat: c.substatText || "",
    tiers: {
      gems,
      boss,
      specialty,
      common,
      books,
      weeklyBoss
    }
  };

  const autoBuild = generateAutoBuild(baseChar, weaponsDb, artifactsDb);
  const custom = overrides[id] || {};

  charactersDb[id] = {
    ...baseChar,
    talentPriority: custom.talentPriority || autoBuild.talentPriority,
    recommendedWeapons: custom.recommendedWeapons || autoBuild.recommendedWeapons,
    recommendedArtifacts: custom.recommendedArtifacts || autoBuild.recommendedArtifacts,
    artifactStats: custom.artifactStats || autoBuild.artifactStats
  };
}

fs.mkdirSync("./data", { recursive: true });
fs.writeFileSync("./data/materials.json", JSON.stringify(materialsDb, null, 2));
fs.writeFileSync("./data/artifacts.json", JSON.stringify(artifactsDb, null, 2));
fs.writeFileSync("./data/weapons.json", JSON.stringify(weaponsDb, null, 2));
fs.writeFileSync("./data/characters.json", JSON.stringify(charactersDb, null, 2));

console.log(
  `Synced ${Object.keys(charactersDb).length} characters, ` +
  `${Object.keys(weaponsDb).length} weapons, ` +
  `${Object.keys(artifactsDb).length} artifact sets, ` +
  `${Object.keys(materialsDb).length} materials.`
);
