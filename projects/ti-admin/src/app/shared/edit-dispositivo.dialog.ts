// projects/ti-admin/src/app/shared/edit-dispositivo.dialog.ts
import { CommonModule } from '@angular/common';
import { Component, computed, inject, Inject, OnInit, signal } from '@angular/core';
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
    imports: [CommonModule, ReactiveFormsModule, FormsModule,
        MatDialogModule, MatDialogTitle,
        MatButtonModule, MatFormFieldModule, MatInputModule,
        MatSelectModule, MatIconModule,
    ],
    selector: 'ti-edit-dispositivo-dialog',
    templateUrl: 'edit-dispositivo.dialog.html',
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

    private ref = inject(MatDialogRef<EditDispositivoDialog>);
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

    // MACs existentes
    macs = signal<NicItem[]>(Array.isArray(this.data.macs) ? this.data.macs : []);

    // Alta rápida (simplificada)
    newMac = signal<string>('');
    newKind = signal<'ethernet' | 'wifi' | 'mgmt' | 'bt' | 'other'>('ethernet');

    // UX validación
    macError = signal<string | null>(null);
    macPreview = signal<string | null>(null);
    canAddMac = computed(() => !!this.macPreview() && !this.macError());

    close() { this.ref.close(false); }

    onNewMacChange(val: string) {
        this.newMac.set(val);
        const raw = (val || '').trim();
        if (!raw) { this.macError.set('Captura una MAC.'); this.macPreview.set(null); return; }

        const hex = raw.replace(/[^0-9a-f]/gi, '');
        if (hex.length !== 12) { this.macError.set('Debe tener 12 dígitos hexadecimales.'); this.macPreview.set(null); return; }

        const pretty = normalizeMac(raw);
        if (!pretty) { this.macError.set('Formato inválido.'); this.macPreview.set(null); return; }

        const dup = this.macs().some(m => normalizeMac(m.mac) === pretty);
        if (dup) { this.macError.set('Esta MAC ya está en la lista.'); this.macPreview.set(null); return; }

        this.macError.set(null);
        this.macPreview.set(pretty);
    }

    addMac() {
        if (!this.canAddMac()) return;
        const pretty = this.macPreview() || normalizeMac(this.newMac());

        this.macs.update(arr => [
            ...arr,
            {
                mac: pretty,
                // 👇 “tras bambalinas”: interfaz = tipo, en_uso = true
                iface_name: this.newKind(),   // mismo valor que el tipo
                kind: this.newKind(),
                en_uso: true,
            }
        ]);

        // reset
        this.newMac.set('');
        this.newKind.set('ethernet');
        this.macError.set(null);
        this.macPreview.set(null);
    }

    removeMac(i: number) {
        this.macs.update(arr => arr.filter((_, idx) => idx !== i));
        this.onNewMacChange(this.newMac());
    }

    save() {
        // Si hay una MAC válida pendiente, agrégala automáticamente
        if (this.canAddMac()) {
            this.addMac();
        }

        // Si lo que hay escrito es inválido, no permitimos guardar
        if ((this.newMac()?.trim() || '') && this.macError()) {
            return; // la UI mostrará el <mat-error>
        }

        if (this.f.invalid) return;
        this.saving = true;

        const body = {
            ...this.f.value,
            nics: this.macs().map(m => ({
                id: m.id,
                mac: normalizeMac(m.mac),
                // tras bambalinas:
                iface_name: m.iface_name ?? (m.kind ?? 'ethernet'),
                kind: m.kind ?? 'ethernet',
                en_uso: m.en_uso ?? true,
            })),
        };

        this.api.updateBasic(this.data.id, body).subscribe({
            next: _ => { this.saving = false; this.ref.close(true); },
            error: _ => { this.saving = false; this.ref.close(false); }
        });
    }
}