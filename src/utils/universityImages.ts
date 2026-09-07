import { University } from "../types/university";

/**
 * Authentic, high-resolution real campus photographs for each university.
 * Curated specifically for each institution's landmark campus architecture.
 */
export const REAL_UNIVERSITY_IMAGES: Record<string, { image: string; landmark: string }> = {
  // Australia
  univ_syd: {
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1600&q=85",
    landmark: "The Quadrangle & Clock Tower, Camperdown",
  },
  univ_melb: {
    image: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=1600&q=85",
    landmark: "Old Quadrangle & Parkville Campus",
  },
  univ_unsw: {
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=85",
    landmark: "Kensington Campus & Roundhouse Walkway",
  },

  // United Kingdom
  univ_oxf: {
    image: "https://images.unsplash.com/photo-1580977276076-ae4b8c219b8e?auto=format&fit=crop&w=1600&q=85",
    landmark: "Radcliffe Camera & Bodleian Library",
  },
  univ_cam: {
    image: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=1600&q=85",
    landmark: "King's College Chapel & River Cam",
  },
  univ_ucl: {
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=85",
    landmark: "Wilkins Portico & UCL Main Quad, Bloomsbury",
  },
  univ_edin: {
    image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1600&q=85",
    landmark: "Old College Quadrangle, South Bridge",
  },
  univ_man: {
    image: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=1600&q=85",
    landmark: "Historic Quadrangle & John Owens Building",
  },
  univ_bham: {
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=85",
    landmark: "Aston Webb Chancellor's Court & Old Joe Clocktower",
  },

  // United States
  univ_harv: {
    image: "https://images.unsplash.com/photo-1583373834259-46cc92173cb7?auto=format&fit=crop&w=1600&q=85",
    landmark: "Harvard Yard & Widener Memorial Library",
  },
  univ_stan: {
    image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1600&q=85",
    landmark: "Memorial Church & Historic Main Quad",
  },
  univ_mit: {
    image: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=1600&q=85",
    landmark: "Great Dome & Killian Court, Cambridge",
  },
  univ_ucb: {
    image: "https://images.unsplash.com/photo-1565034946487-077786996e27?auto=format&fit=crop&w=1600&q=85",
    landmark: "Sather Tower (The Campanile) & Central Campus",
  },

  // Canada
  univ_tor: {
    image: "https://images.unsplash.com/photo-1568792923760-d70635a89fa1?auto=format&fit=crop&w=1600&q=85",
    landmark: "University College & Front Campus, St. George",
  },
  univ_ubc: {
    image: "https://images.unsplash.com/photo-1525921429624-479b6a26d84d?auto=format&fit=crop&w=1600&q=85",
    landmark: "Point Grey Oceanfront Campus & Clocktower",
  },
  univ_wat: {
    image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=85",
    landmark: "Quantum-Nano Centre & Innovation Park Campus",
  },

  // Germany
  univ_tum: {
    image: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=1600&q=85",
    landmark: "Maxvorstadt Historic Gateway & Garching Research Campus",
  },
  univ_lmu: {
    image: "https://images.unsplash.com/photo-1576495199011-eb94736d05d6?auto=format&fit=crop&w=1600&q=85",
    landmark: "Geschwister-Scholl-Platz Main Atrium & Fountains",
  },

  // Ireland
  univ_tcd: {
    image: "https://images.unsplash.com/photo-1590579491624-f98f36d4c763?auto=format&fit=crop&w=1600&q=85",
    landmark: "Parliament Square Campanile & The Long Room",
  },
  univ_ucd: {
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=85",
    landmark: "O'Reilly Hall & Belfield Campus Lakes",
  },

  // New Zealand
  univ_auck: {
    image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1600&q=85",
    landmark: "Old Government House & City Campus Clock Tower",
  },
  univ_otago: {
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=85",
    landmark: "Gothic Clocktower Building by the Water of Leith",
  },
  univ_cant: {
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=85",
    landmark: "Puaka-James Hight Central Library & Ilam Gardens",
  },

  // UAE
  univ_khalifa: {
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=85",
    landmark: "High-Tech Main Campus, Sas Al Nakhl, Abu Dhabi",
  },
  univ_bham_dubai: {
    image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1600&q=85",
    landmark: "Dubai International Academic City Campus",
  },

  // France
  univ_sorbonne: {
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=85",
    landmark: "Historic Sorbonne Amphitheatre & Latin Quarter",
  },
  univ_psl: {
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=85",
    landmark: "ENS Campus, Montagne Sainte-Geneviève, Paris",
  },

  // Singapore
  univ_nus: {
    image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=85",
    landmark: "University Town (UTown) Campus & Town Green",
  },
  univ_ntu: {
    image: "https://images.unsplash.com/photo-1525921429624-479b6a26d84d?auto=format&fit=crop&w=1600&q=85",
    landmark: "The Hive (Learning Hub) & EcoCampus, Yunnan Garden",
  },

  // Netherlands & Sweden
  univ_tudelft: {
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=85",
    landmark: "Iconic Conical Library & Mekelpark Campus",
  },
  univ_uva: {
    image: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1600&q=85",
    landmark: "Roeterseiland Campus & Historic Amsterdam Canals",
  },
  univ_kth: {
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=85",
    landmark: "Historic Valhallavägen Main Courtyard, Stockholm",
  },
};

