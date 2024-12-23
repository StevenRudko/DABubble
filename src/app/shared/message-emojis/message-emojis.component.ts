import { Component, Input, OnInit, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { InputOutput } from '../../service/input-output.service';
import { Observable } from 'rxjs';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-message-emojis',
  standalone: true,
  imports: [MATERIAL_MODULES, NgIf],
  templateUrl: './message-emojis.component.html',
  styleUrls: ['./message-emojis.component.scss'],
})
export class MessageEmojisComponent implements OnInit {
  private inputOutputService = inject(InputOutput);
  showEmojis: boolean = this.inputOutputService.showEmojis; 

  ngOnInit(): void {
    this.showEmojis = this.inputOutputService.showEmojis;
  }
}
