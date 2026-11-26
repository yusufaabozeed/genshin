/**
 * daily-genshin-db | Builds Overrides Updater & Validator
 * -------------------------------------------------------
 * ملف Node.js جاهز للرفع في مجلد scripts/ أو المجلد الرئيسي على GitHub.
 *
 * طريقة التشغيل:
 *   node update-builds-overrides.mjs
 *   node update-builds-overrides.mjs --sync-chars   (يحدّث builds-overrides.json ويحقن التعديلات في characters.json فوراً)
 */

import fs from "node:fs";
import path from "node:path";

const DATA_DIR = fs.existsSync("./data/builds-overrides.json") ? "./data" : ".";

function readJson(filename, fallback = {}) {
  const fullPath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fullPath)) return fallback;
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function writeJson(filename, obj) {
  const fullPath = path.join(DATA_DIR, filename);
  fs.writeFileSync(fullPath, JSON.stringify(obj, null, 2) + "\n", "utf8");
  console.log(`✔ Updated ${fullPath}`);
}

const NEW_META_BUILDS = {
  "citlali": {
    "arName": "سيتلالي",
    "talentPriority": [
      "skill",
      "burst",
      "normal"
    ],
    "recommendedWeapons": [
      {
        "weaponId": "starcaller_s_watch",
        "tag": "Best in Slot (5★)"
      },
      {
        "weaponId": "sacrificial_fragments",
        "tag": "أفضل 4★ (EM + Reset)"
      },
      {
        "weaponId": "thrilling_tales_of_dragon_slayers",
        "tag": "بف هجوم +48% (3★ F2P)"
      },
      {
        "weaponId": "favonius_codex",
        "tag": "طاقة للفريق (ER)"
      }
    ],
    "recommendedArtifacts": [
      {
        "sets": [
          {
            "setId": "scroll_of_the_hero_of_cinder_city",
            "pieces": 4
          }
        ],
        "note": "الأفضل بلا منازع: يمنح الفريق +40% Elemental DMG Bonus بعد تفاعل Nightsoul."
      },
      {
        "sets": [
          {
            "setId": "tenacity_of_the_millelith",
            "pieces": 4
          }
        ],
        "note": "خيار داعم بديل يزيد قوة الدرع وهجوم الفريق +20%."
      }
    ],
    "artifactStats": {
      "sands": [
        "Elemental Mastery",
        "Energy Recharge"
      ],
      "goblet": [
        "Elemental Mastery"
      ],
      "circlet": [
        "Elemental Mastery",
        "CRIT Rate"
      ],
      "substats": [
        "Elemental Mastery",
        "Energy Recharge",
        "CRIT Rate"
      ],
      "breakpoints": "EM: 850-1,000+ (لأقوى درع) | ER: 160%-185%"
    }
  },
  "kinich": {
    "arName": "كينيتش",
    "talentPriority": [
      "skill",
      "burst",
      "normal"
    ],
    "recommendedWeapons": [
      {
        "weaponId": "fang_of_the_mountain_king",
        "tag": "Best in Slot (5★)"
      },
      {
        "weaponId": "beacon_of_the_reed_sea",
        "tag": "5★ ممتاز (CRIT Rate)"
      },
      {
        "weaponId": "serpent_spine",
        "tag": "أفضل 4★ (Battle Pass)"
      },
      {
        "weaponId": "earth_shaker",
        "tag": "أفضل F2P (حدادة ناتلان)"
      }
    ],
    "recommendedArtifacts": [
      {
        "sets": [
          {
            "setId": "obsidian_codex",
            "pieces": 4
          }
        ],
        "note": "الأفضل بلا منازع: يمنح +40% CRIT Rate طوال فترة Nightsoul."
      },
      {
        "sets": [
          {
            "setId": "unfinished_reverie",
            "pieces": 4
          }
        ],
        "note": "خيار قوي جداً في فرق Burning."
      }
    ],
    "artifactStats": {
      "sands": [
        "ATK%"
      ],
      "goblet": [
        "Dendro DMG Bonus"
      ],
      "circlet": [
        "CRIT DMG",
        "CRIT Rate"
      ],
      "substats": [
        "CRIT DMG",
        "CRIT Rate",
        "ATK%",
        "Energy Recharge"
      ],
      "breakpoints": "CRIT Rate: 50%-60% (يصل 90%-100% مع Obsidian) | CRIT DMG: 200%+ | ATK: 2,000+"
    }
  },
  "mualani": {
    "arName": "موالاني",
    "talentPriority": [
      "skill",
      "burst",
      "normal"
    ],
    "recommendedWeapons": [
      {
        "weaponId": "surf_s_up",
        "tag": "Best in Slot (5★)"
      },
      {
        "weaponId": "a_thousand_floating_dreams",
        "tag": "5★ ممتاز (EM)"
      },
      {
        "weaponId": "sacrificial_jade",
        "tag": "أفضل 4★ (Battle Pass)"
      },
      {
        "weaponId": "ring_of_yaxche",
        "tag": "أفضل F2P (حدادة ناتلان)"
      }
    ],
    "recommendedArtifacts": [
      {
        "sets": [
          {
            "setId": "obsidian_codex",
            "pieces": 4
          }
        ],
        "note": "الأفضل بلا منازع: +40% CRIT Rate و +15% ضرر."
      },
      {
        "sets": [
          {
            "setId": "heart_of_depth",
            "pieces": 4
          }
        ],
        "note": "خيار انتقالي مناسب لزيادة ضرر الهجمات العادية بعد الـ Skill."
      }
    ],
    "artifactStats": {
      "sands": [
        "HP%",
        "Elemental Mastery"
      ],
      "goblet": [
        "Hydro DMG Bonus",
        "HP%"
      ],
      "circlet": [
        "CRIT DMG",
        "HP%"
      ],
      "substats": [
        "CRIT DMG",
        "CRIT Rate",
        "HP%",
        "Elemental Mastery"
      ],
      "breakpoints": "HP: 35,000-40,000 | EM: 150-250 (لـ Vaporize) | CRIT Rate: 50%-60% قبل بونص الطقم"
    }
  },
  "chasca": {
    "arName": "تشاسكا",
    "talentPriority": [
      "skill",
      "burst",
      "normal"
    ],
    "recommendedWeapons": [
      {
        "weaponId": "astral_vulture_s_crimson_plumage",
        "tag": "Best in Slot (5★)"
      },
      {
        "weaponId": "aqua_simulacra",
        "tag": "5★ ممتاز (CRIT DMG)"
      },
      {
        "weaponId": "the_first_great_magic",
        "tag": "5★ قوي جداً"
      },
      {
        "weaponId": "chain_breaker",
        "tag": "أفضل 4★ F2P (حدادة ناتلان)"
      }
    ],
    "recommendedArtifacts": [
      {
        "sets": [
          {
            "setId": "obsidian_codex",
            "pieces": 4
          }
        ],
        "note": "الأفضل بلا منازع: يرفع CRIT Rate بنسبة 40% أثناء الطيران."
      }
    ],
    "artifactStats": {
      "sands": [
        "ATK%"
      ],
      "goblet": [
        "ATK%"
      ],
      "circlet": [
        "CRIT DMG"
      ],
      "substats": [
        "CRIT DMG",
        "CRIT Rate",
        "ATK%",
        "Elemental Mastery"
      ],
      "breakpoints": "ملاحظة: يفضّل Goblet ATK% لأن رصاصاتها تتحول لعناصر الفريق (Pyro/Hydro/Cryo/Electro)."
    }
  },
  "clorinde": {
    "arName": "كلوريند",
    "talentPriority": [
      "skill",
      "burst",
      "normal"
    ],
    "recommendedWeapons": [
      {
        "weaponId": "absolution",
        "tag": "Best in Slot (5★)"
      },
      {
        "weaponId": "mistsplitter_reforged",
        "tag": "5★ ممتاز"
      },
      {
        "weaponId": "the_black_sword",
        "tag": "أفضل 4★ (Battle Pass)"
      },
      {
        "weaponId": "finale_of_the_deep",
        "tag": "أفضل F2P (حدادة فونتين)"
      }
    ],
    "recommendedArtifacts": [
      {
        "sets": [
          {
            "setId": "fragment_of_harmonic_whimsy",
            "pieces": 4
          }
        ],
        "note": "الأفضل بلا منازع: +54% ضرر كامل مع تغير Bond of Life."
      },
      {
        "sets": [
          {
            "setId": "thundering_fury",
            "pieces": 4
          }
        ],
        "note": "ممتاز في فرق Aggravate لتقليل وقت انتظار الـ Skill."
      }
    ],
    "artifactStats": {
      "sands": [
        "ATK%"
      ],
      "goblet": [
        "Electro DMG Bonus"
      ],
      "circlet": [
        "CRIT DMG",
        "CRIT Rate"
      ],
      "substats": [
        "CRIT Rate / DMG",
        "ATK%",
        "Elemental Mastery"
      ],
      "breakpoints": "CRIT Rate: 70%-80% (تحصل +20% من الباسيف) | CRIT DMG: 200%+ | ATK: 2,000+"
    }
  },
  "navia": {
    "arName": "نافيا",
    "talentPriority": [
      "skill",
      "normal",
      "burst"
    ],
    "recommendedWeapons": [
      {
        "weaponId": "verdict",
        "tag": "Best in Slot (5★)"
      },
      {
        "weaponId": "serpent_spine",
        "tag": "أفضل 4★ (ينافس الـ 5★)"
      },
      {
        "weaponId": "ultimate_overlord_s_mega_magic_sword",
        "tag": "أفضل 4★ (Event)"
      },
      {
        "weaponId": "tidal_shadow",
        "tag": "أفضل F2P (حدادة فونتين)"
      }
    ],
    "recommendedArtifacts": [
      {
        "sets": [
          {
            "setId": "nighttime_whispers_in_the_echoing_woods",
            "pieces": 4
          }
        ],
        "note": "طقمها المخصص: +50% Geo DMG Bonus مع درع Crystallize."
      },
      {
        "sets": [
          {
            "setId": "marechaussee_hunter",
            "pieces": 4
          }
        ],
        "note": "ممتاز فقط عند اللعب مع فورينا."
      }
    ],
    "artifactStats": {
      "sands": [
        "ATK%"
      ],
      "goblet": [
        "Geo DMG Bonus"
      ],
      "circlet": [
        "CRIT Rate",
        "CRIT DMG"
      ],
      "substats": [
        "CRIT Rate / DMG",
        "ATK%",
        "Energy Recharge"
      ],
      "breakpoints": "CRIT Rate: 80%-90% (لضمان كريت طلقة الـ Skill) | ER: 120%-135%"
    }
  },
  "alhaitham": {
    "arName": "الهيثم",
    "talentPriority": [
      "skill",
      "normal",
      "burst"
    ],
    "recommendedWeapons": [
      {
        "weaponId": "light_of_foliar_incision",
        "tag": "Best in Slot (5★)"
      },
      {
        "weaponId": "primordial_jade_cutter",
        "tag": "5★ ممتاز (CRIT Rate)"
      },
      {
        "weaponId": "wolf_fang",
        "tag": "أفضل 4★ (Battle Pass)"
      },
      {
        "weaponId": "iron_sting",
        "tag": "أفضل F2P (حدادة)"
      }
    ],
    "recommendedArtifacts": [
      {
        "sets": [
          {
            "setId": "gilded_dreams",
            "pieces": 4
          }
        ],
        "note": "الأفضل في أغلب الفرق لزيادة الـ EM والهجوم."
      },
      {
        "sets": [
          {
            "setId": "deepwood_memories",
            "pieces": 4
          }
        ],
        "note": "استخدمه إذا لم يكن هناك شخصية أخرى في الفريق تحمله."
      }
    ],
    "artifactStats": {
      "sands": [
        "Elemental Mastery"
      ],
      "goblet": [
        "Dendro DMG Bonus"
      ],
      "circlet": [
        "CRIT Rate",
        "CRIT DMG"
      ],
      "substats": [
        "CRIT Rate / DMG",
        "Elemental Mastery",
        "Energy Recharge"
      ],
      "breakpoints": "EM: 350-450 | CRIT: 75/180+ | ER: 125%-140%"
    }
  },
  "yelan": {
    "arName": "ييلان",
    "talentPriority": [
      "burst",
      "skill",
      "normal"
    ],
    "recommendedWeapons": [
      {
        "weaponId": "aqua_simulacra",
        "tag": "Best in Slot (5★)"
      },
      {
        "weaponId": "elegy_for_the_end",
        "tag": "أفضل 5★ داعم للفريق"
      },
      {
        "weaponId": "favonius_warbow",
        "tag": "أفضل 4★ بلا منازع (ER)"
      }
    ],
    "recommendedArtifacts": [
      {
        "sets": [
          {
            "setId": "emblem_of_severed_fate",
            "pieces": 4
          }
        ],
        "note": "الأفضل بلا منازع: يحول الـ ER إلى ضرر Burst ضخم."
      }
    ],
    "artifactStats": {
      "sands": [
        "HP%",
        "Energy Recharge"
      ],
      "goblet": [
        "Hydro DMG Bonus"
      ],
      "circlet": [
        "CRIT Rate",
        "CRIT DMG"
      ],
      "substats": [
        "Energy Recharge",
        "CRIT Rate / DMG",
        "HP%"
      ],
      "breakpoints": "HP: 30,000-35,000 | ER: 180%-200% (Solo Hydro) أو 145%-165% (Double Hydro)"
    }
  },
  "zhongli": {
    "arName": "جونغلي",
    "talentPriority": [
      "skill",
      "burst",
      "normal"
    ],
    "recommendedWeapons": [
      {
        "weaponId": "black_tassel",
        "tag": "أقوى درع في اللعبة (3★ F2P)"
      },
      {
        "weaponId": "favonius_lance",
        "tag": "أفضل سلاح داعم لطاقة الفريق"
      },
      {
        "weaponId": "staff_of_homa",
        "tag": "خيار Sub-DPS (5★)"
      }
    ],
    "recommendedArtifacts": [
      {
        "sets": [
          {
            "setId": "tenacity_of_the_millelith",
            "pieces": 4
          }
        ],
        "note": "الأفضل للدعم: يقوي الدرع +30% ويرفع هجوم الفريق +20%."
      },
      {
        "sets": [
          {
            "setId": "archaic_petra",
            "pieces": 4
          }
        ],
        "note": "يرفع ضرر عنصر الفريق الأساسي +35% عند التقاط الكريستالة."
      }
    ],
    "artifactStats": {
      "sands": [
        "HP%"
      ],
      "goblet": [
        "HP%"
      ],
      "circlet": [
        "HP%",
        "CRIT Rate"
      ],
      "substats": [
        "HP%",
        "CRIT Rate (مع Favonius)",
        "Energy Recharge"
      ],
      "breakpoints": "HP: 50,000-55,000+ (بيلد الدرع الكامل)"
    }
  },
  "xiao": {
    "arName": "شياو",
    "talentPriority": [
      "normal",
      "burst",
      "skill"
    ],
    "recommendedWeapons": [
      {
        "weaponId": "primordial_jade_winged_spear",
        "tag": "Best in Slot (5★)"
      },
      {
        "weaponId": "staff_of_homa",
        "tag": "5★ ممتاز (CRIT DMG)"
      },
      {
        "weaponId": "deathmatch",
        "tag": "أفضل 4★ (Battle Pass)"
      },
      {
        "weaponId": "blackcliff_pole",
        "tag": "أفضل F2P (متجر Starglitter)"
      }
    ],
    "recommendedArtifacts": [
      {
        "sets": [
          {
            "setId": "vermillion_hereafter",
            "pieces": 4
          }
        ],
        "note": "طقم شياو المخصص لزيادة الـ ATK أثناء الـ Burst."
      },
      {
        "sets": [
          {
            "setId": "marechaussee_hunter",
            "pieces": 4
          }
        ],
        "note": "ينافس Vermillion بقوة خاصة مع فورينا وفاروزان."
      }
    ],
    "artifactStats": {
      "sands": [
        "ATK%"
      ],
      "goblet": [
        "Anemo DMG Bonus",
        "ATK%"
      ],
      "circlet": [
        "CRIT Rate",
        "CRIT DMG"
      ],
      "substats": [
        "CRIT Rate / DMG",
        "ATK%",
        "Energy Recharge"
      ],
      "breakpoints": "CRIT: 80/190+ | ATK: 2,100+ | ER: 120%-135%"
    }
  },
  "wanderer": {
    "arName": "واندرر (سكاراموش)",
    "talentPriority": [
      "normal",
      "skill",
      "burst"
    ],
    "recommendedWeapons": [
      {
        "weaponId": "tulaytullah_s_remembrance",
        "tag": "Best in Slot (5★)"
      },
      {
        "weaponId": "lost_prayer_to_the_sacred_winds",
        "tag": "5★ ممتاز (CRIT Rate)"
      },
      {
        "weaponId": "the_widsith",
        "tag": "أفضل 4★"
      }
    ],
    "recommendedArtifacts": [
      {
        "sets": [
          {
            "setId": "desert_pavilion_chronicle",
            "pieces": 4
          }
        ],
        "note": "الأفضل: يرفع سرعة الهجوم +10% وضرر Normal/Charged +40%."
      },
      {
        "sets": [
          {
            "setId": "shimenawa_s_reminiscence",
            "pieces": 4
          }
        ],
        "note": "بديل قوي جداً في الدومين المشترك مع Emblem."
      }
    ],
    "artifactStats": {
      "sands": [
        "ATK%"
      ],
      "goblet": [
        "Anemo DMG Bonus"
      ],
      "circlet": [
        "CRIT Rate",
        "CRIT DMG"
      ],
      "substats": [
        "CRIT Rate / DMG",
        "ATK%"
      ],
      "breakpoints": "CRIT: 75/185+ | ATK: 2,000+"
    }
  },
  "lyney": {
    "arName": "ليني",
    "talentPriority": [
      "normal",
      "burst",
      "skill"
    ],
    "recommendedWeapons": [
      {
        "weaponId": "the_first_great_magic",
        "tag": "Best in Slot (5★)"
      },
      {
        "weaponId": "aqua_simulacra",
        "tag": "5★ ممتاز"
      },
      {
        "weaponId": "song_of_stillness",
        "tag": "أفضل 4★ F2P (حدادة فونتين)"
      }
    ],
    "recommendedArtifacts": [
      {
        "sets": [
          {
            "setId": "marechaussee_hunter",
            "pieces": 4
          }
        ],
        "note": "الأفضل بلا منازع: +36% CRIT Rate تلقائياً."
      }
    ],
    "artifactStats": {
      "sands": [
        "ATK%"
      ],
      "goblet": [
        "Pyro DMG Bonus"
      ],
      "circlet": [
        "CRIT DMG"
      ],
      "substats": [
        "CRIT DMG",
        "CRIT Rate",
        "ATK%"
      ],
      "breakpoints": "CRIT Rate: 55%-64% (ليصل 91%-100%) | CRIT DMG: 210%+"
    }
  },
  "wriothesley": {
    "arName": "ريوثيسلي",
    "talentPriority": [
      "normal",
      "skill",
      "burst"
    ],
    "recommendedWeapons": [
      {
        "weaponId": "cashflow_supervision",
        "tag": "Best in Slot (5★)"
      },
      {
        "weaponId": "tulaytullah_s_remembrance",
        "tag": "5★ ممتاز"
      },
      {
        "weaponId": "flowing_purity",
        "tag": "أفضل 4★ F2P (حدادة فونتين)"
      },
      {
        "weaponId": "the_widsith",
        "tag": "خيار 4★ قوي"
      }
    ],
    "recommendedArtifacts": [
      {
        "sets": [
          {
            "setId": "marechaussee_hunter",
            "pieces": 4
          }
        ],
        "note": "الأفضل بلا منازع: +36% CRIT Rate و +15% Normal/Charged DMG."
      }
    ],
    "artifactStats": {
      "sands": [
        "ATK%",
        "Elemental Mastery"
      ],
      "goblet": [
        "Cryo DMG Bonus"
      ],
      "circlet": [
        "CRIT DMG"
      ],
      "substats": [
        "CRIT DMG",
        "CRIT Rate",
        "ATK%",
        "Elemental Mastery"
      ],
      "breakpoints": "CRIT Rate: 50%-60% قبل بونص الطقم | EM: 120-200 في فرق Melt"
    }
  },
  "shenhe": {
    "arName": "شينهي",
    "talentPriority": [
      "skill",
      "burst",
      "normal"
    ],
    "recommendedWeapons": [
      {
        "weaponId": "calamity_queller",
        "tag": "Best in Slot (5★)"
      },
      {
        "weaponId": "engulfing_lightning",
        "tag": "5★ ممتاز (ER + ATK)"
      },
      {
        "weaponId": "favonius_lance",
        "tag": "أفضل 4★ بلا منازع"
      }
    ],
    "recommendedArtifacts": [
      {
        "sets": [
          {
            "setId": "gladiator_s_finale",
            "pieces": 2
          },
          {
            "setId": "shimenawa_s_reminiscence",
            "pieces": 2
          }
        ],
        "note": "الأعلى في الهجوم (+36% ATK) لتعظيم بف Icy Quills."
      },
      {
        "sets": [
          {
            "setId": "noblesse_oblige",
            "pieces": 4
          }
        ],
        "note": "خيار داعم يضيف +20% ATK للفريق."
      }
    ],
    "artifactStats": {
      "sands": [
        "ATK%",
        "Energy Recharge"
      ],
      "goblet": [
        "ATK%"
      ],
      "circlet": [
        "ATK%"
      ],
      "substats": [
        "ATK%",
        "Energy Recharge",
        "CRIT Rate (مع Favonius)"
      ],
      "breakpoints": "ATK: 3,400-4,000+ | ER: 175%-195%"
    }
  },
  "sangonomiya_kokomi": {
    "arName": "كوكومي",
    "talentPriority": [
      "skill",
      "burst",
      "normal"
    ],
    "recommendedWeapons": [
      {
        "weaponId": "thrilling_tales_of_dragon_slayers",
        "tag": "أفضل سلاح داعم للفريق (3★ F2P)"
      },
      {
        "weaponId": "prototype_amber",
        "tag": "أفضل F2P للهيل والطاقة"
      },
      {
        "weaponId": "everlasting_moonglow",
        "tag": "سلاحها الخاص (5★)"
      }
    ],
    "recommendedArtifacts": [
      {
        "sets": [
          {
            "setId": "tenacity_of_the_millelith",
            "pieces": 4
          }
        ],
        "note": "الأفضل في فرق Freeze و Hyperbloom لدعم الفريق."
      },
      {
        "sets": [
          {
            "setId": "ocean_hued_clam",
            "pieces": 4
          }
        ],
        "note": "الأفضل لزيادة الهيل وضرر الفقاعة في فرق Mono Hydro / Taser."
      }
    ],
    "artifactStats": {
      "sands": [
        "HP%",
        "Energy Recharge"
      ],
      "goblet": [
        "HP%"
      ],
      "circlet": [
        "Healing Bonus"
      ],
      "substats": [
        "HP%",
        "Energy Recharge"
      ],
      "breakpoints": "HP: 36,000-42,000 | ER: 160%-190%"
    }
  }
};

