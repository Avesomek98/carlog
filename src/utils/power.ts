// Moc: kW <-> KM (koń mechaniczny / metryczny, PS). 1 kW = 1.35962 KM.
// Nazwa "hp" w kodzie celowo zamiast "km", żeby nie kolidować z kilometrami.
const KW_TO_HP = 1.35962;

export function kwToHp(kw: number): number {
  return Math.round(kw * KW_TO_HP);
}

export function hpToKw(hp: number): number {
  return Math.round(hp / KW_TO_HP);
}
