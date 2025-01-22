import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc, onSnapshot } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChannelInterface } from '../models/channel-interface';


@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private channelsSubject = new BehaviorSubject<ChannelInterface[]>([]);
  channels$ = this.channelsSubject.asObservable();

  constructor(private firestore: Firestore) {
    this.getChannels();
    setTimeout(() => console.log(this.channelsSubject.value), 2000
    )
  }

  getChannel(channelId: string) {
    return doc(this.firestore, 'channels', channelId);
  }

  getChannels() {
    try {
          const channelCollection = collection(this.firestore, 'channels');
    
          onSnapshot(channelCollection, (querySnapshot) => {
            const channel = querySnapshot.docs.map((doc) => {
              return {
                channelId: doc.id,
                ...doc.data(),
              } as ChannelInterface;
            });
            this.channelsSubject.next(channel);
          });
        } catch (error) {
          console.error('Fehler beim Abrufen der Channels:', error);
        }
  }
}
