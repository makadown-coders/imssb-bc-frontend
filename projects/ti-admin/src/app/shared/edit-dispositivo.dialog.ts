// projects/ti-admin/src/app/shared/edit-dispositivo.dialog.ts
import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DispositivosService } from '../services/dispositivos.service';
import { MAC_RE, NicItem, normalizeMac } from '../models/DispositivoNic';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';

@Component({
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, 
        MatButtonModule, MatFormFieldModule, 
        MatInputModule, FormsModule, 
        MatSelectModule, MatCheckboxModule, MatIconModule,
        MatDialogModule, MatDialogTitle
    ],
    selector: 'ti-edit-dispositivo-dialog',
    templateUrl: 'edit-dispositivo.dialog.html',
    styles: [`.p-16{padding:16px}
    .full{width:100%}
    .mac-row{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px dashed rgba(0,0,0,.08)}
    .mac-row .spacer{flex:1}
    .mac-row code{font-weight:700}
    .grid-4{display:grid;grid-template-columns:1.2fr 1fr 1fr auto;gap:12px;align-items:center}
    .row-right{display:flex;align-items:center;gap:8px;justify-content:flex-end}
    .muted{opacity:.8}`]
})

export class EditDispositivoDialog {
    public data: {
        id: number;
        serial?: string | null;
        marca?: string | null;
        modelo?: string | null;
        ip?: string | null;
        conexion?: string | null;
        observaciones?: string | null;
        macs?: NicItem[];
    } = inject(MAT_DIALOG_DATA);
    private ref: MatDialogRef<EditDispositivoDialog> = inject(MatDialogRef);
    private api = inject(DispositivosService);
    saving = false;

    f = new FormGroup({
        serial: new FormControl(this.data?.serial ?? '-', { nonNullable: true }),
        marca: new FormControl(this.data?.marca ?? '-', { nonNullable: true }),
        modelo: new FormControl(this.data?.modelo ?? '-', { nonNullable: true }),      
        ip: new FormControl(this.data?.ip ?? '-', { nonNullable: true }),
        conexion: new FormControl(this.data?.conexion ?? '-', { nonNullable: true }),
        observaciones: new FormControl(this.data?.observaciones ?? '-', { nonNullable: true }),
    });
    macs = signal<NicItem[]>(Array.isArray(this.data.macs) ? this.data.macs : []);
    newMac = signal<string>('');
    newIface = signal<string>('');
    newKind = signal<'ethernet' | 'wifi' | 'mgmt' | 'bt' | 'other'>('ethernet');
    newEnUso = signal<boolean>(false);

    close() { this.ref.close(false); }

    addMac() {
        const raw = (this.newMac() || '').trim();
        if (!MAC_RE.test(raw)) return; // valida
        const pretty = normalizeMac(raw);

        // evita duplicados locales por mac normalizada
        const exists = this.macs().some(m => normalizeMac(m.mac) === pretty);
        if (exists) return;

        this.macs.update(arr => [...arr, {
            mac: pretty,
            iface_name: this.newIface() || undefined,
            kind: this.newKind(),
            en_uso: this.newEnUso()
        }]);

        this.newMac.set(''); this.newIface.set(''); this.newKind.set('ethernet'); this.newEnUso.set(false);
    }

    toggleEnUso(i: number) {
        this.macs.update(arr => arr.map((m, idx) => idx === i ? { ...m, en_uso: !m.en_uso } : m));
    }

    removeMac(i: number) {
        this.macs.update(arr => arr.filter((_, idx) => idx !== i));
    }

    save() {
        if (this.f.invalid) return;
        this.saving = true;

        // 👇 ahora también mandamos las NICs
        const body = {
            ...this.f.value,
            nics: this.macs().map(m => ({
                id: m.id,                             // si existe
                mac: normalizeMac(m.mac),             // normalizada
                iface_name: m.iface_name ?? null,
                kind: m.kind ?? 'ethernet',
                en_uso: !!m.en_uso,
            })),
        };

        this.api.updateBasic(this.data.id, body).subscribe({
            next: _ => { this.saving = false; this.ref.close(true); },
            error: _ => { this.saving = false; this.ref.close(false); }
        });
    }
}