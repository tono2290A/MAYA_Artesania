// src/app/ventas/ventas.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { ProductosService } from '../services/productos.service';
import { VentasService } from '../services/ventas.service';
import { CajaService } from '../services/caja.service';
import { TicketsService } from '../services/tickets.service';
import { HistorialVentasService } from '../services/historial-ventas.service';

type Detalle = {
  codigo_producto: string;
  nombre_producto: string;
  cantidad: number;
  precio_venta: number;
  precio_compra?: number;
  descuento?: number;
  es_comun?: 0|1;
  existencia?: number|string; // existencia real en BD (para comunes usamos '∞')
};

type MetodoPago = 'EFECTIVO'|'DOLARES'|'TARJETA'|'MIXTO';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.html',
  styleUrls: ['./ventas.scss']
})
export class VentasComponent implements OnInit {

  /* =========================
   *   Config / caja
   * ========================= */
  CAJERO = 'CAJERO_1';           // cámbialo por el usuario autenticado
  turno: any = null;             // { id_turno, cajero, fondo_inicial, ... }
  resumen: any = null;           // resumen vivo del turno
  // Modal Apertura
  mostrarApertura = false;
  apertura = { fondo_inicial: 0, comentario: '' };
  // Modal Cierre
  mostrarCierre = false;
  cierre = { efectivo_contado: 0, comentario: '' };

  /* =========================
   *   POS / Tickets
   * ========================= */
  codigo = '';
  tabs: Array<{ id_ticket?: number; nombre: string; detalles: Detalle[] }> = [];
  active = 0;

  // --------- Modales existentes ----------
  mostrarBuscar = false; termino=''; resultados:any[]=[];
  mostrarArtComun = false; art = { desc:'', cantidad:1, precio:0 };
  mostrarEntrada = false; entrada = { monto: 0, comentario: '' };
  mostrarSalida  = false;  salida  = { monto: 0, comentario: '' };
  mostrarPendiente = false; nombrePendiente = '';
  verPendientes = false; pendientesRemotos:any[]=[];

  // --------- Modal de Pago ----------
  mostrarPago = false;
  metodo: MetodoPago = 'EFECTIVO';
  mostrarNotas = false;
  notas = '';
  tcUSD = 7.80;
  pago = { efectivoQ: 0, dolaresUSD: 0, tarjetaQ: 0, referencia: '' };

  // --------- Modal Historial ----------
  mostrarHistorial = false;

  // Filtros (historial): una sola fecha
  h_q = '';               // texto (folio/notas)
  h_fecha = '';           // YYYY-MM-DD (un día)
  h_cajero = '';          // cajero exacto (opcional)

  // listado + selección
  h_list:any[] = [];      // ventas listadas (lado izquierdo)
  h_sel:any = null;       // cabecera seleccionada (lado derecho)
  h_det:any[] = [];       // detalles de la venta seleccionada
  h_devs:any[] = [];      // devoluciones de esa venta
  h_pagos:any[] = [];     // pagos (GET /ventas-historial/:id/pagos)

  // totales/flags del ticket seleccionado
  h_totalPagadoQ = 0;
  h_totalPagadoUSD = 0;
  h_pagadoQEquiv = 0;     // Q equivalentes (Q + USD*tc)
  h_saldoQ = 0;
  h_bloqueada = false;    // true si estado === ANULADA

  // devolución puntual
  h_det_sel:any = null;
  h_cant_dev = 1;

  constructor(
    private productos: ProductosService,
    private ventas: VentasService,
    private caja: CajaService,
    private tickets: TicketsService,
    private hist: HistorialVentasService
  ) {}

  ngOnInit(): void {
    this.nuevoTicket('Ticket 1');
    this.checkTurno(); // valida/abre turno al entrar al módulo
  }

  /* =========================
   *   Helpers de totales
   * ========================= */
  get t(){ return this.tabs[this.active]; }
  total(): number {
    return this.t.detalles.reduce((s,d)=> s + (Number(d.cantidad)*Number(d.precio_venta) - Number(d.descuento||0)), 0);
  }

  /* =========================
   *   Helpers de inventario
   * ========================= */

  /** Suma total reservada en el ticket para un código (todas las filas) */
  reservadoTotalEnTicket(codigo: string): number {
    return this.t.detalles
      .filter(x => x.codigo_producto === codigo && !x.es_comun)
      .reduce((s, x) => s + Number(x.cantidad || 0), 0);
  }

