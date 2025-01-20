import { Component, Output, EventEmitter } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-messages-edit-options',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES],
  templateUrl: './messages-edit-options.component.html',
  styleUrl: './messages-edit-options.component.scss',
})
export class MessagesEditOptionsComponent {
  @Output() mouseStateChange = new EventEmitter<boolean>();
  @Output() editMessage = new EventEmitter<void>();
  @Output() deleteMessage = new EventEmitter<void>();

  /**
   * Handles the mouseenter event on the edit options menu
   * Used to maintain visibility when hovering over the menu itself
   * @returns {void}
   */
  onMouseEnter(): void {
    this.mouseStateChange.emit(true);
  }

  /**
   * Handles the mouseleave event on the edit options menu
   * Used to hide the menu when mouse leaves the component area
   * @returns {void}
   */
  onMouseLeave(): void {
    this.mouseStateChange.emit(false);
  }
}
