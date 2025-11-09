import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { CategoriasService } from './categorias.service';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.html',
  styleUrls: ['./categorias.scss']
})
export class CategoriasComponent implements OnInit {
  listaCategorias: any[] = [];
  categoria: any = {};
  editando = false;
  idEditando: number | null = null;
  mostrarModal = false;

  constructor(private categoriasService: CategoriasService) {}

  ngOnInit() {
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.categoriasService.obtenerCategorias().subscribe({
      next: (data) => (this.listaCategorias = data),
      error: (err) => console.error('Error al cargar categorías:', err)
    });
  }

  abrirModal(c?: any) {
    this.editando = !!c;
    this.idEditando = c?.id_categoria || null;
    this.categoria = c ? { ...c } : { nombre_categoria: '' };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardarCategoria() {
    const peticion = this.editando
      ? this.categoriasService.actualizarCategoria(this.idEditando!, this.categoria)
      : this.categoriasService.crearCategoria(this.categoria);

    peticion.subscribe({
      next: () => {
        this.cargarCategorias();
        this.mostrarModal = false;
        Swal.fire({
          icon: 'success',
          title: this.editando ? 'Categoría actualizada' : 'Categoría creada',
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
      title: '¿Eliminar categoría?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoriasService.eliminarCategoria(id).subscribe({
          next: () => {
            this.cargarCategorias();
            Swal.fire({
              icon: 'success',
              title: 'Categoría eliminada',
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
