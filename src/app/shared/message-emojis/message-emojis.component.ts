// message-emojis.component.ts
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { InputOutput } from '../../service/input-output.service';

@Component({
  selector: 'app-message-emojis',
  standalone: true,
  imports: [MATERIAL_MODULES],
  templateUrl: './message-emojis.component.html',
  styleUrls: ['./message-emojis.component.scss'],
})
export class MessageEmojisComponent implements OnInit, OnChanges {
  @Input() isThread: boolean = false;
  emojis: any[] = [];
  private inputOutputService = inject(InputOutput);

  ngOnInit() {
    this.updateEmojis();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isThread']) {
      this.updateEmojis();
    }
  }

  private updateEmojis() {
    this.emojis = this.inputOutputService.getEmojis(this.isThread);
    console.log('Thread context:', this.isThread);
    console.log('Emojis:', this.emojis);
  }
}