  /** Disponible para una FILA concreta (existencia real - reservado en otras filas del mismo producto) */
  disponibleParaFila(d: Detalle): number {
    if (d.es_comun) return Number.MAX_SAFE_INTEGER; // sin control de inventario
    const ex = Number(d.existencia || 0);
    const reservadoOtros = this.t.detalles
      .filter(x => x.codigo_producto === d.codigo_producto && x !== d && !x.es_comun)
      .reduce((s, x) => s + Number(x.cantidad || 0), 0);
    return Math.max(0, ex - reservadoOtros);
  }

  /* =========================
   *           Tabs
   * ========================= */
  nuevoTicket(nombre?:string): void {
    this.tabs.push({ nombre: nombre || `Ticket ${this.tabs.length+1}`, detalles: [] });
    this.active = this.tabs.length-1;
  }
  setActive(i:number): void { this.active = i; }
  cerrarTab(i:number): void {
    this.tabs.splice(i,1);
    if(this.active>=this.tabs.length) this.active=this.tabs.length-1;
    if(this.active<0) this.nuevoTicket('Ticket 1');
  }

  /* =========================
   *    Turno de Caja
   * ========================= */
  private checkTurno(): void {
    // intenta leer de cache local (para no pedir otra vez al volver al módulo)
    const cache = this.caja.getTurnoCache?.();
    if (cache) {
      this.turno = cache;
      this.loadResumen(cache.id_turno);
      return;
    }
    this.caja.estado(this.CAJERO).subscribe({
      next: (r:any) => {
        if (r?.abierto) {
          this.turno = r.turno;
          this.caja.setTurnoCache?.(this.turno);
          this.resumen = r.resumen || null;
        } else {
          this.mostrarApertura = true; // no hay turno abierto
        }
      },
      error: () => { this.mostrarApertura = true; }
    });
  }

  private loadResumen(id_turno:number): void {
    this.caja.resumen(id_turno).subscribe({
      next: (r:any)=> this.resumen = r,
      error: ()=> this.resumen = null
    });
  }

  confirmarApertura(): void {
    const fondo = Number(this.apertura.fondo_inicial || 0);
    if (fondo <= 0) { Swal.fire('Atención','Ingrese un fondo inicial válido','warning'); return; }
    this.caja.abrirTurno({ cajero: this.CAJERO, fondo_inicial: fondo, comentario: this.apertura.comentario || null })
      .subscribe({
        next: (r:any)=>{
          Swal.fire({icon:'success', title:'Caja abierta', timer:1200, showConfirmButton:false});
          this.mostrarApertura = false;
          this.turno = { id_turno: r.id_turno, cajero: this.CAJERO, fondo_inicial: fondo };
          this.caja.setTurnoCache?.(this.turno);
          this.loadResumen(r.id_turno);
        },
        error: (e:any)=> Swal.fire('Error', e?.error?.message || 'No se pudo abrir turno', 'error')
      });
  }

  abrirCierre(): void {
    if (!this.turno?.id_turno) return;
    this.loadResumen(this.turno.id_turno);
    this.cierre = { efectivo_contado: 0, comentario: '' };
    this.mostrarCierre = true;
  }

  confirmarCierre(): void {
    if (!this.turno?.id_turno) return;
    const contado = Number(this.cierre.efectivo_contado || 0);
    if (isNaN(contado) || contado < 0) { Swal.fire('Atención','Ingrese el efectivo contado','warning'); return; }

    this.caja.cerrarTurno({
      id_turno: this.turno.id_turno,
      efectivo_contado: contado,
      comentario: this.cierre.comentario || null
    }).subscribe({
      next: (r:any)=>{
        this.mostrarCierre = false;
        this.caja.clearTurnoCache?.();
        this.turno = null;
        this.resumen = null;
        Swal.fire({
          icon:'success',
          title:'Turno cerrado',
          html: `
            <div style="text-align:left">
              <div><b>Esperado:</b> Q ${Number(r.efectivo_esperado||0).toFixed(2)}</div>
              <div><b>Contado:</b> Q ${Number(r.efectivo_contado||0).toFixed(2)}</div>
              <div><b>Diferencia:</b> Q ${Number(r.diferencia||0).toFixed(2)}</div>
            </div>
          `
        }).then(()=>{
          try { (window as any).location.href = '/login'; } catch {}
        });
      },
      error: (e:any)=> Swal.fire('Error', e?.error?.message || 'No se pudo cerrar turno', 'error')
    });
  }

