"use server";
// Every change made in the admin goes through these actions. Each one checks the session first
// (Next also rejects server actions posted from another origin), then revalidates the public pages it affects.
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CITIES } from "@/lib/geo";
import { isCategory, isSlug, slugFromTitle } from "@/lib/blog";
import { db } from "@/lib/db";
import { checkSetupCode, endSession, hashPassword, passwordProblem, requireStaff, signIn, staffCount, startSession, verifyPassword } from "@/lib/admin/auth";
import { getObject } from "@/lib/admin/objects";
import { importObjects, importPlan } from "@/lib/admin/object-import";
import { getArticle } from "@/lib/admin/articles";
import { importBlog } from "@/lib/admin/importer";
import { isGeo } from "@/lib/admin/options";
import { normalisePath } from "@/lib/admin/seo";
import { storage } from "@/lib/admin/storage";
import { OBJECT_DISTANCES, type DistanceKey, type FormState } from "@/lib/admin/forms";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => str(fd, k) || null;
const num = (fd: FormData, k: string) => {
  const v = str(fd, k).replace(/[\s ]/g, "").replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};
/** Photo URLs: our storage is always https; plain http only for a local test server. */
const isPhotoUrl = (u: unknown): u is string => typeof u === "string" && /^(https:\/\/|http:\/\/localhost[:/])/.test(u);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const dbError = (err: unknown): FormState => {
  if (err && typeof err === "object" && "digest" in err) throw err; // redirect() and notFound() pass through
  console.error(err);
  return { error: "Не удалось сохранить: ошибка базы данных. Попробуйте ещё раз." };
};

/** Removes photos that are no longer used from storage; a failure only leaves an unused file behind. */
async function dropPhotos(urls: string[]) {
  if (!urls.length) return;
  try {
    await storage().remove(urls);
  } catch (err) {
    console.error("Unused photos were not removed", err);
  }
}

/* ───────────── Sign-in ───────────── */

export async function setupAction(_: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if ((await staffCount().catch(() => 0)) > 0) return { error: "Первый сотрудник уже создан. Войдите со своим паролем." };
  const codeError = await checkSetupCode(str(fd, "code"));
  if (codeError) return { error: codeError };
  if (!name || !isEmail(email)) return { error: "Укажите имя и e-mail." };
  const weak = passwordProblem(password);
  if (weak) return { error: weak };
  const hash = await hashPassword(password);
  let id: number | null = null;
  try {
    id = await (await db()).begin(async (tx) => {
      await tx`lock table staff in exclusive mode`;
      const [{ n }] = await tx`select count(*)::int as n from staff`;
      if (n > 0) return null;
      const [row] = await tx`insert into staff (email, name, password_hash, role) values (${email}, ${name}, ${hash}, 'owner') returning id`;
      return row.id as number;
    });
  } catch (err) {
    return dbError(err);
  }
  if (!id) return { error: "Первый сотрудник уже создан. Войдите со своим паролем." };
  await startSession(id);
  redirect("/admin/");
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const error = await signIn(str(fd, "email"), String(fd.get("password") ?? ""));
  if (error) return { error };
  redirect("/admin/");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login/");
}

/* ───────────── Objects ───────────── */

/** Checked values of a chip group: short strings, each once. */
const list = (fd: FormData, k: string, max = 40) => [...new Set(fd.getAll(k).map((v) => String(v).trim()).filter((v) => v && v.length <= 60))].slice(0, max);
const whole = (v: number | null) => (v === null ? null : Math.round(v));

