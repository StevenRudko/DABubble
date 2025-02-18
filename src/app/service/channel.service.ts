import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  onSnapshot,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChannelInterface } from '../models/channel-interface';

/**
 * Service for managing channel data and operations
 */
@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  /** Subject holding current channels data */
  private channelsSubject = new BehaviorSubject<ChannelInterface[]>([]);
  /** Observable for channels data */
  channels$ = this.channelsSubject.asObservable();

  /**
   * Initializes service and loads channels data
   * @param firestore - Firestore instance for database operations
   */
  constructor(private firestore: Firestore) {
    this.getChannels();
    setTimeout(() => console.log(this.channelsSubject.value), 2000);
  }

  /**
   * Gets reference to single channel document
   * @param channelId - ID of channel to retrieve
   * @returns Firestore document reference
   */
  getChannel(channelId: string) {
    return doc(this.firestore, 'channels', channelId);
  }

  /**
   * Fetches all channels and updates channels subject
   * Sets up real-time listener for channel changes
   */
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
