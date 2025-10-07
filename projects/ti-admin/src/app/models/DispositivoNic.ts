// projects/ti-admin/src/app/models/DispositivoNic.ts
export type DispositivoNic = {
  id?: number;
  mac: string;
  iface_name?: string | null;
  kind?: 'ethernet' | 'wifi' | 'mgmt' | 'bt' | 'other';
  en_uso?: boolean;
};

export type NicItem = { id?: number; mac: string; iface_name?: string; kind?: 'ethernet'|'wifi'|'mgmt'|'bt'|'other'; en_uso?: boolean };

export const MAC_RE = /^([0-9a-f]{2}([-:]?)){5}[0-9a-f]{2}$/i;
export const normalizeMac = (s: string) => s.replace(/[^0-9a-f]/gi, '').toLowerCase().match(/.{1,2}/g)?.join(':') ?? '';
