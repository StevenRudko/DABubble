import { Component } from '@angular/core';
import { ProfileOverviewComponent } from './profile-overview/profile-overview.component';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-header',
  standalone:true,
  imports: [ProfileOverviewComponent, MatCardModule ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})

export class HeaderComponent {}
