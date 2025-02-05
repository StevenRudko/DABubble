import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  Input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { ChatService } from '../../service/chat.service';
import { AuthService } from '../../service/auth.service';
import { Subscription } from 'rxjs';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { UserData } from '../../service/user-data.service';
import { MentionHighlightPipe } from '../pipes/mentionHighlight.pipe';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface User {
  uid: string;
  username?: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}

interface SearchResult {
  id: string;
  type: 'channel' | 'user';
  name: string;
  email?: string;
  photoURL?: string;
  description?: string;
  online?: boolean;
}

interface MentionedUser {
  uid: string;
  username: string;
  displayName: string | null | undefined; // Fügen Sie undefined hinzu
  photoURL: string | null | undefined; // Fügen Sie undefined hinzu
  start: number;
  end: number;
}

interface MentionTag {
  id: string;
  username: string;
  displayName: string | null | undefined;
  photoURL: string | null | undefined;
  start: number;
  end: number;
}

@Component({
  selector: 'app-message-input-box',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    EmojiPickerComponent,
    MentionHighlightPipe,
  ],
  templateUrl: './message-input-box.component.html',
  styleUrl: './message-input-box.component.scss',
})
export class MessageInputBoxComponent implements OnInit, OnDestroy {
  @ViewChild('messageInput') messageInput!: ElementRef;
  @Input() isThreadMessage: boolean = false;
  @Input() parentMessageId: string | null = null;
  @Input() placeholder: string = 'Nachricht schreiben...';

  messageText: string = '';
  private currentChannel: any;
  private currentUser: any;
  private currentDirectUser: any;
  private newMessageRecipient: SearchResult | null = null;
  private subscriptions: Subscription = new Subscription();
  private isNewMessage: boolean = false;
  showEmojiPicker: boolean = false;

  // Neue Properties für Mentions
  showMentionDropdown = false;
  mentionSearchResults: User[] = [];
  mentionedUsers: MentionedUser[] = [];
  mentionSearchTerm = '';
  cursorPosition = 0;
  mentionTags: MentionTag[] = [];
  plainText: string = '';

  constructor(
    private firestore: Firestore,
    private chatService: ChatService,
    private authService: AuthService,
    private elementRef: ElementRef,
    private userData: UserData,
    private sanitizer: DomSanitizer
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const inputBox = this.elementRef.nativeElement;
    if (!inputBox.contains(event.target)) {
      if (this.messageInput?.nativeElement) {
        this.messageInput.nativeElement.dataset.focused = 'false';
      }
      this.showEmojiPicker = false;
      this.showMentionDropdown = false;
    } else {
      if (this.messageInput?.nativeElement) {
        this.messageInput.nativeElement.dataset.focused = 'true';
      }
    }
  }

  toggleEmojiPicker(event: MouseEvent): void {
    event.stopPropagation();
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  handleEmojiSelected(emoji: any): void {
    const textarea = this.messageInput.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    this.messageText =
      this.messageText.substring(0, start) +
      emoji.emoji +
      this.messageText.substring(end);

    setTimeout(() => {
      textarea.selectionStart = start + emoji.emoji.length;
      textarea.selectionEnd = start + emoji.emoji.length;
      textarea.focus();
    });

    this.showEmojiPicker = false;
  }

  ngOnInit(): void {
    this.setupUserSubscription();
    if (!this.isThreadMessage) {
      this.setupChannelSubscription();
      this.setupDirectMessageSubscription();
      this.setupNewMessageSubscription();
    }
  }

  private setupChannelSubscription(): void {
    this.subscriptions.add(
      this.chatService.currentChannel$.subscribe((channel) => {
        this.currentChannel = channel;
        if (channel && !this.isNewMessage && !this.isThreadMessage) {
          this.placeholder = `Nachricht an #${channel.name}`;
          this.focusInput();
        }
      })
    );
  }

  private setupDirectMessageSubscription(): void {
    this.subscriptions.add(
      this.chatService.currentDirectUser$.subscribe((user) => {
        this.currentDirectUser = user;
        if (user && !this.isNewMessage && !this.isThreadMessage) {
          this.placeholder = `Nachricht an ${this.getDisplayName(user)}`;
          this.focusInput();
        }
      })
    );
  }

  private focusInput(): void {
    setTimeout(() => {
      if (this.messageInput?.nativeElement) {
        this.messageInput.nativeElement.focus({ preventScroll: true });
        this.messageInput.nativeElement.dataset.focused = 'true';
      }
    }, 100);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    } else if (event.key === '@') {
      this.handleMentionTrigger();
    } else if (event.key === 'Backspace') {
      const cursorPos = this.messageInput.nativeElement.selectionStart;

      // Finde einen Tag an der aktuellen Position
      const mentionTag = this.mentionTags.find(
        (tag) => cursorPos > tag.start && cursorPos <= tag.end + 1
      );

      if (mentionTag) {
        event.preventDefault();
        // Entferne den kompletten Tag
        this.messageText =
          this.messageText.substring(0, mentionTag.start) +
          this.messageText.substring(mentionTag.end + 1);

        // Entferne den Tag aus den Arrays
        this.mentionTags = this.mentionTags.filter((t) => t !== mentionTag);
        this.mentionedUsers = this.mentionedUsers.filter(
          (u) => u.start !== mentionTag.start && u.end !== mentionTag.end
        );

        // Setze den Cursor an die richtige Position
        setTimeout(() => {
          this.messageInput.nativeElement.selectionStart = mentionTag.start;
          this.messageInput.nativeElement.selectionEnd = mentionTag.start;
        });
      }
    }
  }

