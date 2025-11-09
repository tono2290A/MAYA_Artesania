import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { lastValueFrom } from 'rxjs';
import { OrdenCompraService } from './orden-compra.service';

@Component({
  selector: 'app-orden-compra',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orden-compra.html',
  styleUrls: ['./orden-compra.scss']
})
export class OrdenCompraComponent implements OnInit {
  ordenes: any[] = [];
  proveedores: any[] = [];
  sugeridos: any[] = [];

  mostrarModal = false;
  mostrarDetalles = false;
  editando = false;
  idEdit: number | null = null;

  ordenSeleccionada: any = null;

  cabecera: any = {
    id_proveedor: '',
    fecha_orden: new Date().toISOString().substring(0, 10),
    solicitado_por: '',
    telefono: '',
    comentario: ''
  };

  detalles: any[] = [];
  manual = { codigo: '', nombre: '', precio_compra: 0, cantidad: 1 };

  constructor(public api: OrdenCompraService) {}

  ngOnInit() {
    this.cargarOrdenes();
  }

  // === CARGAS BASE ===
  cargarOrdenes() {
    this.api.listar().subscribe({
      next: (data) => (this.ordenes = data),
      error: (err) => console.error(err)
    });
  }

  async cargarUtilidades() {
    try {
      const [prov, sug] = await Promise.all([
        lastValueFrom(this.api.proveedores()),
        lastValueFrom(this.api.sugerencias())
      ]);
      this.proveedores = prov;
      this.sugeridos = sug;
    } catch (e) {
      console.error('Error cargando utilidades:', e);
    }
  }

  // === MODAL CREAR / EDITAR ===
  async abrirModal(nueva = true, orden?: any) {
    this.mostrarModal = true;
    this.editando = !nueva;

    if (nueva) {
      this.idEdit = null;
      this.cabecera = {
        id_proveedor: '',
        fecha_orden: new Date().toISOString().substring(0, 10),
        solicitado_por: '',
        telefono: '',
        comentario: ''
      };
      this.detalles = [];
      this.manual = { codigo: '', nombre: '', precio_compra: 0, cantidad: 1 };
      await this.cargarUtilidades();
    } else {
      try {
        this.idEdit = orden.id_orden;
        await this.cargarUtilidades();

        // Si viene con datos (desde editarDesdeDetalles)
        if (orden.cabecera && orden.detalles) {
          this.cabecera = { ...orden.cabecera };
          this.detalles = [...orden.detalles];
        } else {
          const r = await lastValueFrom(this.api.obtener(this.idEdit!));
          this.cabecera = r.cabecera;
          this.detalles = r.detalles;
        }

        // Normalizar
        this.cabecera.id_proveedor = Number(this.cabecera.id_proveedor || 0);
        this.cabecera.fecha_orden = (this.cabecera.fecha_orden || '').toString().substring(0, 10);
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'No se pudo cargar la orden', 'error');
      }
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  // === DETALLES ===
  verDetalles(orden: any) {
    this.api.obtenerConDetalle(orden.id_orden).subscribe({
      next: (data) => {
        this.ordenSeleccionada = data;
        this.mostrarDetalles = true;
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar los detalles', 'error')
    });
  }

  cerrarDetalles() {
    this.mostrarDetalles = false;
    this.ordenSeleccionada = null;
  }

  // ✅ Arreglado: abrir edición SIN cerrar antes
  async editarDesdeDetalles() {
    if (!this.ordenSeleccionada) return;

    try {
      // Primero carga utilidades para tener proveedores
      await this.cargarUtilidades();

      // Prepara los datos de la orden actual
      const data = {
        id_orden: this.ordenSeleccionada.id_orden,
        cabecera: {
          id_orden: this.ordenSeleccionada.id_orden,
          id_proveedor: this.buscarIdProveedorPorNombre(this.ordenSeleccionada.proveedor),
          fecha_orden: this.ordenSeleccionada.fecha_orden,
          solicitado_por: this.ordenSeleccionada.solicitado_por,
          telefono: this.ordenSeleccionada.telefono,
          comentario: this.ordenSeleccionada.comentario,
          estado: this.ordenSeleccionada.estado,
          total: this.ordenSeleccionada.total,
          proveedor: this.ordenSeleccionada.proveedor
        },
        detalles: this.ordenSeleccionada.detalle
      };

      // Oculta detalles y abre edición después de un microdelay (para evitar bloqueo del DOM)
      this.mostrarDetalles = false;
      setTimeout(() => {
        this.abrirModal(false, data);
      }, 150);
    } catch (e) {
      console.error('Error al pasar a edición:', e);
      Swal.fire('Error', 'No se pudo abrir el modo edición', 'error');
    }
  }

  buscarIdProveedorPorNombre(nombre: string): number {
    const prov = this.proveedores.find((p) => p.nombre === nombre);
    return prov ? prov.id_proveedor : 0;
  }

  // === DETALLES DE PRODUCTO ===
  aceptarSugerido(s: any) {
    const ya = this.detalles.find((d) => d.codigo_producto === s.codigo_producto);
    if (ya) ya.cantidad += s.sugerido;
    else {
      this.detalles.push({
        codigo_producto: s.codigo_producto,
        nombre_producto: s.descripcion,
        cantidad: s.sugerido,
        precio_compra: s.precio_compra
      });
    }
  }

  buscarManual() {
    if (!this.manual.codigo) return;
    this.api.productoPorCodigo(this.manual.codigo).subscribe({
      next: (p) => {
        this.manual.nombre = p.nombre;
        this.manual.precio_compra = p.precio_compra;
      },
      error: () => Swal.fire('No encontrado', 'Código inválido', 'warning')
    });
  }

  agregarManual() {
    if (!this.manual.codigo || !this.manual.cantidad) {
      Swal.fire('Atención', 'Faltan datos del producto', 'warning');
      return;
    }

    const ya = this.detalles.find((d) => d.codigo_producto === this.manual.codigo);
    if (ya) ya.cantidad += Number(this.manual.cantidad);
    else {
      this.detalles.push({
        codigo_producto: this.manual.codigo,
        nombre_producto: this.manual.nombre,
        cantidad: this.manual.cantidad,
        precio_compra: this.manual.precio_compra
      });
    }

    this.manual = { codigo: '', nombre: '', precio_compra: 0, cantidad: 1 };
  }

  eliminarProducto(i: number) {
    this.detalles.splice(i, 1);
  }

  // === CRUD ===
  guardar() {
    if (!this.cabecera.id_proveedor || this.detalles.length === 0) {
      Swal.fire('Atención', 'Completa los campos y agrega productos', 'warning');
      return;
    }

    const body = { cabecera: this.cabecera, detalles: this.detalles };
    const req =
      this.editando && this.idEdit
        ? this.api.actualizar(this.idEdit, body)
        : this.api.crear(body);

    req.subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Orden guardada correctamente',
          timer: 1200,
          showConfirmButton: false
        });
        this.cerrarModal();
        this.cargarOrdenes();
      },
      error: () => Swal.fire('Error', 'No se pudo guardar', 'error')
    });
  }

  eliminarOrden(id: number) {
    Swal.fire({
      title: '¿Eliminar orden?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed) {
        this.api.eliminar(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Orden eliminada correctamente', 'success');
            this.cargarOrdenes();
            this.cerrarDetalles();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar', 'error')
        });
      }
    });
  }

  exportarPDF(id: number) {
    const url = `http://localhost:4000/api/orden-compra/${id}/pdf`;
    window.open(url, '_blank');
  }
}