  /* ===========================================
   *   Agregar por código con fallback búsqueda
   * =========================================== */
  agregarPorCodigo(): void {
    if (!this.turno?.id_turno) { this.mostrarApertura = true; return; }
    const c = this.codigo.trim();
    if (!c) return;

    this.productos.porCodigo(c).subscribe({
      next: (p:any) => {
        // Si existe ya una fila, intenta +1 sin sobrepasar disponible
        const ya = this.t.detalles.find(x=>x.codigo_producto===p.codigo_producto && !x.es_comun);
        if (ya) {
          const max = this.disponibleParaFila(ya);
          if (Number(ya.cantidad) + 1 > max) {
            Swal.fire('Stock insuficiente', `Solo quedan ${max} en existencia.`, 'warning');
          } else {
            ya.cantidad += 1;
          }
        } else {
          // Validar disponibilidad antes de crear nueva fila
          const existencia = Number(p.existencia || 0);
          const reservado = this.reservadoTotalEnTicket(p.codigo_producto);
          const disponible = Math.max(0, existencia - reservado);
          if (disponible <= 0) {
            Swal.fire('Sin stock', 'No hay existencia disponible para agregar este producto.', 'warning');
            this.codigo = '';
            return;
          }
          this.t.detalles.push({
            codigo_producto: p.codigo_producto,
            nombre_producto: p.nombre,
            cantidad: 1,
            precio_venta: +p.precio_venta,
            precio_compra: +(p.precio_compra ?? 0), // <- usa costo si viene
            es_comun: 0,
            existencia: existencia
          });
        }
        this.codigo = '';
      },
      error: () => {
        // Buscar por nombre/código LIKE
        this.productos.buscar(c).subscribe((r:any[])=>{
          if(!r.length){
            Swal.fire('No encontrado','No existe producto con ese código o nombre','warning');
            return;
          }
          if(r.length===1){
            const p = r[0];
            const ya = this.t.detalles.find(x=>x.codigo_producto===p.codigo_producto && !x.es_comun);
            if (ya) {
              const max = this.disponibleParaFila(ya);
              if (Number(ya.cantidad) + 1 > max) {
                Swal.fire('Stock insuficiente', `Solo quedan ${max} en existencia.`, 'warning');
              } else {
                ya.cantidad += 1;
              }
            } else {
              // Validar disponibilidad
              const existencia = Number(p.existencia || 0);
              const reservado = this.reservadoTotalEnTicket(p.codigo_producto);
              const disponible = Math.max(0, existencia - reservado);
              if (disponible <= 0) {
                Swal.fire('Sin stock', 'No hay existencia disponible para agregar este producto.', 'warning');
                this.codigo = '';
                return;
              }
              this.t.detalles.push({
                codigo_producto: p.codigo_producto,
                nombre_producto: p.nombre,
                cantidad: 1,
                precio_venta: +p.precio_venta,
                 precio_compra: +(p.precio_compra ?? 0), // <- usa costo si viene
                es_comun: 0,
                existencia: existencia
              });
            }
            this.codigo='';
          } else {
            this.resultados = r;
            this.mostrarBuscar = true;
          }
        }, ()=> Swal.fire('Error','No se pudo consultar productos','error'));
      }
    });
  }

