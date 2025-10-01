import { EstadoView } from "../models";

function norm(s?: string) {
  return (s ?? '')
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toUpperCase();
}

// Mapea tus 3 estados: En Uso / En Reparación / En Resguardo
export function estadoView(label?: string): EstadoView {
  const raw = (label ?? '').trim();
  const t = norm(raw);
  if (t.includes('USO'))      return { cls: 'chip--uso',         label: raw || 'En Uso',        icon: 'check_circle' };
  if (t.includes('REPAR'))    return { cls: 'chip--reparacion',  label: raw || 'En Reparación', icon: 'build' };
  if (t.includes('RESGU'))    return { cls: 'chip--resguardo',   label: raw || 'En Resguardo',  icon: 'inventory_2' };
  return { cls: 'chip--desconocido', label: raw || '—', icon: 'help' };
}

export function iconForEstado(label?: string) {
  return estadoView(label).icon;
}