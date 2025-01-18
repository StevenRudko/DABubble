import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { UserData } from '../../service/user-data.service';
import { ChannelService } from '../../service/channel.service';
import { UserMessageInterface } from '../../models/user-message';
import { UserInterface } from '../../models/user-interface';

@Component({
  selector: 'app-search-bar',
  imports: [],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent implements OnInit {
  @Input() searchQuery: string = '';
  searchResults: any;

  private userMessages: UserMessageInterface[] = [];
  private users: UserInterface[] = [];

  constructor(
    private userData: UserData,
    // private channelData: ChannelService
  ) { }

  ngOnInit(): void {
    // Beobachten der Benutzernachrichten
    this.userData.userMessages$.subscribe((messages) => {
      this.userMessages = messages;
    });

    // Beobachten der Benutzer
    this.userData.users$.subscribe((users) => {
      this.users = users;
    });
    setTimeout(() => {
      console.log(this.users, this.userMessages);
    }, 3000)
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchQuery']) {
      this.filterResults();
    }
  }

  private filterResults() {
    const query = this.searchQuery.toLowerCase();

    // Filtere Nachrichten basierend auf relevanten Feldern
    const filteredMessages = this.userMessages
      .filter((msg) =>
        msg.message?.toLowerCase().includes(query) ||  // Nach Inhalt der Nachricht suchen
        msg.authorId?.toLowerCase().includes(query) // || // Nach Author-ID suchen
        // msg.directUserId?.toLowerCase().includes(query) // Nach Direktnachrichten-Benutzer suchen
      )
      .map((msg) => ({
        type: 'message',
        content: msg.message,
        channelId: msg.channelId,
        authorId: msg.authorId,
        directUserId: msg.directUserId
      }));

    // Filtere Benutzer basierend auf relevanten Feldern
    const filteredUsers = this.users
      .filter((user) =>
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      )
      .map((user) => ({
        type: 'user',
        content: user.username,
        uID: user.localID,
        photoURL: user.photoURL,
        email: user.email
      }));

    // Kombiniere die Ergebnisse
    // if (this.searchQuery) {
      this.searchResults = [...filteredMessages, ...filteredUsers];
    // } else {
      // this.searchResults = ''
    // }
    
    console.log(this.searchResults);
  }

}