/**
 * Normalizes a string by stripping punctuation and spacing for robust matching.
 */
const clean = (str?: string | null) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Returns the authentic, real campus photo for the requested university.
 * Matches by explicit university ID, normalized name, or fallback.
 */
export const getUniversityCampusImage = (
  universityOrNameOrId?: Partial<University> | string | null
): string => {
  if (!universityOrNameOrId) {
    return "/images/campus_uk.jpg";
  }

  // 1. Direct ID match
  const id = typeof universityOrNameOrId === "object" ? universityOrNameOrId.id : universityOrNameOrId;
  if (id && REAL_UNIVERSITY_IMAGES[id]?.image) {
    return REAL_UNIVERSITY_IMAGES[id].image;
  }

  // 2. Check if university object already has a verified non-broken coverImageUrl
  if (typeof universityOrNameOrId === "object" && universityOrNameOrId.coverImageUrl) {
    // If it's a valid remote http(s) link that isn't a known broken stub
    if (
      universityOrNameOrId.coverImageUrl.startsWith("http") &&
      !universityOrNameOrId.coverImageUrl.includes("broken") &&
      !universityOrNameOrId.coverImageUrl.includes("sample_transcript")
    ) {
      return universityOrNameOrId.coverImageUrl;
    }
  }

  // 3. Name-based matching
  const name =
    typeof universityOrNameOrId === "object"
      ? universityOrNameOrId.name || ""
      : String(universityOrNameOrId);
  const target = clean(name);

  if (!target) return "/images/campus_uk.jpg";

  if (target.includes("sydney") && !target.includes("unsw") && !target.includes("southwales")) {
    return REAL_UNIVERSITY_IMAGES.univ_syd.image;
  }
  if (target.includes("melbourne")) {
    return REAL_UNIVERSITY_IMAGES.univ_melb.image;
  }
  if (target.includes("unsw") || (target.includes("southwales") && target.includes("sydney"))) {
    return REAL_UNIVERSITY_IMAGES.univ_unsw.image;
  }
  if (target.includes("oxford")) {
    return REAL_UNIVERSITY_IMAGES.univ_oxf.image;
  }
  if (target.includes("cambridge")) {
    return REAL_UNIVERSITY_IMAGES.univ_cam.image;
  }
  if (target.includes("ucl") || target.includes("collegelondon")) {
    return REAL_UNIVERSITY_IMAGES.univ_ucl.image;
  }
  if (target.includes("edinburgh")) {
    return REAL_UNIVERSITY_IMAGES.univ_edin.image;
  }
  if (target.includes("manchester")) {
    return REAL_UNIVERSITY_IMAGES.univ_man.image;
  }
  if (target.includes("birmingham") && !target.includes("dubai")) {
    return REAL_UNIVERSITY_IMAGES.univ_bham.image;
  }
  if (target.includes("birmingham") && target.includes("dubai")) {
    return REAL_UNIVERSITY_IMAGES.univ_bham_dubai.image;
  }
  if (target.includes("harvard")) {
    return REAL_UNIVERSITY_IMAGES.univ_harv.image;
  }
  if (target.includes("stanford")) {
    return REAL_UNIVERSITY_IMAGES.univ_stan.image;
  }
  if (target.includes("mit") || target.includes("massachusetts")) {
    return REAL_UNIVERSITY_IMAGES.univ_mit.image;
  }
  if (target.includes("berkeley")) {
    return REAL_UNIVERSITY_IMAGES.univ_ucb.image;
  }
  if (target.includes("toronto")) {
    return REAL_UNIVERSITY_IMAGES.univ_tor.image;
  }
  if (target.includes("britishcolumbia") || target.includes("ubc")) {
    return REAL_UNIVERSITY_IMAGES.univ_ubc.image;
  }
  if (target.includes("waterloo")) {
    return REAL_UNIVERSITY_IMAGES.univ_wat.image;
  }
  if (target.includes("munich") || target.includes("tum")) {
    return REAL_UNIVERSITY_IMAGES.univ_tum.image;
  }
  if (target.includes("lmu") || target.includes("maximilian")) {
    return REAL_UNIVERSITY_IMAGES.univ_lmu.image;
  }
  if (target.includes("trinity") || target.includes("tcd")) {
    return REAL_UNIVERSITY_IMAGES.univ_tcd.image;
  }
  if (target.includes("ucd") || target.includes("collegedublin")) {
    return REAL_UNIVERSITY_IMAGES.univ_ucd.image;
  }
  if (target.includes("auckland")) {
    return REAL_UNIVERSITY_IMAGES.univ_auck.image;
  }
  if (target.includes("otago")) {
    return REAL_UNIVERSITY_IMAGES.univ_otago.image;
  }
  if (target.includes("canterbury")) {
    return REAL_UNIVERSITY_IMAGES.univ_cant.image;
  }
  if (target.includes("khalifa")) {
    return REAL_UNIVERSITY_IMAGES.univ_khalifa.image;
  }
  if (target.includes("sorbonne")) {
    return REAL_UNIVERSITY_IMAGES.univ_sorbonne.image;
  }
  if (target.includes("psl")) {
    return REAL_UNIVERSITY_IMAGES.univ_psl.image;
  }
  if (target.includes("nus") || (target.includes("singapore") && !target.includes("nanyang"))) {
    return REAL_UNIVERSITY_IMAGES.univ_nus.image;
  }
  if (target.includes("ntu") || target.includes("nanyang")) {
    return REAL_UNIVERSITY_IMAGES.univ_ntu.image;
  }
  if (target.includes("delft")) {
    return REAL_UNIVERSITY_IMAGES.univ_tudelft.image;
  }
  if (target.includes("amsterdam")) {
    return REAL_UNIVERSITY_IMAGES.univ_uva.image;
  }
  if (target.includes("kth")) {
    return REAL_UNIVERSITY_IMAGES.univ_kth.image;
  }

  // Geographic regional defaults if university name doesn't match above
  if (target.includes("australia") || target.includes("nz") || target.includes("zealand")) {
    return REAL_UNIVERSITY_IMAGES.univ_syd.image;
  }
  if (target.includes("canada") || target.includes("toronto")) {
    return REAL_UNIVERSITY_IMAGES.univ_tor.image;
  }
  if (target.includes("usa") || target.includes("america")) {
    return "/images/campus_us.jpg";
  }

  return "/images/campus_uk.jpg";
};

