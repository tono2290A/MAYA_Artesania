import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CajaService {
  private api = 'http://localhost:4000/api/caja';

  constructor(private http: HttpClient) {}

  /* ===== Turno ===== */
  estado(cajero: string) {
    return this.http.get<any>(`${this.api}/estado`, { params: { cajero } });
  }
  abrirTurno(body: { cajero: string; fondo_inicial: number; comentario?: string | null }) {
    return this.http.post<any>(`${this.api}/abrir`, body);
  }
  resumen(id_turno: number) {
    return this.http.get<any>(`${this.api}/resumen/${id_turno}`);
  }
  cerrarTurno(body: { id_turno: number; efectivo_contado: number; comentario?: string | null }) {
    return this.http.post<any>(`${this.api}/cerrar`, body);
  }

  /* ===== Movimientos (entrada/salida) ===== */
  movimiento(body: { tipo: 'ENTRADA'|'SALIDA'|'APERTURA'|'CIERRE'; monto: number; comentario?: string|null; cajero?: string|null; id_turno?: number }) {
    return this.http.post<any>(`${this.api}/movimiento`, body);
  }
  listarMovimientos(p: { desde?: string; hasta?: string; id_turno?: number|string } = {}) {
    const params = new URLSearchParams(p as any).toString();
    return this.http.get<any[]>(`${this.api}/movimientos?${params}`);
  }

  /* ===== Helpers de sesión de turno en el cliente (opcional) ===== */
  setTurnoCache(turno: any) { localStorage.setItem('turno_actual', JSON.stringify(turno)); }
  getTurnoCache(): any | null {
    try { return JSON.parse(localStorage.getItem('turno_actual') || 'null'); } catch { return null; }
  }
  clearTurnoCache() { localStorage.removeItem('turno_actual'); }
}