  /* =========================
   *           Buscar
   * ========================= */
  abrirBuscar(): void { if(!this.turno?.id_turno){ this.mostrarApertura=true; return; } this.termino=''; this.resultados=[]; this.mostrarBuscar=true; }
  cerrarBuscar(): void { this.mostrarBuscar=false; }
  doBuscar(): void {
    if(!this.termino.trim()) { this.resultados=[]; return; }
    this.productos.buscar(this.termino.trim()).subscribe((r:any[])=> this.resultados = r);
  }
  seleccionarProducto(p:any): void {
    const ya = this.t.detalles.find(x=>x.codigo_producto===p.codigo_producto && !x.es_comun);
    if (ya) {
      const max = this.disponibleParaFila(ya);
      if (Number(ya.cantidad) + 1 > max) {
        Swal.fire('Stock insuficiente', `Solo quedan ${max} en existencia.`, 'warning');
      } else {
        ya.cantidad += 1;
      }
    } else {
      const existencia = Number(p.existencia || 0);
      const reservado = this.reservadoTotalEnTicket(p.codigo_producto);
      const disponible = Math.max(0, existencia - reservado);
      if (disponible <= 0) {
        Swal.fire('Sin stock', 'No hay existencia disponible para agregar este producto.', 'warning');
        this.cerrarBuscar();
        return;
      }
      this.t.detalles.push({
        codigo_producto:p.codigo_producto,
        nombre_producto:p.nombre,
        cantidad:1,
        precio_venta:+p.precio_venta,
        precio_compra: 0,
        es_comun:0,
        existencia:existencia
      });
    }
    this.cerrarBuscar();
  }

  /* =========================
   *    Artículo común
   * ========================= */
  abrirArtComun(): void { if(!this.turno?.id_turno){ this.mostrarApertura=true; return; } this.art={desc:'', cantidad:1, precio:0}; this.mostrarArtComun=true; }
  cerrarArtComun(): void { this.mostrarArtComun=false; }
  agregarArtComun(): void {
    if(!this.art.desc || this.art.cantidad<=0 || this.art.precio<0) {
      Swal.fire('Atención','Complete los datos','warning'); return;
    }
    this.t.detalles.push({
      codigo_producto:`COM-${Date.now()}`,
      nombre_producto:this.art.desc,
      cantidad:this.art.cantidad,
      precio_venta:this.art.precio,
      es_comun:1,
      existencia:'∞'
    });
    this.cerrarArtComun();
  }

  /* =========================
   *  Editar / Eliminar línea
   * ========================= */
  eliminarLinea(i:number): void { this.t.detalles.splice(i,1); }

  onCantidadChange(d: Detalle): void {
    if (d.es_comun) { // sin control de inventario
      if (Number(d.cantidad) < 1) d.cantidad = 1;
      return;
    }
    const max = this.disponibleParaFila(d); // disponible luego de restar otras filas
    let cant = Number(d.cantidad || 0);
    if (isNaN(cant) || cant < 1) cant = 1;

    if (cant > max) {
      d.cantidad = max;
      Swal.fire({
        icon: 'warning',
        title: 'Stock insuficiente',
        text: `Solo quedan ${max} en existencia.`,
        timer: 1400,
        showConfirmButton: false
      });
    } else {
      d.cantidad = cant;
    }
  }

  onPrecioChange(d: Detalle): void {
    if (d.es_comun || d.precio_compra === undefined) return;
    const pv = Number(d.precio_venta || 0);
    const pc = Number(d.precio_compra || 0);
    if (pv < pc) {
      Swal.fire({
        icon: 'warning',
        title: 'Precio por debajo del costo',
        text: `El costo es Q${pc.toFixed(2)}. El precio de venta no puede ser menor.`,
        timer: 1800, showConfirmButton: false
      });
      d.precio_venta = pc;
    }
  }

  // Devuelve true si la línea (no común) tiene PV < PC
esBajoCosto(d: Detalle): boolean {
  if (d?.es_comun) return false;
  const pv = +d?.precio_venta || 0;
  const pc = +(d?.precio_compra ?? 0);
  // Solo marcamos bajo costo si conocemos el costo (>0) y PV < PC
  return pc > 0 && pv < pc;
}

// True si existe al menos una línea bajo costo
hayPreciosBajoCosto(): boolean {
  return this.t.detalles.some(d => this.esBajoCosto(d));
}


  /* =========================
   *           Caja
   * ========================= */
  abrirEntrada(): void { if(!this.turno?.id_turno){ this.mostrarApertura=true; return; } this.entrada={monto:0, comentario:''}; this.mostrarEntrada=true; }
  cerrarEntrada(): void { this.mostrarEntrada=false; }
  guardarEntrada(): void {
    const m = Number(this.entrada.monto||0);
    if (m<=0) { Swal.fire('Atención','Monto inválido','warning'); return; }
    this.caja.movimiento({ tipo:'ENTRADA', monto:m, comentario:this.entrada.comentario, cajero:this.CAJERO, id_turno:this.turno?.id_turno })
      .subscribe({
        next: () => { Swal.fire({icon:'success',title:'Entrada registrada',timer:1200,showConfirmButton:false}); this.cerrarEntrada(); if(this.turno?.id_turno) this.loadResumen(this.turno.id_turno); },
        error: (e:any) => Swal.fire('Error', e?.error?.message || 'No se pudo registrar', 'error')
      });
  }

