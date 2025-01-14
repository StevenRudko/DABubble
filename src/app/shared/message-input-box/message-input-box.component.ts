// In message-input-box.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MATERIAL_MODULES } from '../material-imports';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { ChatService } from '../../service/chat.service';
import { AuthService } from '../../service/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-message-input-box',
  standalone: true,
  imports: [FormsModule, MATERIAL_MODULES],
  templateUrl: './message-input-box.component.html',
  styleUrl: './message-input-box.component.scss',
})
export class MessageInputBoxComponent implements OnInit, OnDestroy {
  messageText: string = '';
  placeholder: string = 'Nachricht schreiben...';
  private currentChannel: any;
  private currentUser: any;
  private currentDirectUser: any;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private firestore: Firestore,
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Channel Subscription
    this.subscriptions.add(
      this.chatService.currentChannel$.subscribe((channel) => {
        this.currentChannel = channel;
        if (channel) {
          this.placeholder = `Nachricht an #${channel.name}`;
        }
      })
    );

    // Direct Message User Subscription
    this.subscriptions.add(
      this.chatService.currentDirectUser$.subscribe((directUser) => {
        this.currentDirectUser = directUser;
        if (directUser) {
          // Nutze die getDisplayName-Funktion ähnlich wie in der Sidebar
          const displayName = this.getDisplayName(directUser);
          this.placeholder = `Nachricht an ${displayName}`;
        }
      })
    );

    // Current User Subscription
    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        this.currentUser = user;
      })
    );
  }

  getDisplayName(user: any): string {
    if (!user) return 'Unbenannter Benutzer';

    // Prüfe zuerst auf username (aus Firebase)
    if (user.username) return user.username;
    // Fallback auf displayName
    if (user.displayName) return user.displayName;
    // Letzter Fallback auf Email
    if (user.email) return user.email;

    return 'Unbenannter Benutzer';
  }

  async sendMessage() {
    if (!this.messageText.trim()) return;

    try {
      if (!this.currentUser) {
        console.error('Kein Benutzer angemeldet');
        return;
      }

      // Prüfen ob es eine Direktnachricht oder Channelnachricht ist
      const isDirectMessage = !!this.currentDirectUser;

      const messageData = {
        authorId: this.currentUser.uid,
        // Wenn Direktnachricht, dann kein channelId
        channelId: isDirectMessage ? null : this.currentChannel?.id || null,
        // Wenn Direktnachricht, dann directUserId setzen
        directUserId: isDirectMessage ? this.currentDirectUser.uid : null,
        message: this.messageText.trim(),
        time: serverTimestamp(),
        comments: {
          0: 1,
        },
        emojis: {
          0: 'hands',
        },
        userMessageId: Date.now(),
      };

      const messagesRef = collection(this.firestore, 'userMessages');
      await addDoc(messagesRef, messageData);

      this.messageText = '';
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
