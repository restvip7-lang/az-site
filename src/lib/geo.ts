// Geography dictionary: cities and districts with Russian names and the prepositional case
// ("в Махмутларе") used in headings and meta tags. Slugs are the same on every language version.
// District adjacency ("соседние районы") follows the order along the coast; later it moves to the admin.

export interface City {
  ru: string;
  in: string; // "в Алании"
  en: string;
  blurb: string;
  /** Districts ordered along the coast / map, used to find neighbours. */
  order?: string[];
}

export const CITIES: Record<string, City> = {
  alanya: {
    ru: "Алания", in: "Алании", en: "Alanya",
    blurb: "Курорт с самым мягким климатом и доступными ценами",
    order: ["okurcalar", "incekum", "avsallar", "turkler", "payallar", "konakli", "kleopatra", "tepe", "center", "bektas", "tosmur", "oba", "ciplakli", "cikcili", "kestel", "mahmutlar", "kargicak", "demirtas", "gazipasa"],
  },
  antalya: {
    ru: "Анталия", in: "Анталии", en: "Antalya",
    blurb: "Столица Турецкой Ривьеры и крупный деловой центр",
    order: ["kas", "finike", "kemer", "konyaalti", "dosemealti", "kepez", "muratpasa", "aksu", "gazipasa"],
  },
  istanbul: {
    ru: "Стамбул", in: "Стамбуле", en: "Istanbul",
    blurb: "Мегаполис на двух континентах, инвестиции и бизнес",
    order: ["buyukcekmece", "beylikduzu", "esenyurt", "kucukcekmece", "basaksehir", "arnavutkoy", "bahcelievler", "bagcilar", "esenler", "bakirkoy", "eyupsultan", "kagithane", "sisli", "beyoglu", "besiktas", "sariyer", "beykoz", "uskudar", "umraniye", "kadikoy", "sancaktepe", "maltepe", "kartal", "pendik"],
  },
  fethiye: {
    ru: "Фетхие", in: "Фетхие", en: "Fethiye",
    blurb: "Бухты, горы и спокойная жизнь на Эгейском побережье",
    order: ["gocek", "cumhuriyet", "tasyaka", "karagozler", "babatasi", "akarca", "foca", "ciftlik", "karagedik", "oludeniz", "faralya"],
  },
  belek: { ru: "Белек", in: "Белеке", en: "Belek", blurb: "Гольф-курорт премиум-класса рядом с Анталией" },
  mersin: { ru: "Мерсин", in: "Мерсине", en: "Mersin", blurb: "Растущий портовый город с низким порогом входа" },
  bodrum: {
    ru: "Бодрум", in: "Бодруме", en: "Bodrum",
    blurb: "Яхты, виллы и турецкий Сен-Тропе",
    order: ["gumusluk", "yalikavak", "gumbet", "eskicesme", "torba"],
  },
};

