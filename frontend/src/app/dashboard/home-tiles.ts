import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type Tile = {
  title: string;
  subtitle?: string;
  icon: string; // emoji o clase; puedes cambiarlo por material icons si quieres
  route: string;
  accent?: 'green'|'blue'|'yellow'|'orange'|'purple'|'teal';
};

@Component({
  standalone: true,
  selector: 'app-home-tiles',
  imports: [CommonModule, RouterModule],
  templateUrl: './home-tiles.html',
  styleUrls: ['./home-tiles.scss']
})
export class HomeTilesComponent {
  // Apunté las rutas exactamente como tu sidebar
  tiles: Tile[] = [
    { title: 'Realizar una venta', subtitle: 'Contado / apartados', icon: '🛍️', route: '/dashboard/ventas', accent: 'orange' },
    { title: 'Ver inventario', subtitle: 'Registrar y actualizar', icon: '📋', route: '/dashboard/inventario', accent: 'blue' },
    { title: 'Clientes', subtitle: 'Gestión de clientes', icon: '👥', route: '/dashboard/clientes', accent: 'teal' },
    { title: 'Caja', subtitle: 'Entradas / salidas / cierre', icon: '🧾', route: '/dashboard/ventas', accent: 'yellow' },

    { title: 'Proveedores', subtitle: 'Alta y edición', icon: '🏭', route: '/dashboard/proveedores', accent: 'blue' },
    { title: 'Categorías', subtitle: 'Organiza tu catálogo', icon: '🗂️', route: '/dashboard/categorias', accent: 'teal' },
    { title: 'Productos', subtitle: 'CRUD de productos', icon: '🧰', route: '/dashboard/productos', accent: 'green' },
    { title: 'Usuarios', subtitle: 'Roles y permisos', icon: '🛡️', route: '/dashboard/usuarios', accent: 'purple' },

    { title: 'Modificar inventario', subtitle: 'Ajustes y correcciones', icon: '🧮', route: '/dashboard/inventario-modificar', accent: 'orange' },
    { title: 'Reporte inventario', subtitle: 'Existencias y mínimos', icon: '📦', route: '/dashboard/reporte-inventario', accent: 'yellow' },
    { title: 'Orden de compra', subtitle: 'Crear y administrar', icon: '📝', route: '/dashboard/orden-compra', accent: 'blue' },
    { title: 'Recepción de compra', subtitle: 'Recepciona tus compras', icon: '📥', route: '/dashboard/recepcion-compra', accent: 'green' },
  ];
}
