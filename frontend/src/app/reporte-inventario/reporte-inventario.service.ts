import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReporteInventarioService {
  private apiUrl = 'http://localhost:4000/api/reporte-inventario';

  constructor(private http: HttpClient) {}

  obtenerReporte(categoria?: string): Observable<any[]> {
    const url = categoria
      ? `${this.apiUrl}?categoria=${categoria}`
      : this.apiUrl;
    return this.http.get<any[]>(url);
  }

  obtenerCategorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categorias`);
  }
}
