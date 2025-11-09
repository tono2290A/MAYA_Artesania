import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ClientesService } from './clientes.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.scss']
})
export class ClientesComponent implements OnInit {
  listaClientes: any[] = [];
  cliente: any = {};
  editando = false;
  idEditando: number | null = null;
  mostrarModal = false;

  constructor(private clientesService: ClientesService) {}

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.clientesService.obtenerClientes().subscribe({
      next: (data) => (this.listaClientes = data),
      error: (err) => console.error('Error al cargar clientes:', err)
    });
  }

  abrirModal(c?: any) {
    this.editando = !!c;
    this.idEditando = c?.id_cliente || null;
    this.cliente = c
      ? { ...c }
      : {
          nombre: '',
          apellido: '',
          nit: '',
          telefono: '',
          correo: '',
          tipo_cliente: 'NORMAL'
        };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardarCliente() {
    const peticion = this.editando
      ? this.clientesService.actualizarCliente(this.idEditando!, this.cliente)
      : this.clientesService.crearCliente(this.cliente);

    peticion.subscribe({
      next: () => {
        this.cargarClientes();
        this.mostrarModal = false;
        Swal.fire({
          icon: 'success',
          title: this.editando ? 'Cliente actualizado' : 'Cliente creado',
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
      title: '¿Eliminar cliente?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clientesService.eliminarCliente(id).subscribe({
          next: () => {
            this.cargarClientes();
            Swal.fire({
              icon: 'success',
              title: 'Cliente eliminado',
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
