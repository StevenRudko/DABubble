import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-main-chat-header',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './main-chat-header.component.html',
  styleUrl: './main-chat-header.component.scss',
})
export class MainChatHeaderComponent {}
