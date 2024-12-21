import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_MODULES } from '../../shared/material-imports';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent { }
