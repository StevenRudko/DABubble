import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-imprint',
  standalone:true,
  imports: [MATERIAL_MODULES, RouterLink],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss'
})
export class ImprintComponent {

}
