import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ProductosService } from './productos.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.scss']
})
export class ProductosComponent implements OnInit {
  listaProductos: any[] = [];
  listaCategorias: any[] = [];
  producto: any = {};
  mostrarModal = false;
  editando = false;
  idEditando: number | null = null;

  constructor(private productosService: ProductosService) {}

  ngOnInit() {
    this.cargarProductos();
    this.cargarCategorias();
  }

  cargarProductos() {
    this.productosService.obtenerProductos().subscribe({
      next: (data) => (this.listaProductos = data),
      error: (err) => console.error(err)
    });
  }

  cargarCategorias() {
    this.productosService.obtenerCategorias().subscribe({
      next: (data) => (this.listaCategorias = data),
      error: (err) => console.error(err)
    });
  }

  abrirModal(p?: any) {
    this.editando = !!p;
    this.idEditando = p?.id_producto || null;
    this.producto = p
      ? { ...p }
      : { codigo_producto: '', nombre: '', id_categoria: '', precio_compra: 0, precio_venta: 0, ganancia: 0 };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  calcularGanancia() {
    const compra = parseFloat(this.producto.precio_compra) || 0;
    const venta = parseFloat(this.producto.precio_venta) || 0;
    if (compra > 0) {
      this.producto.ganancia = (((venta - compra) / compra) * 100).toFixed(2);
    }
  }

  calcularVentaDesdeGanancia() {
    const compra = parseFloat(this.producto.precio_compra) || 0;
    const ganancia = parseFloat(this.producto.ganancia) || 0;
    this.producto.precio_venta = (compra + (compra * ganancia / 100)).toFixed(2);
  }

  guardarProducto() {
    const peticion = this.editando
      ? this.productosService.actualizarProducto(this.idEditando!, this.producto)
      : this.productosService.crearProducto(this.producto);

    peticion.subscribe({
      next: () => {
        this.cargarProductos();
        this.mostrarModal = false;
        Swal.fire({
          icon: 'success',
          title: this.editando ? 'Producto actualizado' : 'Producto agregado',
          showConfirmButton: false,
          timer: 1500
        });
      },
      error: (err) => Swal.fire('Error', 'No se pudo guardar el producto', 'error')
    });
  }

  eliminarProducto(id: number) {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#b71c1c',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Sí, eliminar'
    }).then((res) => {
      if (res.isConfirmed) {
        this.productosService.eliminarProducto(id).subscribe({
          next: () => {
            this.cargarProductos();
            Swal.fire('Eliminado', 'El producto fue eliminado', 'success');
          }
        });
      }
    });
  }
}
