import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private apiUrl = 'http://localhost:4000/api/clientes';

  constructor(private http: HttpClient) {}

  obtenerClientes(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearCliente(cliente: any): Observable<any> {
    return this.http.post(this.apiUrl, cliente);
  }

  actualizarCliente(id: number, cliente: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, cliente);
  }

  eliminarCliente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
