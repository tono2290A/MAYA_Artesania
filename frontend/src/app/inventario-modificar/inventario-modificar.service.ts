import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InventarioModificarService {
  private apiUrl = 'http://localhost:4000/api/inventario-modificar';

  constructor(private http: HttpClient) {}

  obtenerInventario(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  buscarPorCodigo(codigo: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/buscar/${codigo}`);
  }

  actualizarInventario(data: any): Observable<any> {
    return this.http.put(this.apiUrl, data);
  }
}

