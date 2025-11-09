import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private api = 'http://localhost:4000/api/productos';
  constructor(private http: HttpClient) {}

  // /api/productos/buscar/:term
  buscar(term: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/buscar/${encodeURIComponent(term)}`);
  }

  // /api/productos/codigo/:codigo
  porCodigo(codigo: string): Observable<any> {
    return this.http.get<any>(`${this.api}/codigo/${encodeURIComponent(codigo)}`);
  }
}
