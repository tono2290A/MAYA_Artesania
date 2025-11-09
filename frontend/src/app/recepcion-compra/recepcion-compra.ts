import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { lastValueFrom } from 'rxjs';
import { RecepcionCompraService } from './recepcion-compra.service';

@Component({
  selector: 'app-recepcion-compra',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recepcion-compra.html',
  styleUrls: ['./recepcion-compra.scss']
})
export class RecepcionCompraComponent implements OnInit {
  recepciones: any[] = [];
  ordenes: any[] = [];

  mostrarModal = false;
  mostrarDetalles = false;
  idEdit: number | null = null;

  rcSeleccionada: any = null;

  // 👇 Nombre del proveedor seleccionado (para mostrar en el input readonly)
  proveedorNombre = '';

  cabecera: any = {
    id_orden: '',
    id_proveedor: '',
    no_factura: '',
    fecha_factura: '',
    fecha_recepcion: new Date().toISOString().substring(0, 10),
    observaciones: ''
  };

  detalles: any[] = [];
  manual = { codigo: '', nombre: '', precio_compra: 0, precio_venta: 0, ganancia: 0, cantidad: 1 };

  constructor(public api: RecepcionCompraService) {}

  ngOnInit() {
    this.cargarRecepciones();
    this.cargarOrdenes();
  }

  cargarRecepciones() {
    this.api.listar().subscribe({
      next: (data) => (this.recepciones = data),
      error: (err) => console.error(err)
    });
  }

  async cargarOrdenes() {
    try {
      this.ordenes = await lastValueFrom(this.api.ordenesGeneradas());
    } catch (e) {
      console.error('Error cargando ordenes', e);
    }
  }

  // ===== MODAL =====
  abrirModal() {
    this.mostrarModal = true;
    this.idEdit = null;
    this.cabecera = {
      id_orden: '',
      id_proveedor: '',
      no_factura: '',
      fecha_factura: '',
      fecha_recepcion: new Date().toISOString().substring(0, 10),
      observaciones: ''
    };
    this.detalles = [];
    this.manual = { codigo: '', nombre: '', precio_compra: 0, precio_venta: 0, ganancia: 0, cantidad: 1 };
    this.proveedorNombre = '';
  }

  cerrarModal() { this.mostrarModal = false; }

  // Al cambiar la OC, seteamos proveedor y nombre para mostrar
  onOrdenChange() {
    const idSel = Number(this.cabecera.id_orden || 0);
    const oc = this.ordenes?.find(o => Number(o.id_orden) === idSel);
    this.cabecera.id_proveedor = oc ? oc.id_proveedor : '';
    this.proveedorNombre = oc?.proveedor ?? '';
  }

  // ===== DETALLES / VISTA =====
  verDetalles(rc: any) {
    this.api.obtenerConDetalle(rc.id_recepcion).subscribe({
      next: (data) => { this.rcSeleccionada = data; this.mostrarDetalles = true; },
      error: () => Swal.fire('Error', 'No se pudieron cargar los detalles', 'error')
    });
  }

  cerrarDetalles() { this.mostrarDetalles = false; this.rcSeleccionada = null; }

  // ===== ENTRADA MANUAL =====
  onPrecioChange() {
    this.manual.ganancia = Number(this.manual.precio_venta) - Number(this.manual.precio_compra);
  }

  buscarManual() {
    if (!this.manual.codigo) return;
    this.api.productoPorCodigo(this.manual.codigo).subscribe({
      next: (p) => {
        // Existe → rellena
        this.manual.nombre = p.nombre;
        this.manual.precio_compra = p.precio_compra || 0;
        this.manual.precio_venta = p.precio_venta || 0;
        this.onPrecioChange();
      },
      error: () => {
        Swal.fire('No encontrado', 'El código no existe en Productos', 'warning');
        this.manual.nombre = '';
        this.manual.precio_compra = 0;
        this.manual.precio_venta = 0;
        this.manual.ganancia = 0;
      }
    });
  }

  agregarManual() {
    const m = this.manual;
    if (!m.codigo || !m.cantidad) {
      Swal.fire('Atención', 'Faltan datos del producto', 'warning'); return;
    }
    // Regla: si no hay nombre es porque no existe → no agregar
    if (!m.nombre) {
      Swal.fire('Atención', 'Debe buscar un código válido antes de agregar', 'warning'); return;
    }

    const ya = this.detalles.find(d => d.codigo_producto === m.codigo);
    if (ya) {
      ya.cantidad += Number(m.cantidad);
      ya.precio_compra = Number(m.precio_compra);
      ya.precio_venta  = Number(m.precio_venta);
    } else {
      this.detalles.push({
        codigo_producto: m.codigo,
        nombre_producto: m.nombre,
        cantidad: Number(m.cantidad),
        precio_compra: Number(m.precio_compra),
        precio_venta: Number(m.precio_venta)
      });
    }

    this.manual = { codigo: '', nombre: '', precio_compra: 0, precio_venta: 0, ganancia: 0, cantidad: 1 };
  }

  eliminarProducto(i: number) { this.detalles.splice(i, 1); }

  // ===== GUARDAR =====
  guardar() {
    if (!this.cabecera.id_orden || !this.cabecera.id_proveedor || !this.cabecera.fecha_recepcion) {
      Swal.fire('Atención', 'Seleccione la orden y complete la cabecera', 'warning'); return;
    }
    if (this.detalles.length === 0) {
      Swal.fire('Atención', 'Agregue al menos un producto', 'warning'); return;
    }

    const body = { cabecera: this.cabecera, detalles: this.detalles };
    this.api.crear(body).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Recepción guardada', timer: 1200, showConfirmButton: false });
        this.cerrarModal();
        this.cargarRecepciones();
      },
      error: (e) => {
        Swal.fire('Error', e?.error?.message || 'No se pudo guardar', 'error');
      }
    });
  }

  anular(id: number) {
    Swal.fire({
      title: 'Anular recepción',
      text: 'Esto revertirá las cantidades de inventario',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    }).then(res => {
      if (res.isConfirmed) {
        this.api.anular(id, 'Anulación por usuario').subscribe({
          next: () => { Swal.fire('Listo', 'Recepción anulada', 'success'); this.cargarRecepciones(); this.cerrarDetalles(); },
          error: (e) => Swal.fire('Error', e?.error?.message || 'No se pudo anular', 'error')
        });
      }
    });
  }
}
