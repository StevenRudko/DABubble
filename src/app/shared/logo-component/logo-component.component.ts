import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppComponent } from '../../app.component';

@Component({
  selector: 'app-logo-component',
  standalone: true,
  imports: [],
  templateUrl: './logo-component.component.html',
  styleUrl: './logo-component.component.scss',
})
export class LogoComponentComponent {
  firstVisit: boolean = true;
  animation: boolean = false;
  private appCompopnent = inject(AppComponent);

  /**
   * Initializes component and sets up navigation monitoring
   */
  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.checkIfHomePage();
    });
    this.checkIfHomePage();
  }

  /**
   * Checks if current route is homepage and handles animation state
   */
  private checkIfHomePage(): void {
    if (this.appCompopnent.firstVisit) {
      this.animation = this.router.url === '/';
      this.appCompopnent.firstVisit = false;
    }
  }
}
