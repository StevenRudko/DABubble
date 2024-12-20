import { Component } from '@angular/core';
import { ProfileOverviewComponent } from './profile-overview/profile-overview.component';
import { MatCardModule } from '@angular/material/card';
import { LogoComponentComponent } from '../../shared/logo-component/logo-component.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ProfileOverviewComponent, LogoComponentComponent, MatCardModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {}
