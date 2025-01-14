import { Component, OnDestroy, OnInit, Input } from '@angular/core';
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
  @Input() placeholder: string = 'Nachricht an #Entwicklerteam';
  messageText: string = '';
  private currentChannel: any;
  private currentUser: any;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private firestore: Firestore,
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.chatService.currentChannel$.subscribe((channel) => {
        this.currentChannel = channel;
      })
    );

    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        this.currentUser = user;
      })
    );
  }

  async sendMessage() {
    if (!this.messageText.trim()) return;

    try {
      if (!this.currentUser) {
        console.error('Kein Benutzer angemeldet');
        return;
      }

      const messageData = {
        authorId: this.currentUser.uid,
        channelId: this.currentChannel?.id || null,
        message: this.messageText,
        time: serverTimestamp(),
        comments: {
          0: 1, // Standardwert für comments
        },
        emojis: {
          0: 'hands', // Standardwert für emojis
        },
        userMessageId: Date.now(), // Temporäre ID-Generierung
        directUserId: null, // Für Channel-Nachrichten nicht benötigt
      };

      // Füge Nachricht zur Collection hinzu
      const messagesRef = collection(this.firestore, 'userMessages');
      await addDoc(messagesRef, messageData);

      // Setze Nachrichtenfeld zurück
      this.messageText = '';
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
