import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class HistorialVentasService {
  private api = 'http://localhost:4000/api/ventas-historial';
  constructor(private http: HttpClient) {}

  // ✅ ahora solo: q, fecha, cajero
  buscar(p: { q?: string; fecha?: string; cajero?: string }) {
    const qs = new URLSearchParams(p as any).toString();
    return this.http.get<any[]>(`${this.api}?${qs}`);
  }

  obtener(id: number) { return this.http.get<any>(`${this.api}/${id}`); }
  devoluciones(id: number) { return this.http.get<any[]>(`${this.api}/${id}/devoluciones`); }

 pagos(id_venta: number) {
    return this.http.get<any[]>(`${this.api}/${id_venta}/pagos`);
  }
  
}
