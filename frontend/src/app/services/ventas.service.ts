// src/app/services/ventas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class VentasService {
  private api = 'http://localhost:4000/api/ventas';
  constructor(private http: HttpClient) {}

  crear(body: any) { return this.http.post<any>(this.api, body); }
  ventasDelDia(fecha?: string) { return this.http.get<any[]>(this.api, { params: { fecha: fecha || '' } }); }
  devolver(id: number, id_detalle: number, cantidad: number) {
    return this.http.post<any>(`${this.api}/${id}/devolver`, { id_detalle, cantidad });
  }
  anular(id: number) { return this.http.post<any>(`${this.api}/${id}/anular`, {}); }
  obtener(id: number) { return this.http.get<any>(`${this.api}/${id}`); }
}
