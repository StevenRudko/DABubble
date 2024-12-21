import { Component } from '@angular/core';
import { LogoComponentComponent } from '../shared/logo-component/logo-component.component';
import { ProfileOverviewComponent } from '../shared/profile-overview/profile-overview.component';
import { MATERIAL_MODULES } from '../shared/material-imports';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LogoComponentComponent, ProfileOverviewComponent, MATERIAL_MODULES ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent { }
