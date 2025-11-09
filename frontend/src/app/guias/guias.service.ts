import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GuiasService {
  private apiUrl = 'http://localhost:4000/api/guias';

  constructor(private http: HttpClient) {}

  obtenerGuias(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearGuia(guia: any): Observable<any> {
    return this.http.post(this.apiUrl, guia);
  }

  actualizarGuia(id: number, guia: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, guia);
  }

  eliminarGuia(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
