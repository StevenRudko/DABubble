import { Component, OnDestroy, OnInit } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { HoverService } from '../../../service/hover.service';

@Component({
  selector: 'app-message-emojis',
  standalone: true,
  imports: [MATERIAL_MODULES, CommonModule],
  templateUrl: './message-emojis.component.html',
  styleUrls: ['./message-emojis.component.scss']
})
export class MessageEmojisComponent implements OnInit, OnDestroy {
  isHovered = false;
  private hoverStatusSubscription: Subscription | undefined;

  constructor(private hoverService: HoverService) {}

  ngOnInit(): void {
    this.hoverStatusSubscription = this.hoverService.hoverStatus$.subscribe(status => {
      this.isHovered = status;
    });
  }

  ngOnDestroy(): void {
    if (this.hoverStatusSubscription) {
      this.hoverStatusSubscription.unsubscribe();
    }
  }
}