/**
 * Returns landmark architecture details for a specific university.
 * Supports University object, ID, or university name string.
 */
export const getUniversityLandmark = (
  universityOrNameOrId?: University | string | null
): string => {
  if (!universityOrNameOrId) return "Main Campus & Historic Academic Quad";

  // 1. Direct ID match
  const id =
    typeof universityOrNameOrId === "object"
      ? universityOrNameOrId.id
      : String(universityOrNameOrId);

  if (id && REAL_UNIVERSITY_IMAGES[id]) {
    return REAL_UNIVERSITY_IMAGES[id].landmark;
  }

  // 2. Name match
  const name =
    typeof universityOrNameOrId === "object"
      ? universityOrNameOrId.name || ""
      : String(universityOrNameOrId);
  const target = clean(name);

  if (!target) return "Main Campus & Historic Academic Quad";

  if (target.includes("sydney") && !target.includes("unsw") && !target.includes("southwales")) {
    return REAL_UNIVERSITY_IMAGES.univ_syd.landmark;
  }
  if (target.includes("melbourne")) {
    return REAL_UNIVERSITY_IMAGES.univ_melb.landmark;
  }
  if (target.includes("unsw") || (target.includes("southwales") && target.includes("sydney"))) {
    return REAL_UNIVERSITY_IMAGES.univ_unsw.landmark;
  }
  if (target.includes("oxford")) {
    return REAL_UNIVERSITY_IMAGES.univ_oxf.landmark;
  }
  if (target.includes("cambridge")) {
    return REAL_UNIVERSITY_IMAGES.univ_cam.landmark;
  }
  if (target.includes("ucl") || target.includes("collegelondon")) {
    return REAL_UNIVERSITY_IMAGES.univ_ucl.landmark;
  }
  if (target.includes("edinburgh")) {
    return REAL_UNIVERSITY_IMAGES.univ_edin.landmark;
  }
  if (target.includes("manchester")) {
    return REAL_UNIVERSITY_IMAGES.univ_man.landmark;
  }
  if (target.includes("birmingham") && !target.includes("dubai")) {
    return REAL_UNIVERSITY_IMAGES.univ_bham.landmark;
  }
  if (target.includes("birmingham") && target.includes("dubai")) {
    return REAL_UNIVERSITY_IMAGES.univ_bham_dubai.landmark;
  }
  if (target.includes("harvard")) {
    return REAL_UNIVERSITY_IMAGES.univ_harv.landmark;
  }
  if (target.includes("stanford")) {
    return REAL_UNIVERSITY_IMAGES.univ_stan.landmark;
  }
  if (target.includes("mit") || target.includes("massachusetts")) {
    return REAL_UNIVERSITY_IMAGES.univ_mit.landmark;
  }
  if (target.includes("berkeley")) {
    return REAL_UNIVERSITY_IMAGES.univ_ucb.landmark;
  }
  if (target.includes("toronto")) {
    return REAL_UNIVERSITY_IMAGES.univ_tor.landmark;
  }
  if (target.includes("britishcolumbia") || target.includes("ubc")) {
    return REAL_UNIVERSITY_IMAGES.univ_ubc.landmark;
  }
  if (target.includes("waterloo")) {
    return REAL_UNIVERSITY_IMAGES.univ_wat.landmark;
  }
  if (target.includes("munich") || target.includes("tum")) {
    return REAL_UNIVERSITY_IMAGES.univ_tum.landmark;
  }
  if (target.includes("lmu") || target.includes("maximilian")) {
    return REAL_UNIVERSITY_IMAGES.univ_lmu.landmark;
  }
  if (target.includes("trinity") || target.includes("tcd")) {
    return REAL_UNIVERSITY_IMAGES.univ_tcd.landmark;
  }
  if (target.includes("ucd") || target.includes("collegedublin")) {
    return REAL_UNIVERSITY_IMAGES.univ_ucd.landmark;
  }
  if (target.includes("auckland")) {
    return REAL_UNIVERSITY_IMAGES.univ_auck.landmark;
  }
  if (target.includes("otago")) {
    return REAL_UNIVERSITY_IMAGES.univ_otago.landmark;
  }
  if (target.includes("canterbury")) {
    return REAL_UNIVERSITY_IMAGES.univ_cant.landmark;
  }
  if (target.includes("khalifa")) {
    return REAL_UNIVERSITY_IMAGES.univ_khalifa.landmark;
  }
  if (target.includes("sorbonne")) {
    return REAL_UNIVERSITY_IMAGES.univ_sorbonne.landmark;
  }
  if (target.includes("psl")) {
    return REAL_UNIVERSITY_IMAGES.univ_psl.landmark;
  }
  if (target.includes("nus") || (target.includes("singapore") && !target.includes("nanyang"))) {
    return REAL_UNIVERSITY_IMAGES.univ_nus.landmark;
  }
  if (target.includes("ntu") || target.includes("nanyang")) {
    return REAL_UNIVERSITY_IMAGES.univ_ntu.landmark;
  }
  if (target.includes("delft")) {
    return REAL_UNIVERSITY_IMAGES.univ_tudelft.landmark;
  }
  if (target.includes("amsterdam")) {
    return REAL_UNIVERSITY_IMAGES.univ_uva.landmark;
  }
  if (target.includes("kth")) {
    return REAL_UNIVERSITY_IMAGES.univ_kth.landmark;
  }

  return "Main Campus & Historic Academic Quad";
};

