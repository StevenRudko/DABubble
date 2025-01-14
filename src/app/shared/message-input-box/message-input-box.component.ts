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

interface User {
  uid: string;
  username?: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}

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

  /**
   * Initializes message input component
   */
  constructor(
    private firestore: Firestore,
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  /**
   * Sets up subscriptions on init
   */
  ngOnInit(): void {
    this.setupChannelSubscription();
    this.setupDirectMessageSubscription();
    this.setupUserSubscription();
  }

  /**
   * Sets up channel subscription
   */
  private setupChannelSubscription(): void {
    this.subscriptions.add(
      this.chatService.currentChannel$.subscribe((channel) => {
        this.currentChannel = channel;
        if (channel) {
          this.placeholder = `Nachricht an #${channel.name}`;
        }
      })
    );
  }

  /**
   * Sets up direct message subscription
   */
  private setupDirectMessageSubscription(): void {
    this.subscriptions.add(
      this.chatService.currentDirectUser$.subscribe((user) => {
        this.currentDirectUser = user;
        if (user) {
          this.placeholder = `Nachricht an ${this.getDisplayName(user)}`;
        }
      })
    );
  }

  /**
   * Sets up user subscription
   */
  private setupUserSubscription(): void {
    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        this.currentUser = user;
      })
    );
  }

  /**
   * Gets display name for user
   */
  getDisplayName(user: User): string {
    if (!user) return 'Unbenannter Benutzer';
    if (user.username) return user.username;
    if (user.displayName) return user.displayName;
    if (user.email) return user.email;
    return 'Unbenannter Benutzer';
  }

  /**
   * Creates message data object
   */
  private createMessageData(): any {
    const isDirectMessage = !!this.currentDirectUser;
    return {
      authorId: this.currentUser.uid,
      channelId: isDirectMessage ? null : this.currentChannel?.id || null,
      directUserId: isDirectMessage ? this.currentDirectUser.uid : null,
      message: this.messageText.trim(),
      time: serverTimestamp(),
      comments: { 0: 1 },
      emojis: { 0: 'hands' },
      userMessageId: Date.now(),
    };
  }

  /**
   * Sends message to firestore
   */
  async sendMessage(): Promise<void> {
    if (!this.messageText.trim() || !this.currentUser) return;

    try {
      const messageData = this.createMessageData();
      const messagesRef = collection(this.firestore, 'userMessages');
      await addDoc(messagesRef, messageData);
      this.messageText = '';
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  /**
   * Cleanup subscriptions on destroy
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
