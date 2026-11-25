import { ROLES, type Role } from "@/lib/admin/auth";

/** The role of a staff member, with what each role may do. */
export default function RoleField({ value, disabled, note }: { value: Role; disabled?: boolean; note?: string }) {
  return (
    <>
      <fieldset className="sm:col-span-2" disabled={disabled}>
        <legend className="adm-label">Роль</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {ROLES.map((r) => (
            <label key={r.value} className="flex cursor-pointer gap-3 rounded-[14px_4px_14px_4px] bg-white p-3 ring-1 ring-brand-500/15 transition-[box-shadow] duration-150 has-[:checked]:ring-2 has-[:checked]:ring-brand-500 has-[:disabled]:cursor-default">
              <input type="radio" name="role" value={r.value} defaultChecked={r.value === value} className="mt-1 accent-brand-500" />
              <span>
                <span className="block font-bold text-ink">{r.label}</span>
                <span className="block text-pretty text-sm text-slate-600">{r.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {note && <p className="adm-hint mt-2">{note}</p>}
      </fieldset>
      {/* A disabled fieldset sends nothing, so the current role travels separately. */}
      {disabled && <input type="hidden" name="role" value={value} />}
    </>
  );
}
