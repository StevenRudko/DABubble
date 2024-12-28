import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  imports: [MATERIAL_MODULES, RouterLink],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss'
})
export class PrivacyPolicyComponent {

}
