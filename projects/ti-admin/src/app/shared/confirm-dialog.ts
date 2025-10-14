import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
    standalone: true,
    imports: [CommonModule, MatDialogModule,MatButtonModule],
    selector: 'confirm-dialog',
    templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
    readonly dialogRef = inject(MatDialogRef<ConfirmDialog>);
    readonly data = inject<{title: string, message: string}>(MAT_DIALOG_DATA);
}

