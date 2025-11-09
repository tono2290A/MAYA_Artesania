import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'  // 👉 esto hace que Angular pueda inyectarlo globalmente
})
export class AuthService {
  private base = 'http://localhost:4000/api/usuarios'; // tu endpoint del backend

  constructor(private http: HttpClient) {}

  login(usuario: string, password: string): Observable<any> {
    return this.http.post(`${this.base}/login`, { usuario, password });
  }
}
