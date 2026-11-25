// Staff login for /admin: scrypt password hashes, random session tokens stored hashed in the DB,
// an httpOnly cookie. No third-party auth, so it moves to the VPS unchanged.
import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const scrypt = promisify(scryptCb) as (pw: string, salt: string, len: number, opts: object) => Promise<Buffer>;
const COOKIE = "azpo_admin";
const DAYS = 30;

/** Hash of the one-time code that creates the first (owner) account; useless once any staff account exists. */
const SETUP_CODE_HASH = "scrypt$16384$8$1$kTqAXVS-8P0_vQVeNP8GxA$e3takMZlYA0TXWaNAWbaD3Dy8ab-Aw9GCg5AOrMTORE";

export async function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = (await scrypt(pw, salt, 32, { N: 16384, r: 8, p: 1 })).toString("base64url");
  return ["scrypt", 16384, 8, 1, salt, hash].join("$");
}

export async function verifyPassword(pw: string, stored: string) {
  const [alg, N, r, p, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const got = await scrypt(pw, salt, 32, { N: Number(N), r: Number(r), p: Number(p) });
  const want = Buffer.from(hash, "base64url");
  return got.length === want.length && timingSafeEqual(got, want);
}

const SETUP_KEY = "#setup"; // login_failures row for wrong setup codes (no e-mail can start with "#")
const SETUP_MAX_FAILURES = 5; // for everyone together, per 15 minutes

/** Checks the one-time setup code, with a shared limit on wrong guesses. Returns an error text or null. */
export async function checkSetupCode(code: string): Promise<string | null> {
  const sql = await db();
  const [{ n }] = await sql`select count(*)::int as n from login_failures where email = ${SETUP_KEY} and at > now() - interval '15 minutes'`;
  if (n >= SETUP_MAX_FAILURES) return "Слишком много попыток. Подождите 15 минут.";
  if (await verifyPassword(code.trim().toUpperCase(), SETUP_CODE_HASH)) return null;
  await sql`insert into login_failures (email) values (${SETUP_KEY})`;
  return "Код не подходит.";
}

const tokenHash = (t: string) => createHash("sha256").update(t).digest("hex");

export type Role = "owner" | "editor" | "viewer";
export interface Staff { id: number; email: string; name: string; role: Role }

/** The roles as staff see them, from the most rights to the least. */
export const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "owner", label: "Владелец", hint: "Всё, что может редактор, и управляет сотрудниками." },
  { value: "editor", label: "Редактор", hint: "Добавляет и меняет объекты, статьи, SEO и переадресации." },
  { value: "viewer", label: "Просмотр", hint: "Видит всю админку, но ничего не меняет." },
];
export const roleName = (r: Role) => ROLES.find((x) => x.value === r)?.label ?? r;
export const isRole = (v: unknown): v is Role => ROLES.some((x) => x.value === v);
const RANK: Record<Role, number> = { viewer: 0, editor: 1, owner: 2 };
/** Whether this staff member may change anything (everyone but "Просмотр"). */
export const canEdit = (s: Pick<Staff, "role">) => RANK[s.role] >= RANK.editor;
export const VIEW_ONLY = "У вас доступ только для просмотра: изменения может вносить редактор или владелец.";

export async function startSession(staffId: number) {
  const token = randomBytes(32).toString("base64url");
  const sql = await db();
  await sql`delete from sessions where expires_at < now()`;
  await sql`insert into sessions (token_hash, staff_id, expires_at) values (${tokenHash(token)}, ${staffId}, now() + make_interval(days => ${DAYS}))`;
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/admin", maxAge: DAYS * 86400 });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const sql = await db();
    await sql`delete from sessions where token_hash = ${tokenHash(token)}`;
  }
  jar.delete({ name: COOKIE, path: "/admin" });
}

export async function currentStaff(): Promise<Staff | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const sql = await db();
  const [row] = await sql<Staff[]>`
    select s.id, s.email, s.name, s.role from sessions x join staff s on s.id = x.staff_id
    where x.token_hash = ${tokenHash(token)} and x.expires_at > now()`;
  return row ?? null;
}

/**
 * For admin pages and actions: the signed-in staff member, or a redirect to the login page.
 * With a role, staff with fewer rights are sent to the start page of the admin.
 */
export async function requireStaff(role?: "editor" | "owner"): Promise<Staff> {
  const me = await currentStaff();
  if (!me) redirect("/admin/login/");
  if (role && RANK[me.role] < RANK[role]) redirect("/admin/");
  return me;
}

export async function staffCount() {
  const sql = await db();
  const [{ n }] = await sql`select count(*)::int as n from staff`;
  return n as number;
}

const MAX_FAILURES = 8; // per e-mail in 15 minutes

/** Checks e-mail and password and starts a session. Returns an error text or null. */
export async function signIn(emailRaw: string, password: string): Promise<string | null> {
  const email = emailRaw.trim().toLowerCase();
  const sql = await db();
  const [{ n }] = await sql`select count(*)::int as n from login_failures where email = ${email} and at > now() - interval '15 minutes'`;
  if (n >= MAX_FAILURES) return "Слишком много попыток. Подождите 15 минут.";
  const [row] = await sql<{ id: number; password_hash: string }[]>`select id, password_hash from staff where email = ${email}`;
  // A dummy hash keeps the timing the same when the e-mail is unknown.
  const ok = await verifyPassword(password, row?.password_hash ?? SETUP_CODE_HASH);
  if (!row || !ok) {
    await sql`delete from login_failures where at < now() - interval '1 day'`;
    await sql`insert into login_failures (email) values (${email})`;
    return "Неверный e-mail или пароль.";
  }
  await sql`delete from login_failures where email = ${email}`;
  await startSession(row.id);
  return null;
}

export const PASSWORD_MIN = 10;
export const passwordProblem = (pw: string) =>
  pw.length < PASSWORD_MIN ? `Пароль должен быть не короче ${PASSWORD_MIN} символов.` : null;
