import { ImageResponse } from "next/og";

export const alt = "AZPO Estate — недвижимость в Турции";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#2e5a90", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="96" height="72" viewBox="0 0 1036 313"><path d="M729.982 311.172H620.775L731.576 56.6307C746.451 22.4607 776.668 0.908203 809.701 0.908203H905.411L788.533 269.41C777.385 295.019 754.739 311.172 729.982 311.172Z" fill="white"/><path d="M914.244 312.011H1035.63L986.733 195.341C981.516 183.795 971.21 176.562 959.978 176.562H829.469L874.907 283.607C882.289 300.998 897.541 312.011 914.244 312.011Z" fill="#3FB9E7"/></svg>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 40, lineHeight: 1.1 }}>
            <span style={{ fontWeight: 700 }}>AZPO</span>
            <span>Estate</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>Недвижимость в Турции</div>
          <div style={{ fontSize: 32, marginTop: 20, color: "#d6e4f4" }}>Алания · Анталия · Стамбул · Фетхие · Мерсин · Бодрум</div>
        </div>
      </div>
    ),
    size,
  );
}