export async function saveObjectAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireStaff();
  const id = Number(fd.get("id")) || null;
  const title = str(fd, "title");
  const city = str(fd, "city");
  const currency = str(fd, "currency") === "USD" ? "USD" : "EUR";
  const keys = ["bed_min", "bed_max", "bathrooms", "bathrooms_max", "area", "area_max", "floor", "floors", "year", "price", "price_max"] as const;
  const n = Object.fromEntries(keys.map((k) => [k, num(fd, k)])) as Record<(typeof keys)[number], number | null>;
  const dist = Object.fromEntries(OBJECT_DISTANCES.map(([k]) => [k, num(fd, `dist_${k}`)])) as Record<DistanceKey, number | null>;
  if (!title) return { error: "Укажите название." };
  if (!CITIES[city]) return { error: "Выберите город." };
  if ([...Object.values(n), ...Object.values(dist)].some((v) => Number.isNaN(v))) return { error: "Числа (цена, спальни, площадь, этажи, расстояния) — только цифрами." };
  if (n.year !== null && (n.year < 1900 || n.year > 2100)) return { error: "Год — четыре цифры, например 2026." };
  const mapUrl = opt(fd, "map_url");
  if (mapUrl && !/^https?:\/\/\S+$/.test(mapUrl)) return { error: "Ссылка на карту должна начинаться с https://" };
  let photos: string[] = [];
  try {
    photos = (JSON.parse(String(fd.get("photos") || "[]")) as unknown[]).filter(isPhotoUrl).slice(0, 120);
  } catch {}
  const published = fd.get("published") === "on";
  if (published && !photos.length) return { error: "Чтобы опубликовать объект, добавьте хотя бы одно фото." };
  const bedMin = whole(n.bed_min);
  const range = (min: number | null, max: number | null) => (max !== null && min !== null && max > min ? whole(max) : null);
  const row = {
    published,
    is_project: fd.get("is_project") === "1",
    title,
    developer: opt(fd, "developer"),
    city,
    district: opt(fd, "district"),
    types: list(fd, "types"),
    layouts: list(fd, "layouts"),
    bed_min: bedMin,
    bed_max: Math.max(bedMin ?? 0, whole(n.bed_max) ?? 0),
    bathrooms: whole(n.bathrooms),
    bathrooms_max: range(n.bathrooms, n.bathrooms_max),
    area: whole(n.area),
    area_max: range(n.area, n.area_max),
    floor: whole(n.floor),
    floors: whole(n.floors),
    year: whole(n.year),
    furnished: fd.get("furnished") === "on",
    installments: opt(fd, "installments"),
    price: n.price,
    price_max: n.price_max !== null && n.price !== null && n.price_max > n.price ? n.price_max : null,
    currency,
    tags: list(fd, "tags"),
    features: list(fd, "features", 60),
    views: list(fd, "views"),
    heating: list(fd, "heating"),
    ...Object.fromEntries(OBJECT_DISTANCES.flatMap(([k]) => [[`dist_${k}`, dist[k]], [`dist_${k}_unit`, str(fd, `dist_${k}_unit`) === "km" ? "km" : "m"]])),
    map_url: mapUrl,
    description: opt(fd, "description")?.replace(/\r\n?/g, "\n") ?? null,
    photos,
  };
  let savedId = id;
  try {
    const sql = await db();
    if (id) {
      const before = await getObject(id);
      if (!before) return { error: "Объект не найден: возможно, его уже удалили." };
      await sql`update objects set ${sql(row)}, updated_at = now() where id = ${id}`;
      await dropPhotos(before.photos.filter((u) => !photos.includes(u)));
    } else {
      const [r] = await sql`insert into objects ${sql(row)} returning id`;
      savedId = r.id;
    }
  } catch (err) {
    return dbError(err);
  }
  revalidateTag("properties");
  redirect(`/admin/objects/${savedId}/?saved=1`);
}

export async function deleteObjectAction(fd: FormData) {
  await requireStaff();
  const id = Number(fd.get("id"));
  const before = id ? await getObject(id) : null;
  if (before) {
    const sql = await db();
    await sql.begin(async (tx) => {
      await tx`delete from objects where id = ${id}`;
      // An object of the old catalogue: remember it, so that it does not come back from azpo.ru.
      if (before.source) await tx`insert into objects_removed (id) values (${id}) on conflict do nothing`;
    });
    await dropPhotos(before.photos);
    revalidateTag("properties");
  }
  redirect("/admin/objects/");
}

