
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PerifericoData } from '../models';
import { DispositivosService } from '../services/dispositivos.service';
import { CatalogosService } from '../services/catalogos.service';

@Component({
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule,
        MatDialogModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule, MatCheckboxModule
    ],
    selector: 'ti-edit-periferico-dialog',
    templateUrl: 'edit-periferico.dialog.html'
})

export class EditPerifericoDialog implements OnInit {
    private api = inject(DispositivosService);
    private cat = inject(CatalogosService);
    private ref = inject(MatDialogRef<EditPerifericoDialog>);
    data: PerifericoData = inject(MAT_DIALOG_DATA);

    tipos = signal<{ value: number; label: string }[]>([]);
    saving = signal(false);
    f = inject(FormBuilder).group({
        tipo_id: [this.data?.periferico?.tipo_id ?? null, Validators.required],
        serial: [this.data?.periferico?.serial ?? null],
        marca: [this.data?.periferico?.marca ?? null],
        modelo: [this.data?.periferico?.modelo ?? null],
    });

    ngOnInit(): void {
        this.cat.tiposPeriferico().subscribe(lista => {
            const list = lista.map(t => ({ value: t.id, label: t.nombre.toUpperCase() }))
            this.tipos.set(list);
            const cur = this.data?.periferico?.tipo_id;
            if (!this.f.get('tipo_id')!.value) {
                this.f.get('tipo_id')!.setValue(cur ?? this.tipos()[0]?.value ?? null);
            }
        });
    }

    get isEdit() { return !!this.data?.periferico?.id; }
    get title() { return this.isEdit ? 'Editar periférico' : 'Agregar periférico'; }

    close() { this.ref.close(false); }

    save() {
        if (this.f.invalid) return;
        this.saving.set(true);
        const v = this.f.value;
        const payload = {
            id: this.data?.periferico?.id,
            tipo_id: Number(v.tipo_id),              // 👈 ID, no nombre
            serial: v.serial ?? null,
            marca: v.marca ?? null,
            modelo: v.modelo ?? null,
        };
        this.api.savePeriferico(this.data.dispositivo_id, payload).subscribe({
            next: _ => { this.saving.set(false); this.ref.close(true); },
            error: _ => { this.saving.set(false); this.ref.close(false); }
        });
    }
}