import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { InventarioModificarService } from './inventario-modificar.service';

@Component({
  selector: 'app-inventario-modificar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario-modificar.html',
  styleUrls: ['./inventario-modificar.scss']
})
export class InventarioModificarComponent implements OnInit {
  listaInventario: any[] = [];
  producto: any = {};
  mostrarModal = false;

  constructor(private inventarioService: InventarioModificarService) {}

  ngOnInit(): void {
    this.cargarInventario();
  }

  cargarInventario(): void {
    this.inventarioService.obtenerInventario().subscribe({
      next: (data) => (this.listaInventario = data),
      error: (err) => console.error('Error al cargar inventario:', err)
    });
  }

  abrirModal(): void {
    this.producto = {};
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  buscarProducto(): void {
    if (!this.producto.codigo_producto) return;

    this.inventarioService.buscarPorCodigo(this.producto.codigo_producto).subscribe({
      next: (res) => {
        this.producto = res;
        Swal.fire({
          icon: 'info',
          title: 'Producto encontrado',
          text: res.nombre_producto,
          showConfirmButton: false,
          timer: 1000
        });
      },
      error: () => Swal.fire('Atención', 'Producto no encontrado', 'warning')
    });
  }

  guardarCambios(): void {
    if (!this.producto.codigo_producto) {
      Swal.fire('Error', 'Debe ingresar un código de producto', 'error');
      return;
    }

    this.inventarioService.actualizarInventario(this.producto).subscribe({
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
      error: () => Swal.fire('Error', 'No se pudo actualizar el inventario', 'error')
    });
  }
}
