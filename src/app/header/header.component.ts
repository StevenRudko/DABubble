import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { LogoComponentComponent } from '../shared/logo-component/logo-component.component';
import { ProfileOverviewComponent } from '../shared/profile-overview/profile-overview.component';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LogoComponentComponent, MatCardModule, MatCardModule, MatIconModule, ProfileOverviewComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {}
