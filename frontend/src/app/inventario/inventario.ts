import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { InventarioService } from './inventario.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrls: ['./inventario.scss']
})
export class InventarioComponent implements OnInit {
  listaInventario: any[] = [];
  mostrarModal = false;

  producto: any = {
    codigo_producto: '',
    nombre_producto: '',
    cantidad: 0,
    stock_minimo: 0
  };

  constructor(private inventarioService: InventarioService) {}

  ngOnInit(): void {
    this.cargarInventario();
  }

  // 🔹 Cargar todos los registros del inventario
  cargarInventario(): void {
    this.inventarioService.obtenerInventario().subscribe({
      next: (data) => (this.listaInventario = data),
      error: (err) => console.error('Error al cargar inventario:', err)
    });
  }

  // 🔹 Buscar producto automáticamente al ingresar código
  buscarProductoPorCodigo(): void {
    if (!this.producto.codigo_producto) return;
    this.inventarioService.buscarPorCodigo(this.producto.codigo_producto).subscribe({
      next: (data) => {
        this.producto.nombre_producto = data?.nombre || '';
      },
      error: () => {
        this.producto.nombre_producto = '';
      }
    });
  }

  // 🔹 Abrir modal
  abrirModal(): void {
    this.producto = { codigo_producto: '', nombre_producto: '', cantidad: 0, stock_minimo: 0 };
    this.mostrarModal = true;
  }

  // 🔹 Cerrar modal
  cerrarModal(): void {
    this.mostrarModal = false;
  }

  // 🔹 Guardar inventario con validaciones
  guardarInventario(): void {
    if (!this.producto.codigo_producto || !this.producto.cantidad) {
      Swal.fire('Campos vacíos', 'Por favor completa los campos obligatorios.', 'warning');
      return;
    }

    this.inventarioService.agregarInventario(this.producto).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: res.message,
          showConfirmButton: false,
          timer: 1500
        });
        this.cargarInventario();
        this.cerrarModal();
      },
      error: (err) => {
        console.error('Error al agregar inventario:', err);
        Swal.fire('Error', 'No se pudo guardar el inventario.', 'error');
      }
    });
  }
}
