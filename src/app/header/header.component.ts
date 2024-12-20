import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { LogoComponentComponent } from '../shared/logo-component/logo-component.component';
import { ProfileOverviewComponent } from '../shared/profile-overview/profile-overview.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LogoComponentComponent, MatCardModule, ProfileOverviewComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {}