  abrirSalida(): void { if(!this.turno?.id_turno){ this.mostrarApertura=true; return; } this.salida={monto:0, comentario:''}; this.mostrarSalida=true; }
  cerrarSalida(): void { this.mostrarSalida=false; }
  guardarSalida(): void {
    const m = Number(this.salida.monto||0);
    if (m<=0) { Swal.fire('Atención','Monto inválido','warning'); return; }
    this.caja.movimiento({ tipo:'SALIDA', monto:m, comentario:this.salida.comentario, cajero:this.CAJERO, id_turno:this.turno?.id_turno })
      .subscribe({
        next: () => { Swal.fire({icon:'success',title:'Salida registrada',timer:1200,showConfirmButton:false}); this.cerrarSalida(); if(this.turno?.id_turno) this.loadResumen(this.turno.id_turno); },
        error: (e:any) => Swal.fire('Error', e?.error?.message || 'No se pudo registrar', 'error')
      });
  }

  /* =========================
   *     Tickets pendientes
   * ========================= */
  abrirPendiente(): void { if(!this.turno?.id_turno){ this.mostrarApertura=true; return; } this.nombrePendiente = this.t.nombre; this.mostrarPendiente=true; }
  cerrarPendiente(): void { this.mostrarPendiente=false; }
  guardarPendiente(): void {
    if (!this.t.detalles.length) return;
    this.tickets.crear({ nombre: this.nombrePendiente || this.t.nombre, detalles: this.t.detalles })
      .subscribe({
        next: () => { Swal.fire({icon:'success',title:'Ticket pendiente',timer:1200,showConfirmButton:false}); this.mostrarPendiente=false; this.t.detalles=[]; },
        error: (e:any) => Swal.fire('Error', e?.error?.message || 'No se pudo guardar', 'error')
      });
  }
  abrirPendientes(): void {
    if(!this.turno?.id_turno){ this.mostrarApertura=true; return; }
    this.tickets.listar().subscribe((rows:any[])=> {
      this.pendientesRemotos=rows; this.verPendientes=true;
    });
  }
  cerrarListaPendientes(): void { this.verPendientes=false; }
  reanudarPendiente(p:any): void {
    this.tickets.obtener(p.id_ticket).subscribe({
      next: (data:any) => {
        this.tabs.push({
          id_ticket:p.id_ticket,
          nombre:data.cabecera?.nombre || `Ticket ${p.id_ticket}`,
          detalles:data.detalles || []
        });
        this.active=this.tabs.length-1; this.verPendientes=false;
      },
      error: () => Swal.fire('Error','No se pudo abrir el ticket','error')
    });
  }
  eliminarPendiente(id:number): void {
    this.tickets.eliminar(id).subscribe({ next:()=> this.abrirPendientes() });
  }

  /* =========================
   *           Pago
   * ========================= */
  abrirModalPago(): void {
    if (!this.turno?.id_turno) { this.mostrarApertura = true; return; }
    if (!this.t.detalles.length) { Swal.fire('Atención','No hay productos','warning'); return; }
    // Validar precios < costo
    const errores = this.t.detalles.filter(d => Number(d.precio_venta) < Number(d.precio_compra || 0));
    if (errores.length) {
      const lista = errores.map(d => `<li>${d.nombre_producto} (P.Compra: Q${d.precio_compra}, P.Venta: Q${d.precio_venta})</li>`).join('');
      Swal.fire({icon:'error',title:'Precio de venta inválido', html:`Los siguientes productos están por debajo del costo:<ul>${lista}</ul>`});
      return;
    }
    // Reset modal
    this.metodo = 'EFECTIVO';
    this.pago = { efectivoQ: 0, dolaresUSD: 0, tarjetaQ: 0, referencia: '' };
    this.mostrarNotas = false; this.notas = '';
    this.mostrarPago = true;
  }
  cerrarModalPago(): void { this.mostrarPago = false; }
  seleccionarMetodo(m: MetodoPago){ this.metodo = m; }
  equivalenteUSDaQ(): number { return Number(this.pago.dolaresUSD||0) * Number(this.tcUSD||0); }
  cubiertoMixtoQ(): number { return Number(this.pago.efectivoQ||0) + Number(this.pago.tarjetaQ||0) + this.equivalenteUSDaQ(); }
  cambioEfectivoQ(): number { return Number(this.pago.efectivoQ||0) - this.total(); }
  cambioDolaresQ(): number { return this.equivalenteUSDaQ() - this.total(); }
  restanteMixtoQ(): number { return this.total() - this.cubiertoMixtoQ(); }