  onInput(event: Event): void {
    const textarea = this.messageInput.nativeElement;
    this.cursorPosition = textarea.selectionStart;

    // Einfache Prüfung am Anfang - wenn Text leer ist, setze Tags zurück
    if (!this.messageText.trim()) {
      this.mentionTags = [];
      this.mentionedUsers = [];
    }

    if (this.showMentionDropdown) {
      const lastIndex = this.messageText.lastIndexOf(
        '@',
        this.cursorPosition - 1
      );
      if (lastIndex >= 0) {
        const searchText = this.messageText.slice(
          lastIndex + 1,
          this.cursorPosition
        );
        if (searchText.includes(' ')) {
          this.showMentionDropdown = false;
          return;
        }
        this.mentionSearchTerm = searchText;
        this.searchUsers(this.mentionSearchTerm);
      } else {
        this.showMentionDropdown = false;
      }
    }
  }

  private async searchUsers(term: string): Promise<void> {
    if (!term.trim()) {
      const usersRef = collection(this.firestore, 'users');
      const snapshot = await getDocs(usersRef);
      this.mentionSearchResults = snapshot.docs
        .map(
          (doc) =>
            ({
              uid: doc.id,
              ...doc.data(),
            } as User)
        )
        .slice(0, 5); // Limit to 5 results when no search term
      return;
    }

    const usersRef = collection(this.firestore, 'users');
    const q = query(
      usersRef,
      where('username', '>=', term),
      where('username', '<=', term + '\uf8ff')
    );

    try {
      const snapshot = await getDocs(q);
      this.mentionSearchResults = snapshot.docs.map(
        (doc) =>
          ({
            uid: doc.id,
            ...doc.data(),
          } as User)
      );
    } catch (error) {
      console.error('Error searching users:', error);
      this.mentionSearchResults = [];
    }
  }

  handleMentionTrigger(): void {
    this.showMentionDropdown = true;
    this.searchUsers('');
  }

  selectMention(user: User): void {
    const textarea = this.messageInput.nativeElement;
    const lastIndex = this.messageText.lastIndexOf(
      '@',
      this.cursorPosition - 1
    );

    // Sicherer Umgang mit möglicherweise undefiniertem username
    const username = user.username || user.displayName || user.email || 'user';
    const mentionText = username;

    // Erstelle den Tag
    const mentionTag: MentionTag = {
      id: user.uid,
      username: username,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      start: lastIndex,
      end: lastIndex + mentionText.length + 1,
    };

    // Füge den Tag zur Liste hinzu
    this.mentionTags.push(mentionTag);

    // Update text - Hier die Änderung
    this.messageText =
      this.messageText.substring(0, lastIndex) +
      '@' + // Explizit das @ hinzufügen
      mentionText +
      ' '; // Leerzeichen am Ende

    // Aktualisiere mentionedUsers für die Datenbank
    this.mentionedUsers.push({
      uid: mentionTag.id,
      username: mentionTag.username,
      displayName: mentionTag.displayName,
      photoURL: mentionTag.photoURL,
      start: mentionTag.start,
      end: mentionTag.end,
    });

    this.showMentionDropdown = false;
    this.mentionSearchResults = [];

    // Cursor ans Ende setzen
    const newCursorPos = lastIndex + mentionText.length + 2; // +2 für @ und Leerzeichen
    textarea.focus();
    setTimeout(() => {
      textarea.selectionStart = newCursorPos;
      textarea.selectionEnd = newCursorPos;
    });
  }

