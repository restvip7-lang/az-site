// Shared by the admin forms (client) and the server actions: form state and field vocabularies.
// The vocabularies are the AZPO catalogue's own, spelled as in its database, so that objects moved
// from azpo.ru keep every value and the site's landings (they match tags by name) pick the objects up.

export type FormState = { error?: string; ok?: string } | null;

/** Property types (an object can have several, e.g. apartments and penthouses in one project). */
export const OBJECT_TYPES = ["Квартиры", "Дуплексы", "Виллы", "Пентхаусы", "Коммерческая", "Отели"];

/** Catalogue tags. */
export const OBJECT_TAGS = [
  "Новостройка", "Вторичное жилье", "От застройщика", "От собственника", "Под Гражданство", "Под ВНЖ",
  "Вид на море", "Первая линия", "Элитное", "Премиум класс", "Эксклюзив", "Инвестиции", "недорого",
];

/** Infrastructure of the object or the complex ("Инфраструктура объекта" on azpo.ru). */
export const OBJECT_FEATURES = [
  "Открытый бассейн", "Закрытый бассейн", "Детский бассейн", "Аквапарк", "Лунапарк", "Сауна", "Хамам", "СПА", "Фитнес",
  "Парковка", "Закрытая парковка", "Лифт", "Охрана 24 7", "Видеонаблюдение", "Интернет", "Спутниковое ТВ", "Холл",
  "Зона отдыха", "Зона барбекю", "Сад", "Детская площадка", "Спортивная площадка", "Теннисный корт", "Футбольное поле",
  "Мини гольф", "Биллиард", "Кинотеатр", "Ресторан", "Без инфраструктуры",
];

/** View from the windows ("landscapes" in the AZPO database). */
export const OBJECT_VIEWS = ["Море", "Горы", "Природа", "Город", "Бассейн", "Двор"];

export const OBJECT_HEATING = ["Кондиционер", "Газ", "Подогрев пола", "Комбинированный"];

/** Layouts, Turkish style: bedrooms + living rooms. 1+0 is a studio. */
export const OBJECT_LAYOUTS = [
  "1+0", "1+1", "2+1", "3+1", "4+1", "5+1", "6+1", "7+1", "8+1", "10+1",
  "2.5+1", "3.5+1", "4.5+1", "5.5+1", "3+2", "4+2", "5+2", "6+2", "7+2", "10+2",
];

/** Distances on the object page: column prefix, label, the unit a new object starts with. */
export const OBJECT_DISTANCES = [
  ["sea", "До моря", "m"],
  ["airport", "До аэропорта", "km"],
  ["hospital", "До больницы", "km"],
  ["shopping", "До магазинов", "m"],
] as const;
export type DistanceKey = (typeof OBJECT_DISTANCES)[number][0];

/** Values of a vocabulary field in the order of the vocabulary, plus anything else the object already has. */
export const withExtras = (vocab: string[], values: string[]) => [...vocab, ...values.filter((v) => !vocab.includes(v))];
