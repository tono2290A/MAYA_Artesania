import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { GuiasService } from './guias.service';

@Component({
  selector: 'app-guias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './guias.html',
  styleUrls: ['./guias.scss']
})
export class GuiasComponent implements OnInit {
  listaGuias: any[] = [];
  guia: any = {};
  editando = false;
  idEditando: number | null = null;
  mostrarModal = false;

  constructor(private guiasService: GuiasService) {}

  ngOnInit() {
    this.cargarGuias();
  }

  cargarGuias() {
    this.guiasService.obtenerGuias().subscribe({
      next: (data) => (this.listaGuias = data),
      error: (err) => console.error('Error al cargar guías:', err)
    });
  }

  abrirModal(g?: any) {
    this.editando = !!g;
    this.idEditando = g?.id_guia || null;
    this.guia = g
      ? { ...g }
      : {
          nombre: '',
          apellido: '',
          telefono: '',
          correo: '',
          lugar: '',
          nota: '',
          estado: 'ACTIVO'
        };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardarGuia() {
    const peticion = this.editando
      ? this.guiasService.actualizarGuia(this.idEditando!, this.guia)
      : this.guiasService.crearGuia(this.guia);

    peticion.subscribe({
      next: () => {
        this.cargarGuias();
        this.mostrarModal = false;
        Swal.fire({
          icon: 'success',
          title: this.editando ? 'Guía actualizada' : 'Guía creada',
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
      title: '¿Eliminar guía?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.guiasService.eliminarGuia(id).subscribe({
          next: () => {
            this.cargarGuias();
            Swal.fire({
              icon: 'success',
              title: 'Guía eliminada',
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
