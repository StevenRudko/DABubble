import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-account',
  imports: [MATERIAL_MODULES, CommonModule],
  templateUrl: './create-account.component.html',
  styleUrl: './create-account.component.scss'
})
export class CreateAccountComponent {
  loading: boolean = false;
  isHovered: boolean = false;
}
