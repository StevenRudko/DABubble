import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../../../shared/material-imports';

@Component({
  selector: 'app-main-chat-header',
  standalone: true,
  imports: [ MATERIAL_MODULES ],
  templateUrl: './main-chat-header.component.html',
  styleUrl: './main-chat-header.component.scss',
})
export class MainChatHeaderComponent {}