/** Step 1 of the move from azpo.ru: which objects are still to be moved. */
export async function objectImportPlanAction(): Promise<{ error: string } | { total: number; missing: number[] }> {
  await requireStaff();
  try {
    return await importPlan();
  } catch (err) {
    console.error(err);
    return { error: `Не удалось получить каталог azpo.ru: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/** Step 2, repeated by the page: moves one batch of objects. */
export async function objectImportBatchAction(ids: number[]): Promise<{ error: string } | { imported: number; failed: number[] }> {
  await requireStaff();
  if (!Array.isArray(ids)) return { error: "Нет списка объектов." };
  try {
    const r = await importObjects(ids.map(Number));
    if (r.imported) revalidateTag("properties");
    return r;
  } catch (err) {
    console.error(err);
    return { error: `Перенос прервался: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/* ───────────── Articles ───────────── */

export async function saveArticleAction(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const id = Number(fd.get("id")) || null;
  const title = str(fd, "title");
  const category = str(fd, "category");
  const slug = (str(fd, "slug") || slugFromTitle(title)).toLowerCase();
  const body = String(fd.get("body") ?? "").replace(/\r\n?/g, "\n").trim();
  if (!title) return { error: "Укажите заголовок." };
  if (!isCategory(category)) return { error: "Выберите раздел." };
  if (!isSlug(slug)) return { error: "Адрес статьи: только латинские буквы, цифры и дефисы." };
  if (!body) return { error: "Добавьте текст статьи." };
  const geo = str(fd, "geo");
  if (geo && !isGeo(geo)) return { error: "Выберите место из списка." };
  const published = fd.get("published") === "on";
  const dateRaw = str(fd, "published_at");
  let date = dateRaw ? new Date(`${dateRaw}T09:00:00Z`) : null;
  // Today's date means "now": otherwise an article saved in the morning would vanish from the site until 9:00 UTC.
  if (date && date > new Date() && dateRaw === new Date().toISOString().slice(0, 10)) date = new Date();
  const row = {
    category,
    slug,
    title,
    excerpt: opt(fd, "excerpt"),
    body,
    cover: isPhotoUrl(str(fd, "cover")) ? str(fd, "cover") : null,
    author: opt(fd, "author") ?? me.name,
    seo_title: opt(fd, "seo_title"),
    seo_description: opt(fd, "seo_description"),
    published,
    published_at: date && !Number.isNaN(date.getTime()) ? date : published ? new Date() : null,
    geo: geo || null,
  };
  let savedId = id;
  try {
    const sql = await db();
    const [clash] = await sql`select id from articles where category = ${category} and slug = ${slug} and id <> ${id ?? 0}`;
    if (clash) return { error: "Статья с таким адресом в этом разделе уже есть. Измените адрес." };
    if (id) {
      const before = await getArticle(id);
      if (!before) return { error: "Статья не найдена: возможно, её уже удалили." };
      // An unchanged date keeps its exact time, so the order of the list doesn't move on every save.
      if (before.published_at && dateRaw === before.published_at.toISOString().slice(0, 10)) row.published_at = before.published_at;
      await sql`update articles set ${sql(row)}, updated_at = now() where id = ${id}`;
      // The old address keeps working after a change of section or slug.
      if (before.published && (before.category !== category || before.slug !== slug)) {
        const from = `/ru/blog/${before.category}/${before.slug}/`;
        await sql`insert into redirects (from_path, to_path) values (${from}, ${`/ru/blog/${category}/${slug}/`})
                  on conflict (from_path) do update set to_path = excluded.to_path`;
        revalidateTag("redirects");
      }
    } else {
      const [r] = await sql`insert into articles ${sql(row)} returning id`;
      savedId = r.id;
    }
  } catch (err) {
    return dbError(err);
  }
  revalidateTag("articles");
  redirect(`/admin/articles/${savedId}/?saved=1`);
}

export async function deleteArticleAction(fd: FormData) {
  await requireStaff();
  const id = Number(fd.get("id"));
  if (id) {
    const sql = await db();
    await sql`delete from articles where id = ${id}`;
  }
  revalidateTag("articles");
  redirect("/admin/articles/");
}

export async function importBlogAction(): Promise<FormState> {
  await requireStaff();
  try {
    const r = await importBlog(5);
    revalidateTag("articles");
    revalidateTag("redirects");
    revalidatePath("/admin/articles/");
    const left = Math.max(0, r.total - r.done);
    const msg = `Импортировано статей: ${r.imported}. Всего в блоге azpo.ru: ${r.total}, осталось: ${left}.`;
    return r.errors.length ? { error: `${msg} Ошибки: ${r.errors.join("; ")}` } : { ok: left ? `${msg} Нажмите ещё раз, чтобы продолжить.` : `${msg} Готово.` };
  } catch (err) {
    console.error(err);
    return { error: `Импорт не удался: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/* ───────────── SEO and redirects ───────────── */

export async function saveSeoAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireStaff();
  const path = normalisePath(str(fd, "path"));
  if (!/^\/ru\//.test(path)) return { error: "Адрес страницы должен начинаться с /ru/." };
  const row = { path, title: opt(fd, "title"), description: opt(fd, "description"), h1: opt(fd, "h1"), intro: opt(fd, "intro"), noindex: fd.get("noindex") === "on" };
  if (!row.title && !row.description && !row.h1 && !row.intro && !row.noindex) return { error: "Заполните хотя бы одно поле." };
  try {
    const sql = await db();
    await sql`insert into seo_pages ${sql(row)} on conflict (path) do update set
      title = excluded.title, description = excluded.description, h1 = excluded.h1, intro = excluded.intro, noindex = excluded.noindex, updated_at = now()`;
  } catch (err) {
    return dbError(err);
  }
  revalidateTag("seo");
  revalidatePath("/admin/seo/");
  return { ok: `Сохранено для ${path}. Страница обновится на сайте в течение минуты.` };
}

export async function deleteSeoAction(fd: FormData) {
  await requireStaff();
  const sql = await db();
  await sql`delete from seo_pages where path = ${str(fd, "path")}`;
  revalidateTag("seo");
  revalidatePath("/admin/seo/");
}

export async function saveRedirectAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireStaff();
  const from = normalisePath(str(fd, "from"));
  const toRaw = str(fd, "to");
  const to = /^https?:\/\//i.test(toRaw) ? toRaw : normalisePath(toRaw);
  if (from === "/" || from.startsWith("/admin/") || from.startsWith("/_next/")) return { error: "С этого адреса редирект поставить нельзя." };
  if (!toRaw || from === normalisePath(to)) return { error: "Укажите, куда вести, — другой адрес." };
  try {
    const sql = await db();
    const [loop] = await sql`select 1 from redirects where from_path = ${normalisePath(to)} and to_path = ${from}`;
    if (loop) return { error: "Получится петля: обратный редирект уже есть." };
    await sql`insert into redirects (from_path, to_path) values (${from}, ${to}) on conflict (from_path) do update set to_path = excluded.to_path`;
  } catch (err) {
    return dbError(err);
  }
  revalidateTag("redirects");
  revalidatePath("/admin/redirects/");
  return { ok: `${from} → ${to}` };
}

export async function deleteRedirectAction(fd: FormData) {
  await requireStaff();
  const sql = await db();
  await sql`delete from redirects where from_path = ${str(fd, "from")}`;
  revalidateTag("redirects");
  revalidatePath("/admin/redirects/");
}

/* ───────────── Staff ───────────── */

export async function addStaffAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireStaff("owner");
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const role = str(fd, "role") === "owner" ? "owner" : "editor";
  if (!name || !isEmail(email)) return { error: "Укажите имя и e-mail." };
  const weak = passwordProblem(password);
  if (weak) return { error: weak };
  try {
    const sql = await db();
    const [exists] = await sql`select 1 from staff where email = ${email}`;
    if (exists) return { error: "Сотрудник с таким e-mail уже есть." };
    await sql`insert into staff (email, name, password_hash, role) values (${email}, ${name}, ${await hashPassword(password)}, ${role})`;
  } catch (err) {
    return dbError(err);
  }
  revalidatePath("/admin/staff/");
  return { ok: `Добавлен: ${name}. Передайте пароль лично, не в общем чате.` };
}

export async function deleteStaffAction(fd: FormData) {
  const me = await requireStaff("owner");
  const id = Number(fd.get("id"));
  if (id && id !== me.id) {
    const sql = await db();
    await sql`delete from staff where id = ${id}`;
  }
  revalidatePath("/admin/staff/");
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("password") ?? "");
  const sql = await db();
  const [row] = await sql<{ password_hash: string }[]>`select password_hash from staff where id = ${me.id}`;
  if (!row || !(await verifyPassword(current, row.password_hash))) return { error: "Текущий пароль неверный." };
  const weak = passwordProblem(next);
  if (weak) return { error: weak };
  await sql`update staff set password_hash = ${await hashPassword(next)} where id = ${me.id}`;
  // Other devices are signed out; this one gets a fresh session.
  await sql`delete from sessions where staff_id = ${me.id}`;
  await startSession(me.id);
  return { ok: "Пароль изменён. На других устройствах нужно войти заново." };
}