/** District names. Key is the slug; "in" is the phrase after "в"/"на". */
const D: Record<string, [ru: string, inCase: string]> = {
  // Alanya
  center: ["Центр Алании", "центре Алании"],
  oba: ["Оба", "Оба"],
  mahmutlar: ["Махмутлар", "Махмутларе"],
  kargicak: ["Каргыджак", "Каргыджаке"],
  cikcili: ["Джикджилли", "Джикджилли"],
  kestel: ["Кестель", "Кестеле"],
  tosmur: ["Тосмур", "Тосмуре"],
  avsallar: ["Авсаллар", "Авсалларе"],
  kleopatra: ["Клеопатра", "районе Клеопатра"],
  konakli: ["Конаклы", "Конаклы"],
  payallar: ["Паяллар", "Паялларе"],
  demirtas: ["Демирташ", "Демирташе"],
  gazipasa: ["Газипаша", "Газипаше"],
  ciplakli: ["Чыплаклы", "Чыплаклы"],
  turkler: ["Тюрклер", "Тюрклере"],
  tepe: ["Тепе", "Тепе"],
  incekum: ["Инджекум", "Инджекуме"],
  bektas: ["Бекташ", "Бекташе"],
  okurcalar: ["Окурджалар", "Окурджаларе"],
  // Antalya
  konyaalti: ["Коньяалты", "Коньяалты"],
  muratpasa: ["Муратпаша", "Муратпаше"],
  aksu: ["Аксу", "Аксу"],
  kepez: ["Кепез", "Кепезе"],
  dosemealti: ["Дёшемеалты", "Дёшемеалты"],
  kemer: ["Кемер", "Кемере"],
  kas: ["Каш", "Каше"],
  finike: ["Финике", "Финике"],
  serik: ["Серик", "Серике"],
  // Istanbul
  beylikduzu: ["Бейликдюзю", "Бейликдюзю"],
  bagcilar: ["Багджылар", "Багджыларе"],
  uskudar: ["Ускюдар", "Ускюдаре"],
  kagithane: ["Кягытхане", "Кягытхане"],
  kucukcekmece: ["Кючюкчекмедже", "Кючюкчекмедже"],
  basaksehir: ["Башакшехир", "Башакшехире"],
  beyoglu: ["Бейоглу", "Бейоглу"],
  buyukcekmece: ["Бююкчекмедже", "Бююкчекмедже"],
  bahcelievler: ["Бахчелиэвлер", "Бахчелиэвлере"],
  eyupsultan: ["Эюпсултан", "Эюпсултане"],
  sariyer: ["Сарыер", "Сарыере"],
  bakirkoy: ["Бакыркёй", "Бакыркёе"],
  kartal: ["Картал", "Картале"],
  beykoz: ["Бейкоз", "Бейкозе"],
  pendik: ["Пендик", "Пендике"],
  sisli: ["Шишли", "Шишли"],
  arnavutkoy: ["Арнавуткёй", "Арнавуткёе"],
  esenler: ["Эсенлер", "Эсенлере"],
  umraniye: ["Умрание", "Умрание"],
  besiktas: ["Бешикташ", "Бешикташе"],
  maltepe: ["Малтепе", "Малтепе"],
  kadikoy: ["Кадыкёй", "Кадыкёе"],
  sancaktepe: ["Санджактепе", "Санджактепе"],
  esenyurt: ["Эсеньюрт", "Эсеньюрте"],
  // Fethiye
  oludeniz: ["Олюдениз", "Олюденизе"],
  foca: ["Фоча", "Фоче"],
  ciftlik: ["Чифтлик", "Чифтлике"],
  akarca: ["Акарджа", "Акардже"],
  babatasi: ["Бабаташи", "Бабаташи"],
  faralya: ["Фаралья", "Фаралье"],
  gocek: ["Гёджек", "Гёджеке"],
  tasyaka: ["Ташьяка", "Ташьяке"],
  karagozler: ["Карагёзлер", "Карагёзлере"],
  cumhuriyet: ["Джумхуриет", "районе Джумхуриет"],
  karagedik: ["Карагедик", "Карагедике"],
  // Bodrum
  yalikavak: ["Ялыкавак", "Ялыкаваке"],
  gumusluk: ["Гюмюшлюк", "Гюмюшлюке"],
  torba: ["Торба", "Торбе"],
  eskicesme: ["Эскичешме", "Эскичешме"],
  gumbet: ["Гюмбет", "Гюмбете"],
};

const TR_MAP: Record<string, string> = { ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c", â: "a", î: "i", û: "u" };

/** "Alanya merkez" → "center", "Konyaaltı" → "konyaalti", "Türkler" → "turkler". */
export function slugify(name: string) {
  const ascii = name.replace(/[ıİşŞğĞüÜöÖçÇâîû]/g, (c) => TR_MAP[c] ?? c).normalize("NFD").replace(/[̀-ͯ]/g, "");
  const s = ascii.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (/^[a-z]+-merkez$/.test(s) || s === "merkez") return "center";
  return s;
}

export function districtSlug(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v || v === "0") return null;
  return slugify(v) || null;
}

export function cityName(key: string) {
  return CITIES[key]?.ru ?? key.charAt(0).toUpperCase() + key.slice(1);
}

/** Prepositional case: "Алании". */
export function cityIn(key: string) {
  return CITIES[key]?.in ?? cityName(key);
}

/** Russian district name; falls back to the Turkish one from the catalogue. */
export function districtName(slug: string, fallback?: string | null) {
  return D[slug]?.[0] ?? fallback ?? slug;
}

export function districtIn(slug: string, fallback?: string | null) {
  return D[slug]?.[1] ?? `районе ${districtName(slug, fallback)}`;
}

/** "в Махмутларе" or "на …" — all current names take "в". */
export const geoIn = (cityKey?: string, district?: string | null, fallback?: string | null) =>
  district ? `в ${districtIn(district, fallback)}` : cityKey ? `в ${cityIn(cityKey)}` : "в Турции";

/** Neighbouring districts: two on each side along the coast, then the rest of the city by size. */
export function neighbours(city: string, district: string, available: string[]) {
  const order = CITIES[city]?.order ?? [];
  const i = order.indexOf(district);
  const near = i >= 0 ? [order[i - 1], order[i + 1], order[i - 2], order[i + 2]].filter((d): d is string => !!d && available.includes(d)) : [];
  const rest = available.filter((d) => d !== district && !near.includes(d));
  return [...near, ...rest];
}
