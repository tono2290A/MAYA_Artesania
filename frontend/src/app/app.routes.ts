import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { DashboardComponent } from './dashboard/dashboard';
import { UsuariosComponent } from './usuarios/usuarios';
import { ClientesComponent } from './clientes/clientes';
import { GuiasComponent } from './guias/guias';
import { ProveedoresComponent } from './proveedores/proveedores';
import { CategoriasComponent } from './categorias/categorias';
import { ProductosComponent } from './productos/productos';
import { InventarioComponent } from './inventario/inventario';
import { InventarioModificarComponent } from './inventario-modificar/inventario-modificar';
import { ReporteInventarioComponent } from './reporte-inventario/reporte-inventario';
import { OrdenCompraComponent } from './orden-compra/orden-compra';
import { RecepcionCompraComponent } from './recepcion-compra/recepcion-compra';
import { VentasComponent } from './ventas/ventas';
import { HomeTilesComponent } from './dashboard/home-tiles'


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
       { path: '', component: HomeTilesComponent },
      { path: 'usuarios', component: UsuariosComponent },
      { path: 'clientes', component: ClientesComponent },
      { path: 'guias', component: GuiasComponent },
      { path: 'proveedores', component: ProveedoresComponent },
      { path: 'categorias', component: CategoriasComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'inventario', component: InventarioComponent },
      { path: 'inventario-modificar', component: InventarioModificarComponent },
      { path: 'reporte-inventario', component: ReporteInventarioComponent},
      { path: 'orden-compra', component: OrdenCompraComponent },
      { path: 'recepcion-compra', component: RecepcionCompraComponent },
      { path: 'ventas', component: VentasComponent },
      
      
      // Aquí irán después: productos, clientes, proveedores, ventas...
    ]
  },

  { path: '**', redirectTo: 'login' }
];