  confirmarCobro(): void {
    const total = this.total();

    if (this.metodo === 'EFECTIVO') {
      if (this.pago.efectivoQ < total) { Swal.fire('Atención','El efectivo no cubre el total','warning'); return; }
    }
    if (this.metodo === 'DOLARES') {
      if (this.equivalenteUSDaQ() < total) { Swal.fire('Atención','El equivalente en Q no cubre el total','warning'); return; }
    }
    if (this.metodo === 'TARJETA') {
      this.pago.tarjetaQ = total; // asume pago completo
    }
    if (this.metodo === 'MIXTO') {
      if (this.cubiertoMixtoQ() < total) { Swal.fire('Atención','El monto combinado no cubre el total','warning'); return; }
    }

    const body = {
      cajero: this.CAJERO,
      id_cliente: null,
      notas: this.notas || null,
      detalles: this.t.detalles.map(d=>({
        codigo_producto: d.codigo_producto,
        nombre_producto: d.nombre_producto,
        cantidad: Number(d.cantidad),
        precio_venta: Number(d.precio_venta),
        descuento: Number(d.descuento || 0),
        es_comun: d.es_comun ? 1 : 0
      }))
    };

    // POST /api/ventas
    this.ventas.crear(body).subscribe({
      next: (r:any)=>{
        this.mostrarPago = false;
        Swal.fire({
          icon:'success',
          title:`Venta #${r.id_venta}`,
          html:`Total Q ${Number(r.total).toFixed(2)}<br><small>Método: ${this.metodo}</small>`,
          timer: 1700, showConfirmButton:false
        });
        this.t.detalles=[];
        if (this.turno?.id_turno) this.loadResumen(this.turno.id_turno);
      },
      error: (e:any)=> {
        Swal.fire('Error', e?.error?.message || 'No se pudo cobrar', 'error');
      }
    });
  }

