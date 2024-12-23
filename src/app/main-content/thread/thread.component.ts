import { Component, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { UserMessageComponent } from '../../shared/user-message/user-message.component';
import { MessageInputBoxComponent } from '../../shared/message-input-box/message-input-box.component';
import { InputOutput } from '../../service/input-output.service';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [MATERIAL_MODULES, UserMessageComponent, MessageInputBoxComponent],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent implements OnInit {
  private InputOutputService = inject(InputOutput);

  @Output() closeThreadEvent = new EventEmitter<void>();
  replyCount: number = 0;

  ngOnInit(): void {
    this.InputOutputService.setThreadOpenStatus(false);
  }

  closeThread() {
    this.closeThreadEvent.emit();
  }
}
