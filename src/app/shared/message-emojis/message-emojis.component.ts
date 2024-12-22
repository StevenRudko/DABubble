import { Component, OnDestroy, OnInit } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { HoverService } from '../../../assets/service/hover.service';

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
    console.log('Initialer Hover Status:', this.isHovered);
    
    this.hoverStatusSubscription = this.hoverService.hoverStatus$.subscribe(status => {
      this.isHovered = status;
      console.log('Hover Status aktualisiert:', this.isHovered);
    });
  }

  ngOnDestroy(): void {
    if (this.hoverStatusSubscription) {
      this.hoverStatusSubscription.unsubscribe();
    }
  }
}
