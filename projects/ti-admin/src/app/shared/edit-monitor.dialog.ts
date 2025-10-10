
import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { EditMonitorData } from '../models';
import { DispositivosService } from '../services/dispositivos.service';

@Component({
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule,
        MatDialogModule, MatFormFieldModule, MatInputModule,
        MatCheckboxModule, MatButtonModule, MatIconModule],
    selector: 'ti-edit-monitor-dialog',
    templateUrl: 'edit-monitor.dialog.html'
})

export class EditMonitorDialog {
    private ref = inject(MatDialogRef<EditMonitorDialog>);
    private api = inject(DispositivosService);
    readonly data: EditMonitorData = inject(MAT_DIALOG_DATA);

    saving = false;

    // 📝 Requerimos al menos un valor (serial/marca/modelo) para evitar registros totalmente vacíos.
    private fb = inject(FormBuilder);
    f = this.fb.group({
        serial: [this.data?.monitor?.serial ?? '', []],
        marca: [this.data?.monitor?.marca ?? '', []],
        modelo: [this.data?.monitor?.modelo ?? '', []],
        es_principal: [!!this.data?.monitor?.es_principal]
    });

    get title() {
        return this.data?.monitor?.id ? 'Editar monitor' : 'Agregar monitor';
    }

    close() { this.ref.close(false); }

    save() {
        if (this.saving) return;

        const { serial, marca, modelo, es_principal } = this.f.value;
        const allEmpty =
            (serial ?? '').trim() === '' &&
            (marca ?? '').trim() === '' &&
            (modelo ?? '').trim() === '';
        if (allEmpty) {
            // opcional: mostrar snackbar/toast
            return;
        }

        this.saving = true;
        const payload = {
            id: this.data?.monitor?.id,
            serial: (serial ?? '').trim() || null,
            marca: (marca ?? '').trim() || null,
            modelo: (modelo ?? '').trim() || null,
            es_principal: !!es_principal,
        };

        this.api.saveMonitor(this.data.dispositivo_id, payload).subscribe({
            next: _ => { this.saving = false; this.ref.close(true); },
            error: _ => { this.saving = false; /* opcional: snackbar */ }
        });
    }
}