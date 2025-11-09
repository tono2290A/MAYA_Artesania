import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private apiUrl = 'http://localhost:4000/api/proveedores';

  constructor(private http: HttpClient) {}

  obtenerProveedores(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearProveedor(proveedor: any): Observable<any> {
    return this.http.post(this.apiUrl, proveedor);
  }

  actualizarProveedor(id: number, proveedor: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, proveedor);
  }

  eliminarProveedor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