  private setupUserSubscription(): void {
    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        this.currentUser = user;
      })
    );
  }

  private setupNewMessageSubscription(): void {
    this.subscriptions.add(
      this.chatService.isNewMessage$.subscribe((isNew) => {
        this.isNewMessage = isNew;
        if (isNew) {
          this.setupNewMessageRecipientSubscription();
        } else {
          this.newMessageRecipient = null;
        }
      })
    );
  }

  private setupNewMessageRecipientSubscription(): void {
    this.subscriptions.add(
      this.chatService.selectedSearchResult$.subscribe((recipient) => {
        this.newMessageRecipient = recipient;
        if (recipient) {
          this.placeholder = `Nachricht an ${
            recipient.type === 'channel' ? '#' : ''
          }${recipient.name}`;
        } else {
          this.placeholder = 'Wähle einen Empfänger aus...';
        }
      })
    );
  }

  getDisplayName(user: User): string {
    if (!user) return 'Unbenannter Benutzer';
    if (user.username) return user.username;
    if (user.displayName) return user.displayName;
    if (user.email) return user.email;
    return 'Unbenannter Benutzer';
  }

  private createMessageData(): any {
    const baseMessage = {
      authorId: this.currentUser.uid,
      message: this.messageText.trim(),
      time: serverTimestamp(),
      comments: [],
      emojis: {},
      mentions: this.mentionedUsers.map((user) => ({
        uid: user.uid,
        username: user.username,
        start: user.start,
        end: user.end,
      })),
    };

    if (this.isNewMessage && this.newMessageRecipient) {
      return {
        ...baseMessage,
        channelId:
          this.newMessageRecipient.type === 'channel'
            ? this.newMessageRecipient.id
            : null,
        directUserId:
          this.newMessageRecipient.type === 'user'
            ? this.newMessageRecipient.id
            : null,
      };
    }

    return {
      ...baseMessage,
      channelId: this.currentChannel?.id || null,
      directUserId: this.currentDirectUser?.uid || null,
    };
  }

  async sendMessage(): Promise<void> {
    if (!this.messageText.trim() || !this.currentUser) return;
    if (this.isNewMessage && !this.newMessageRecipient && !this.isThreadMessage)
      return;

    try {
      if (this.isThreadMessage && this.parentMessageId) {
        // Entfernen des vierten Arguments (mentions)
        await this.userData.addThreadMessage(
          this.parentMessageId,
          this.messageText.trim(),
          this.currentUser.uid
        );
      } else {
        const messageData = this.createMessageData();
        const messagesRef = collection(this.firestore, 'userMessages');
        await addDoc(messagesRef, messageData);
      }

      // Reset all message-related data
      this.messageText = '';
      this.mentionedUsers = [];
      this.mentionTags = []; // Reset the mentionTags array

      if (
        this.isNewMessage &&
        this.newMessageRecipient &&
        !this.isThreadMessage
      ) {
        if (this.newMessageRecipient.type === 'channel') {
          await this.chatService.selectChannel(this.newMessageRecipient.id);
        } else {
          await this.chatService.selectDirectMessage(
            this.newMessageRecipient.id
          );
        }
        this.chatService.messageWasSent();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  insertAtSymbol(): void {
    const textarea = this.messageInput.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    this.messageText =
      this.messageText.substring(0, start) +
      '@' +
      this.messageText.substring(end);

    setTimeout(() => {
      textarea.selectionStart = start + 1;
      textarea.selectionEnd = start + 1;
      textarea.focus();
    });

    this.handleMentionTrigger();
  }

  getFormattedText(): SafeHtml {
    let text = this.messageText;
    const sortedTags = [...this.mentionTags].sort((a, b) => b.start - a.start);

    sortedTags.forEach((tag) => {
      const mention = `@${tag.username}`;
      text =
        text.slice(0, tag.start) +
        `<span class="mention input-mention" data-user-id="${tag.id}">${mention}</span>` +
        text.slice(tag.end + 1);
    });

    return this.sanitizer.bypassSecurityTrustHtml(text);
  }
}
