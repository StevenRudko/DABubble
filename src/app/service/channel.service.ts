import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  constructor(private firestore: Firestore) {}

  getChannel(channelId: string) {
    return doc(this.firestore, 'channels', channelId);
  }
}
