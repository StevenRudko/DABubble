import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class HoverService {
  private hoverSubject = new BehaviorSubject<boolean>(false);
  hoverStatus$ = this.hoverSubject.asObservable();

  setHoverStatus(status: boolean): void {
    this.hoverSubject.next(status);
  }
}