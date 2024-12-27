import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';

@Component({
  selector: 'app-profile-overview',
  standalone: true,
  imports: [MATERIAL_MODULES],
  templateUrl: './profile-overview.component.html',
  styleUrl: './profile-overview.component.scss',
})
export class ProfileOverviewComponent {}
