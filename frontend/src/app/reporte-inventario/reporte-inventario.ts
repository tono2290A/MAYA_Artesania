import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteInventarioService } from './reporte-inventario.service';

@Component({
  selector: 'app-reporte-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-inventario.html',
  styleUrls: ['./reporte-inventario.scss']
})
export class ReporteInventarioComponent implements OnInit {
  listaInventario: any[] = [];
  categorias: any[] = [];
  categoriaSeleccionada: string = '';

  constructor(private reporteService: ReporteInventarioService) {}

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarReporte();
  }

  cargarCategorias(): void {
    this.reporteService.obtenerCategorias().subscribe({
      next: (data) => (this.categorias = data),
      error: (err) => console.error('Error al cargar categorías', err)
    });
  }

  cargarReporte(): void {
    this.reporteService.obtenerReporte(this.categoriaSeleccionada).subscribe({
      next: (data) => (this.listaInventario = data),
      error: (err) => console.error('Error al cargar reporte', err)
    });
  }

  filtrar(): void {
    this.cargarReporte();
  }
}
