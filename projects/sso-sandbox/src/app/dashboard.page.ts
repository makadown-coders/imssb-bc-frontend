import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource } from '@angular/material/table';

type Row = { id: number; unidad: string; clave: string; existencia: number; caduca: string; };

@Component({
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatIconModule],
  template: `
  <div class="cards-grid" style="margin-bottom:16px;">
    <mat-card class="surface-card" style="padding:16px;">
      <div class="mat-title-medium">Solicitudes hoy</div>
      <div class="mat-display-small" style="line-height:1;">18</div>
    </mat-card>
    <mat-card class="surface-card" style="padding:16px;">
      <div class="mat-title-medium">Existencias bajas</div>
      <div class="mat-display-small" style="line-height:1;">42</div>
    </mat-card>
    <mat-card class="surface-card" style="padding:16px;">
      <div class="mat-title-medium">Órdenes en tránsito</div>
      <div class="mat-display-small" style="line-height:1;">7</div>
    </mat-card>
  </div>

  <mat-card class="surface-card" style="padding:16px;">
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
      <span class="mat-title-medium">Existencias por unidad</span>
      <span style="flex:1;"></span>
      <button mat-stroked-button><mat-icon>download</mat-icon> Exportar</button>
    </div>

    <table mat-table [dataSource]="dataSource" matSort class="mat-elevation-z0 mat-mdc-table">

      <ng-container matColumnDef="id">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
        <td mat-cell *matCellDef="let r">{{ r.id }}</td>
      </ng-container>

      <ng-container matColumnDef="unidad">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Unidad</th>
        <td mat-cell *matCellDef="let r">{{ r.unidad }}</td>
      </ng-container>

      <ng-container matColumnDef="clave">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Clave CNIS</th>
        <td mat-cell *matCellDef="let r">{{ r.clave }}</td>
      </ng-container>

      <ng-container matColumnDef="existencia">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Existencia</th>
        <td mat-cell *matCellDef="let r">{{ r.existencia | number }}</td>
      </ng-container>

      <ng-container matColumnDef="caduca">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Caducidad</th>
        <td mat-cell *matCellDef="let r">{{ r.caduca }}</td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>

    <mat-paginator [pageSize]="8" [pageSizeOptions]="[5,8,15,30]"></mat-paginator>
  </mat-card>
  `
})
export class DashboardPage implements OnInit {
  cols = ['id','unidad','clave','existencia','caduca'];
  dataSource = new MatTableDataSource<Row>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    // dummy data
    const rows: Row[] = Array.from({length: 42}).map((_,i) => ({
      id: i+1,
      unidad: `CL-${(100+i).toString().padStart(3,'0')}`,
      clave: `CNIS-${(1000+i)}`,
      existencia: Math.round(Math.random()*500),
      caduca: new Date(Date.now()+Math.random()*2.5e10).toISOString().slice(0,10),
    }));
    this.dataSource.data = rows;
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
