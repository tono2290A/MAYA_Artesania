// src/app/services/tickets.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private api = 'http://localhost:4000/api/tickets';
  constructor(private http: HttpClient) {}

  listar(): Observable<any[]> { return this.http.get<any[]>(this.api); }
  obtener(id: number): Observable<any> { return this.http.get<any>(`${this.api}/${id}`); }
  crear(body: any) { return this.http.post<any>(this.api, body); }
  actualizar(id:number, body:any) { return this.http.put<any>(`${this.api}/${id}`, body); }
  eliminar(id:number) { return this.http.delete<any>(`${this.api}/${id}`); }
}