function main() {
  const overrides = readJson("builds-overrides.json", {});
  const characters = readJson("characters.json", {});
  const weapons = readJson("weapons.json", {});
  const artifacts = readJson("artifacts.json", {});

  const hasValidationData = Object.keys(weapons).length > 0 && Object.keys(artifacts).length > 0;
  let addedCount = 0;

  for (const [charId, build] of Object.entries(NEW_META_BUILDS)) {
    if (hasValidationData) {
      if (Object.keys(characters).length && !characters[charId]) {
        console.warn(`⚠️ تحذير: الشخصية "${charId}" غير موجودة في characters.json`);
      }
      for (const w of build.recommendedWeapons || []) {
        if (!weapons[w.weaponId]) {
          throw new Error(`خطأ تحقق: السلاح "${w.weaponId}" للشخصية "${charId}" غير موجود في weapons.json`);
        }
      }
      for (const a of build.recommendedArtifacts || []) {
        for (const s of a.sets || []) {
          if (!artifacts[s.setId]) {
            throw new Error(`خطأ تحقق: طقم الآرتيفاكت "${s.setId}" للشخصية "${charId}" غير موجود في artifacts.json`);
          }
        }
      }
    }

    if (!overrides[charId]) addedCount++;
    overrides[charId] = build;
  }

  writeJson("builds-overrides.json", overrides);
  const totalBuilds = Object.keys(overrides).filter((k) => k !== "_doc").length;
  console.log(`📊 إجمالي الشخصيات المخصصة في builds-overrides.json: ${totalBuilds} (تمت إضافة ${addedCount} شخصية جديدة).`);

  if (process.argv.includes("--sync-chars") && Object.keys(characters).length > 0) {
    let syncedChars = 0;
    for (const [charId, ov] of Object.entries(overrides)) {
      if (charId === "_doc" || !characters[charId]) continue;
      characters[charId] = {
        ...characters[charId],
        arName: ov.arName || characters[charId].arName,
        talentPriority: ov.talentPriority || characters[charId].talentPriority,
        recommendedWeapons: ov.recommendedWeapons || characters[charId].recommendedWeapons,
        recommendedArtifacts: ov.recommendedArtifacts || characters[charId].recommendedArtifacts,
        artifactStats: ov.artifactStats || characters[charId].artifactStats
      };
      syncedChars++;
    }
    writeJson("characters.json", characters);
    console.log(`🔄 تم حقن التعديلات مباشرة في characters.json لعدد ${syncedChars} شخصية.`);
  }
}

main();
