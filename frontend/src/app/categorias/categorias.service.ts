import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private apiUrl = 'http://localhost:4000/api/categorias';

  constructor(private http: HttpClient) {}

  obtenerCategorias(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearCategoria(categoria: any): Observable<any> {
    return this.http.post(this.apiUrl, categoria);
  }

  actualizarCategoria(id: number, categoria: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, categoria);
  }

  eliminarCategoria(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
