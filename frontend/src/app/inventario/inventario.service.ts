import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private apiUrl = 'http://localhost:4000/api/inventario';

  constructor(private http: HttpClient) {}

  obtenerInventario(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  buscarPorCodigo(codigo: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/codigo/${codigo}`);
  }

  agregarInventario(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}
