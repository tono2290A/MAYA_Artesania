import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RecepcionCompraService {
  private apiUrl = 'http://localhost:4000/api/recepcion-compra';

  constructor(private http: HttpClient) {}

  listar(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}`); }
  obtener(id: number): Observable<any> { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  obtenerConDetalle(id: number): Observable<any> { return this.http.get<any>(`${this.apiUrl}/${id}/detalle`); }

  ordenesGeneradas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/utils/ordenes-generadas`);
  }

  productoPorCodigo(codigo: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/utils/producto/${codigo}`);
  }

  crear(body: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, body);
  }

  anular(id: number, motivo: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/anular`, { motivo });
  }
}
