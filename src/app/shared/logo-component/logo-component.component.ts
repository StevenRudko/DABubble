import { Component, HostListener, inject } from '@angular/core';
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
  responsive: boolean = false;
  private appCompopnent = inject(AppComponent);

  /**
   * Initializes component and sets up navigation monitoring
   */
  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.checkIfHomePage();
    });
    this.checkIfHomePage();
    this.onResize()
  }

  /**
   * Check whether the current route is landing page and the first visit status or
   * the window innerheight is smaller than 1024px
   */
  private checkIfHomePage(): void {
    if (this.appCompopnent.firstVisit) {
      this.animation = this.router.url === '/';
      this.appCompopnent.firstVisit = false;
    }
  }

  /**
   * Handles window resize events to determine whether the UI should be in responsive mode.
   * - Uses the `@HostListener` decorator to listen for `window:resize` events.
   * - Sets `responsive` to `true` if the window width is less than 1024px and the current route is `/`.
   * - Otherwise, sets `responsive` to `false`.
   * 
   * @returns {void}
   */
  @HostListener('window:resize', ['$event'])
  onResize() {
    if (window.innerWidth < 1024 && this.router.url === '/') {
      this.responsive = true;
    } else {
      this.responsive = false;
    }
  }

}