  /* =========================
   *          Historial
   * ========================= */
  abrirHistorial(): void {
    // default: ventas del día
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth()+1).padStart(2,'0');
    const dd = String(hoy.getDate()).padStart(2,'0');
    this.h_fecha = `${yyyy}-${mm}-${dd}`;
    this.h_q = '';
    this.h_cajero = '';
    this.h_list = [];
    this.h_sel = null;
    this.h_det = [];
    this.h_devs = [];
    this.h_pagos = [];
    this.h_totalPagadoQ = 0;
    this.h_totalPagadoUSD = 0;
    this.h_pagadoQEquiv = 0;
    this.h_saldoQ = 0;
    this.h_bloqueada = false;
    this.buscarHistorial();
    this.mostrarHistorial = true;
  }

  cerrarHistorial(): void { this.mostrarHistorial = false; }

  buscarHistorial(): void {
    this.hist.buscar({
      q: this.h_q || '',
      fecha: this.h_fecha || '',
      cajero: this.h_cajero || ''
    }).subscribe({
      next: (rows:any[]) => this.h_list = rows,
      error: () => Swal.fire('Error','No se pudo cargar el historial','error')
    });
  }

  // Alias usado por la plantilla (cuando cambias la fecha)
  cargarHistorial(): void { this.buscarHistorial(); }

  // === Carga cabecera, detalle, devoluciones y pagos. Calcula pagado/saldo y bloquea si ANULADA.
  seleccionarVenta(v:any): void {
    this.h_sel = null; this.h_det=[]; this.h_devs=[]; this.h_pagos=[];
    this.h_totalPagadoQ = 0; this.h_totalPagadoUSD = 0; this.h_pagadoQEquiv = 0; this.h_saldoQ = 0; this.h_bloqueada = false;

    const id = Number(v.folio || v.id_venta || v);
    if (!id) return;

    this.hist.obtener(id).subscribe({
      next: (data:any)=>{
        this.h_sel = data?.cabecera || null;
        this.h_det = data?.detalles || [];

        // devoluciones
        this.hist.devoluciones(id).subscribe(d=> this.h_devs = d);

        // pagos
        this.hist.pagos(id).subscribe(p => {
          this.h_pagos = Array.isArray(p) ? p : [];
          // acumular pagos
          this.h_totalPagadoQ   = this.h_pagos.reduce((s,x)=> s + Number(x.monto_q||0), 0);
          this.h_totalPagadoUSD = this.h_pagos.reduce((s,x)=> s + Number(x.monto_usd||0), 0);
          const totalUSDenQ     = this.h_pagos.reduce((s,x)=> s + (Number(x.monto_usd||0) * Number(x.tc_usd||0)), 0);
          const totalVentaQ     = Number(this.h_sel?.total||0);
          this.h_pagadoQEquiv   = this.h_totalPagadoQ + totalUSDenQ;
          this.h_saldoQ         = Math.max(0, totalVentaQ - this.h_pagadoQEquiv);
        });

        // bloquear si ANULADA
        this.h_bloqueada = (String(this.h_sel?.estado || '').toUpperCase() === 'ANULADA');
        this.h_det_sel = null;
      },
      error: ()=> Swal.fire('Error','No se pudo cargar detalles','error')
    });
  }

  seleccionarDetalle(d:any): void {
    this.h_det_sel = d;
    const pendiente = Number(d.cantidad) - Number(d.cantidad_devuelta || 0);
    this.h_cant_dev = pendiente > 0 ? 1 : 0;
  }

  devolverSeleccion(): void {
    if (!this.h_sel || !this.h_det_sel) return;
    if (this.h_bloqueada) {
      Swal.fire('Venta anulada','No es posible devolver artículos de una venta ANULADA.','info');
      return;
    }
    const id_venta = Number(this.h_sel.id_venta);
    const id_detalle = Number(this.h_det_sel.id_detalle);
    const vendido = Number(this.h_det_sel.cantidad);
    const devuelta = Number(this.h_det_sel.cantidad_devuelta || 0);
    const pendiente = vendido - devuelta;

    const cant = Number(this.h_cant_dev || 0);
    if (cant<=0 || cant>pendiente) {
      Swal.fire('Atención', `Cantidad inválida. Pendiente por devolver: ${pendiente}`, 'warning');
      return;
    }

    this.ventas.devolver(id_venta, id_detalle, cant).subscribe({
      next: ()=>{
        Swal.fire({icon:'success',title:'Devolución registrada',timer:1200,showConfirmButton:false});
        this.seleccionarVenta({ folio: id_venta }); // refrescar todo (cabecera/detalle/pagos/saldo)
        if (this.turno?.id_turno) this.loadResumen(this.turno.id_turno);
      },
      error: (e:any)=> Swal.fire('Error', e?.error?.message || 'No se pudo devolver', 'error')
    });
  }

  anularVentaSeleccionada(): void {
    if (!this.h_sel) return;
    if (this.h_bloqueada) {
      Swal.fire('Venta anulada','Esta venta ya está ANULADA.','info');
      return;
    }
    const id_venta = Number(this.h_sel.id_venta);
    Swal.fire({
      icon:'warning',
      title:'Cancelar venta completa',
      text:'¿Seguro que desea ANULAR completamente esta venta?',
      showCancelButton:true,
      confirmButtonText:'Sí, anular'
    }).then(r=>{
      if (!r.isConfirmed) return;
      this.ventas.anular(id_venta).subscribe({
        next: ()=>{
          Swal.fire({icon:'success',title:'Venta anulada',timer:1200,showConfirmButton:false});
          // refrescar y mantener seleccionada para ver estado/pagos
          this.seleccionarVenta({ folio: id_venta });
          this.buscarHistorial();
          if (this.turno?.id_turno) this.loadResumen(this.turno.id_turno);
        },
        error: (e:any)=> Swal.fire('Error', e?.error?.message || 'No se pudo anular', 'error')
      });
    });
  }

  hayStockInsuficiente(): boolean {
    return this.t.detalles.some(d => {
      if (d.es_comun) return false;
      const max = this.disponibleParaFila(d);
      return Number(d.cantidad||0) > max;
    });
  }
}
