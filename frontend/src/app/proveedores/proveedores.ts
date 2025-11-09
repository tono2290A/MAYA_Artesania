import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ProveedoresService } from './proveedores.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.html',
  styleUrls: ['./proveedores.scss']
})
export class ProveedoresComponent implements OnInit {
  listaProveedores: any[] = [];
  proveedor: any = {};
  editando = false;
  idEditando: number | null = null;
  mostrarModal = false;

  constructor(private proveedoresService: ProveedoresService) {}

  ngOnInit() {
    this.cargarProveedores();
  }

  cargarProveedores() {
    this.proveedoresService.obtenerProveedores().subscribe({
      next: (data) => (this.listaProveedores = data),
      error: (err) => console.error('Error al cargar proveedores:', err)
    });
  }

  abrirModal(p?: any) {
    this.editando = !!p;
    this.idEditando = p?.id_proveedor || null;
    this.proveedor = p
      ? { ...p }
      : {
          nombre: '',
          empresa: '',
          telefono: '',
          correo: '',
          direccion: '',
          estado: 'ACTIVO'
        };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardarProveedor() {
    const peticion = this.editando
      ? this.proveedoresService.actualizarProveedor(this.idEditando!, this.proveedor)
      : this.proveedoresService.crearProveedor(this.proveedor);

    peticion.subscribe({
      next: () => {
        this.cargarProveedores();
        this.mostrarModal = false;
        Swal.fire({
          icon: 'success',
          title: this.editando ? 'Proveedor actualizado' : 'Proveedor creado',
          showConfirmButton: false,
          timer: 1500
        });
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        Swal.fire('Error', 'Ocurrió un problema al guardar.', 'error');
      }
    });
  }

  confirmarEliminar(id: number) {
    Swal.fire({
      title: '¿Eliminar proveedor?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.proveedoresService.eliminarProveedor(id).subscribe({
          next: () => {
            this.cargarProveedores();
            Swal.fire({
              icon: 'success',
              title: 'Proveedor eliminado',
              showConfirmButton: false,
              timer: 1500
            });
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar', 'error')
        });
      }
    });
  }
}
