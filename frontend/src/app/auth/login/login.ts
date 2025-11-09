import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';  // ✅ ruta correcta


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  usuario = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.auth.login(this.usuario, this.password).subscribe({
      next: (res: any) => {
        console.log(res);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => this.error = err.error?.message ?? 'Error en el servidor'
    });
  }
}
