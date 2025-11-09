import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrdenCompraService {
  private apiUrl = 'http://localhost:4000/api/orden-compra';

  constructor(private http: HttpClient) {}

  listar(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }

  obtener(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  obtenerConDetalle(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/detalle`);
  }

  proveedores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/utils/proveedores/list`);
  }

  sugerencias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/utils/sugerencias/list`);
  }

  productoPorCodigo(codigo: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/utils/producto/${codigo}`);
  }

  crear(body: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, body);
  }

  actualizar(id: number, body: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, body);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  cambiarEstado(id: number, estado: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/estado`, { estado });
  }

  generarPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }
}
