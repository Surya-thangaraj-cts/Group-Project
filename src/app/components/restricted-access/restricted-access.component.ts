import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-restricted-access',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './restricted-access.component.html',
  styleUrls: ['./restricted-access.component.css']
})
export class RestrictedAccessComponent implements OnInit {
  countdown: number = 8;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        clearInterval(interval);
        this.router.navigate(['/home']);
      }
    }, 1000);
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
