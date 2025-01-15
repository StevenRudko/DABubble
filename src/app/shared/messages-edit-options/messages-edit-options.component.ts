import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-messages-edit-options',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES],
  templateUrl: './messages-edit-options.component.html',
  styleUrl: './messages-edit-options.component.scss'
})
export class MessagesEditOptionsComponent {

}
