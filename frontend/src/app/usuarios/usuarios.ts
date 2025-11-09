import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { UsuariosService } from './usuarios.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.scss']
})
export class UsuariosComponent implements OnInit {
  listaUsuarios: any[] = [];
  usuario: any = {};
  editando = false;
  idEditando: number | null = null;
  mostrarModal = false; // 👈 controla la ventana emergente

  constructor(private usuariosService: UsuariosService) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (data) => (this.listaUsuarios = data),
      error: (err) => console.error('Error al cargar usuarios:', err)
    });
  }

  abrirModal(u?: any) {
    this.editando = !!u;
    this.idEditando = u?.id_usuario || null;
    this.usuario = u
      ? { ...u }
      : {
          nombre: '',
          apellido: '',
          usuario: '',
          password: '',
          rol: 'VENDEDOR',
          correo: '',
          telefono: '',
          estado: 'ACTIVO'
        };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardarUsuario() {
    const peticion = this.editando
      ? this.usuariosService.actualizarUsuario(this.idEditando!, this.usuario)
      : this.usuariosService.crearUsuario(this.usuario);

    peticion.subscribe({
      next: () => {
        this.cargarUsuarios();
        this.mostrarModal = false;
        Swal.fire({
          icon: 'success',
          title: this.editando ? 'Usuario actualizado' : 'Usuario creado',
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
      title: '¿Eliminar usuario?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuariosService.eliminarUsuario(id).subscribe({
          next: () => {
            this.cargarUsuarios();
            Swal.fire({
              icon: 'success',
              title: 'Usuario eliminado',
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
