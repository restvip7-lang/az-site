import { describe, expect, it } from "vitest";
import { ipHash, parseLead } from "@/lib/leads";
import { contactGoal } from "@/lib/track";

describe("parseLead", () => {
  const ok = { name: "Анна", phone: "+7 (999) 123-45-67", consent: true };
  it("accepts a normal lead and tidies spaces", () => {
    const r = parseLead({ ...ok, name: "  Анна   Петрова ", context: "объект ID 1046" });
    expect(r).toEqual({ lead: { name: "Анна Петрова", phone: "+7 (999) 123-45-67", context: "объект ID 1046", message: undefined, page: undefined, lang: undefined } });
  });
  it("needs a name, a real phone number and consent", () => {
    expect(parseLead({ ...ok, name: "A" })).toHaveProperty("error");
    expect(parseLead({ ...ok, phone: "12345" })).toHaveProperty("error");
    expect(parseLead({ ...ok, phone: "call me +7 999 123 45 67" })).toHaveProperty("error");
    expect(parseLead({ ...ok, consent: false })).toHaveProperty("error");
    expect(parseLead({ ...ok, consent: "true" })).toHaveProperty("error");
  });
  it("cuts overly long fields", () => {
    const r = parseLead({ ...ok, message: "x".repeat(5000) });
    expect("lead" in r && r.lead.message?.length).toBe(1000);
  });
});

describe("ipHash", () => {
  it("is stable within a day, differs between days and never contains the IP", () => {
    expect(ipHash("1.2.3.4", "2026-11-28")).toBe(ipHash("1.2.3.4", "2026-11-28"));
    expect(ipHash("1.2.3.4", "2026-11-28")).not.toBe(ipHash("1.2.3.4", "2026-11-29"));
    expect(ipHash("1.2.3.4", "2026-11-28")).not.toContain("1.2.3.4");
  });
});

describe("contactGoal", () => {
  it("maps contact links to goals", () => {
    expect(contactGoal("https://wa.me/905455550555?text=hi")).toBe("whatsapp_click");
    expect(contactGoal("https://t.me/AZPOproperties")).toBe("telegram_click");
    expect(contactGoal("tel:+905455550555")).toBe("phone_click");
    expect(contactGoal("mailto:info@azpo.ru")).toBe("email_click");
    expect(contactGoal("/ru/turkey/")).toBeNull();
  });
});
