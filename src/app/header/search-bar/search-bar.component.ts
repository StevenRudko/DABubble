import { Component, HostListener, Input, OnInit, SimpleChanges } from '@angular/core';
import { UserData } from '../../service/user-data.service';
import { ChannelService } from '../../service/channel.service';
import { UserMessageInterface } from '../../models/user-message';
import { UserInterface } from '../../models/user-interface';
import { SearchResult } from '../../models/search-result';
import { MatDialog } from '@angular/material/dialog';
import { ProfileOverviewComponent } from '../../shared/profile-overview/profile-overview.component';
import { PresenceService } from '../../service/presence.service';
import { ChatService } from '../../service/chat.service';
import { take } from 'rxjs';
import { ShowHiddeResultsService } from '../../service/show-hidde-results.service';
import { UserInfosService } from '../../service/user-infos.service';
import { ChannelInterface } from '../../models/channel-interface';
import { lastValueFrom } from 'rxjs';
import { ThreadService } from '../../service/open-thread.service';
import { MainContentComponent } from '../../main-content/main-content.component';
import { UserMessage } from '../../models/chat.interfaces';

/**
 * The `SearchBarComponent` provides a search functionality for messages, users, and channels.
 * It filters search results dynamically based on the user's input and supports navigation
 * to relevant chat locations.
 */
@Component({
  selector: 'app-search-bar',
  imports: [],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent implements OnInit {
  @Input() searchQuery: string = '';
  showResult: boolean = false;
  borderTrigger: boolean = false;
  searchResults: SearchResult[] = [];
  responsive: boolean = false;

  private userMessages: UserMessageInterface[] = [];
  private users: UserInterface[] = [];
  private channels: ChannelInterface[] = [];

  /**
   * Initializes the component with required services.
   */
  constructor(
    private userData: UserData,
    private channelData: ChannelService,
    private dialog: MatDialog,
    private presenceService: PresenceService,
    private chatService: ChatService,
    public showHiddeService: ShowHiddeResultsService,
    public userInfo: UserInfosService,
    private threadService: ThreadService,
    private mainContent: MainContentComponent
  ) {
    this.onResize();
  }

  /**
   * Initializes the component and subscribes to data streams.
   * Fetches users, channels, and messages for search filtering.
   */
  ngOnInit(): void {
    this.userData.userMessages$.subscribe(
      (messages) => (this.userMessages = messages)
    );
    this.userData.users$.subscribe((users) => (this.users = users));
    this.channelData.channels$.subscribe(
      (channel) => (this.channels = channel)
    );
    this.showHiddeService.showResult$.subscribe(
      (value) => (this.showResult = value)
    );
    this.showHiddeService.borderTrigger$.subscribe(
      (value) => (this.borderTrigger = value)
    );
  }

  /**
   * Watches for changes in the search query and triggers filtering.
   * @param {SimpleChanges} changes - Contains changes to the component's input properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchQuery']) {
      this.filterResults();
    }
  }

  /**
   * Filters search results based on the user's query.
   * - Converts the search query to lowercase for case-insensitive matching.
   * - Filters messages, users, and channels separately.
   * - Updates the `searchResults` array with the combined filtered results.
   * - Calls `updateBorderTrigger()` to adjust UI styling based on results.
   * 
   * @private
   * @returns {void}
   */
  private filterResults(): void {
    const query = this.searchQuery.toLowerCase();
    const filteredMessages = this.filterMessages(query);
    const filteredUsers = this.filterUser(query);
    const filteredChannel = this.filterChannel(query);
    if (this.searchQuery) {
      this.searchResults = [...filteredMessages, ...filteredUsers, ...filteredChannel];
    } else {
      this.searchResults = [];
    }
    this.updateBorderTrigger();
  }

  /**
   * Filters messages based on a search query and returns structured search results.
   * - Checks if messages match the query (either by content or author).
   * - Ensures the current user has permission to see the message.
   * - Determines the type of message (channel message, direct message, or thread).
   * 
   * @private
   * @param {string} query - The search query entered by the user.
   * @returns {SearchResult[]} - A list of filtered messages as structured search results.
   */
  private filterMessages(query: string): SearchResult[] {
    return this.userMessages
      .filter((msg) => this.messageMatchesQuery(msg, query))
      .map((msg) => this.getMessageType(msg))
      .filter((msg): msg is SearchResult => msg !== undefined);
  }

  /**
   * Determines if a message matches the search query.
   * - Checks if the message content includes the query.
   * - Checks if the author matches the query.
   * - Ensures the current user has permission to see the message.
   * 
   * @private
   * @param {UserMessageInterface} msg - The message object being checked.
   * @param {string} query - The lowercase search query for comparison.
   * @returns {boolean} - `true` if the message matches the query and is visible, otherwise `false`.
   */
  private messageMatchesQuery(msg: UserMessageInterface, query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return msg.message?.toLowerCase().includes(lowerQuery) && this.canCurrentUserSeeMessage(msg) ||
      this.isAuthorMatching(msg, lowerQuery) && this.canCurrentUserSeeMessage(msg)
  }

  /**
   * Determines the type of a message and processes it accordingly.
   * - If the message belongs to a channel, it is categorized as a `message`.
   * - If the message is a direct message, it is categorized as a `directMessage`.
   * - If the message does not belong to a channel or direct message, it is considered a `thread`.
   * 
   * @private
   * @param {UserMessageInterface} msg - The message object to classify.
   * @returns - A structured search result if a valid message type is found, otherwise `undefined`.
   */
  private getMessageType(msg: UserMessageInterface) {
    if (msg.channelId) {
      return this.filterMessage(msg, 'message');
    }
    if (msg.directUserId) {
      return this.filterMessage(msg, 'directMessage');
    }
    if (!msg.channelId && !msg.directUserId) {
      return this.filterMessage(msg, 'thread');
    }
    return undefined;
  }

  /**
   * Constructs a structured search result from a given user message.
   * - Retrieves relevant user, channel, and thread information.
   * - Determines whether the message belongs to a thread, direct message, or channel.
   * - Provides fallback values for missing or deleted users/messages.
   * 
   * @param {UserMessageInterface} msg - The user message object to be processed.
   * @param {string} type - The type of message (`message`, `directMessage`, or `thread`).
   * @returns - A structured search result containing message and user details.
   */
  filterMessage(msg: UserMessageInterface, type: string) {
    const author = this.getUserById(msg.authorId);
    const channel = this.getChannelById(msg.channelId);
    const directMessageName = this.getUserById(msg.directUserId);
    const threadMessage = this.getThreadMessageById(msg.userMessageId);
    const respondent = this.getUserById(threadMessage?.authorId);
    const threadChannel = this.getChannelById(threadMessage?.channelId);
    const threadDirectUserDirect = this.getUserById(threadMessage?.directUserId);
    const threadDirectUserId = this.findRightDirectUserId(threadMessage!);
    const threadDirectUsername = this.findRightDirectRespondName(threadMessage!, msg,
      threadDirectUserDirect!, respondent!);

    return {
      type: type || '',
      authorId: msg.authorId || '',
      username: author!.username || 'Gelöscht',
      photoURL: author!.photoURL || 'img-placeholder/person.png',
      channelId: msg.channelId || threadChannel?.channelId || '',
      directUserId: threadDirectUserId || msg.directUserId || '',
      message: msg.message || '',
      time: msg.time || 0,
      userMessageId: msg.userMessageId || '',
      channelName: channel?.name || threadChannel?.name || 'Gelöscht',
      directUserName: directMessageName?.username || threadDirectUsername || 'Gelöscht',
      nameOfTheRespondent: respondent?.username || 'Gelöscht',
      idOfTheRespondentMessage: threadMessage?.userMessageId || 'Gelöscht',
    };
  }

  /**
   * Finds a user by their unique local ID.
   * 
   * @private
   * @param {string} [userId] - The local ID of the user to find.
   * @returns {UserInterface | undefined} - The matching user object, or `undefined` if not found.
   */
  private getUserById(userId?: string): UserInterface | undefined {
    return this.users.find((user) => user.localID === userId);
  }

  /**
   * Finds a channel by its unique channel ID.
   * 
   * @private
   * @param {string} [channelId] - The ID of the channel to find.
   * @returns {ChannelInterface | undefined} - The matching channel object, or `undefined` if not found.
   */
  private getChannelById(channelId?: string): ChannelInterface | undefined {
    return this.channels.find((channel) => channel.channelId === channelId);
  }

  /**
   * Finds a thread message by its user message ID.
   * - Searches for a message where the given `userMessageId` exists in the `comments` array.
   * 
   * @private
   * @param {string} [userMessageId] - The ID of the message to find.
   * @returns {UserMessageInterface | undefined} - The matching thread message object, or `undefined` if not found.
   */
  private getThreadMessageById(userMessageId?: string): UserMessageInterface | undefined {
    return this.userMessages.find((message) =>
      message.comments.includes(userMessageId!)
    );
  }

  /**
   * Determines the correct username of the respondent in a thread.
   * - Compares the author ID and direct user ID of the thread message.
   * - Returns the appropriate username based on the message and thread relationship.
   * 
   * @param {UserMessageInterface} threadMessage - The main thread message being analyzed.
   * @param {UserMessageInterface} msg - The current user message being processed.
   * @param {UserInterface} threadDirectUserDirect - The direct user in the thread (from a direct message).
   * @param {UserInterface} threadDirectUserChannel - The user responding in the thread (from a channel).
   * @returns {string} - The username of the correct respondent.
   */
  findRightDirectRespondName(threadMessage: UserMessageInterface, msg: UserMessageInterface,
    threadDirectUserDirect: UserInterface, threadDirectUserChannel: UserInterface): string {
    if (threadMessage?.authorId === threadMessage?.directUserId) {
      if (msg.authorId === threadMessage?.directUserId) {
        return threadDirectUserChannel?.username;
      } else {
        return threadDirectUserDirect?.username;
      }
    } else {
      if (msg.authorId === threadMessage?.directUserId) {
        return threadDirectUserChannel?.username;
      } else {
        return threadDirectUserDirect?.username
      }
    }
  }

  /**
   * Determines the correct direct user ID in a thread conversation.
   * - If the `directUserId` of the thread message matches the current user's ID, 
   *   return the `authorId` (indicating the message is directed at the author).
   * - Otherwise, return the `directUserId` (indicating the message is directed at the other user).
   * 
   * @param {UserMessageInterface} threadMessage - The thread message being analyzed.
   * @returns {string | undefined} - The correct direct user ID, or `undefined` if no match is found.
   */
  findRightDirectUserId(threadMessage: UserMessageInterface): string | undefined {
    if (threadMessage?.directUserId === this.userInfo.uId) {
      return threadMessage?.authorId;
    } else {
      return threadMessage?.directUserId;
    }
  }

  /**
   * Filters users based on a search query.
   * - Matches users by username or email.
   * - Maps filtered users into structured search results.
   * - Ensures only defined search results are included.
   * 
   * @param {string} query - The search query entered by the user.
   * @returns {SearchResult[]} - An array of filtered users as structured search results.
   */
  private filterUser(query: string): SearchResult[] {
    return this.users
      .filter((user) => this.userMatchesQuery(user, query))
      .map((user) => this.mapUserToSearchResult(user))
      .filter((result): result is SearchResult => result !== undefined);
  }

  /**
   * Checks if a user matches the search query.
   * - Performs a case-insensitive match against the username and email.
   * 
   * @private
   * @param {UserInterface} user - The user to check against the query.
   * @param {string} query - The search query entered by the user.
   * @returns {boolean} - True if the user matches the query, otherwise false.
   */
  private userMatchesQuery(user: UserInterface, query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return user.username?.toLowerCase().includes(lowerQuery) ||
      user.email?.toLowerCase().includes(lowerQuery);
  }

  /**
   * Maps a user object to a structured search result.
   * - Converts a `UserInterface` into a `SearchResult` object.
   * 
   * @private
   * @param {UserInterface} user - The user to map.
   * @returns - A structured search result containing user details.
   */
  private mapUserToSearchResult(user: UserInterface) {
    return {
      type: 'user',
      username: user.username,
      localID: user.localID,
      photoURL: user.photoURL,
      email: user.email,
    };
  }

  /**
   * Checks if the author of a message matches the search query.
   * - Retrieves the author by matching `authorId` with `localID`.
   * - Performs a case-insensitive comparison of the author's username with the search query.
   * 
   * @private
   * @param {UserMessageInterface} msg - The message whose author is being checked.
   * @param {string} query - The search query entered by the user.
   * @returns {boolean} - True if the author's username matches the query, otherwise false.
   */
  private isAuthorMatching(msg: UserMessageInterface, query: string): boolean {
    const author = this.users.find((user) => user.localID === msg.authorId);
    return author ? author.username.toLowerCase().includes(query) : false;
  }

  /**
   * Determines if the currently logged-in user is allowed to see a specific message.
   * - Returns `true` if the message is a direct message addressed to the current user.
   * - Returns `true` if the current user is the author of the message.
   * - Returns `true` if the message belongs to a channel where the user is a member.
   * - Returns `true` if the message is part of a thread that the user can access.
   * 
   * @private
   * @param {UserMessageInterface} msg - The message to check visibility for.
   * @returns {boolean} - `true` if the user is allowed to see the message, otherwise `false`.
   */
  private canCurrentUserSeeMessage(msg: UserMessageInterface): boolean {
    if (msg.directUserId === this.userInfo.uId) {
      return true;
    }
    if (msg.authorId === this.userInfo.uId) {
      return true;
    }
    if (msg.channelId) {
      return this.isUserInChannel(msg.channelId);
    }
    if (msg.authorId) {
      return this.isUserInChannelThread(msg);
    }
    return false;
  }

  /**
   * Checks if the currently logged-in user is a member of a given channel.
   * - Searches for the channel by its `channelId`.
   * - Verifies if the user exists in the `members` list of the channel.
   * 
   * @param {string} channelId - The unique identifier of the channel to check.
   * @returns {boolean} - `true` if the user is a member of the channel, otherwise `false`.
   */
  isUserInChannel(channelId: string): boolean {
    return this.channels.some(
      ch => ch.channelId === channelId && ch.members?.[this.userInfo.uId] === true
    );
  }

  /**
   * Determines if the currently logged-in user has access to a message thread in a channel or direct message.
   * - Checks if the message is a reply to a main message.
   * - If the main message belongs to a channel, verifies if the user is a member of that channel.
   * - If the main message is a direct message, verifies if the user is one of the participants.
   * 
   * @param {UserMessageInterface} message - The thread message to check access for.
   * @returns {boolean} - `true` if the user has access to the thread, otherwise `false`.
   */
  private isUserInChannelThread(message: UserMessageInterface): boolean {
    const mainMessage = this.userMessages.find(msg => msg.comments.includes(message.userMessageId));
    if (!mainMessage) {
      return false;
    } else if (this.isUserInChannel(mainMessage.channelId)) {
      return true;
    } else {
      if (this.userMessages.find(msg =>
        msg.directUserId === message.authorId && message.authorId === this.userInfo.uId ||
        msg.directUserId === message.authorId && mainMessage.directUserId === this.userInfo.uId) ||
        mainMessage.authorId === this.userInfo.uId) {
        return true
      } else {
        return false
      }
    }
  }

  /**
   * Updates the border trigger state based on the search results.
   * - Checks if the search result list is empty or not.
   * - If the current border state differs from the expected state, it updates the border visibility.
   * 
   * @private
   * @returns {void}
   */
  private updateBorderTrigger(): void {
    const isEmpty = this.searchResults.length !== 0;
    if (this.showHiddeService.getBorderTrigger() !== isEmpty) {
      this.showHiddeService.setBorderTrigger(isEmpty);
    }
  }

  /**
   * Opens a profile overview dialog for a selected search result.
   * - Configures and opens a Material Dialog displaying user profile details.
   * - Closes the search results overlay after opening the profile.
   * 
   * @param {SearchResult} result - The selected search result containing user details.
   * @returns {void}
   */
  showProfile(result: SearchResult): void {
    const dialogConfig = {
      data: result,
      panelClass: false
        ? ['profile-dialog', 'right-aligned']
        : ['profile-dialog', 'center-aligned'],
      width: '400px',
    };

    this.dialog.open(ProfileOverviewComponent, dialogConfig);
    this.showHiddeService.setShowResult(false);
  }

  /**
   * Checks whether a user with the given ID is currently online.
   * - Subscribes to the `onlineUsers$` observable from `PresenceService`.
   * - Retrieves the online status for the specified user ID.
   * - Unsubscribes immediately to prevent memory leaks.
   * 
   * @param {string} id - The unique user ID whose online status is being checked.
   * @returns {boolean} - `true` if the user is online, otherwise `false`.
   */
  getPresenceStatus(id: string): boolean {
    let isOnline = false;
    this.presenceService.onlineUsers$
      .subscribe((onlineUsers) => {
        isOnline = onlineUsers[id] === 'online';
      })
      .unsubscribe();

    return isOnline;
  }

  /**
   * Filters channels based on a search query.
   * - Searches for channels whose names contain the query (case-insensitive).
   * - Maps the filtered channels into structured search results.
   * - Ensures only defined search results are included.
   * 
   * @param {string} query - The search query entered by the user.
   * @returns {SearchResult[]} - An array of filtered channels as structured search results.
   */
  filterChannel(query: string): SearchResult[] {
    return this.channels
      .filter(
        (channel) =>
          channel.name?.toLowerCase().includes(query)
      )
      .map((channel) => {
        return this.channelResultData(channel);
      })
      .filter((channel): channel is SearchResult => channel !== undefined);
  }

  /**
   * Converts a channel object into a structured search result if the user is a member of the channel.
   * - Checks if the current user is a member of the channel.
   * - Maps channel members to an array with `uid`, `username`, and `photoURL`.
   * - Returns a structured `SearchResult` object containing channel details.
   * 
   * @param {any} channel - The channel object to be processed.
   * @returns - A structured search result if the user is a member, otherwise `undefined`.
   */
  channelResultData(channel: ChannelInterface) {
    if (this.isUserInChannel(channel.channelId)) {
      const members = Object.keys(channel.members).map((uid: string) => {
        const channelMember = this.users.find(user => user.localID === uid);
        return channelMember ? { uid: channelMember.localID, username: channelMember.username, photoURL: channelMember.photoURL } : { uid, username: 'Unknown', photoURL: '' };
      });
      return {
        type: 'channel',
        channelId: channel.channelId,
        channelName: channel.name,
        channelDescription: channel.description,
        channelMembers: members,
      }
    } else {
      return
    }
  }

  /**
   * Opens a specific message within a channel.
   * - Temporarily disables auto-scrolling to ensure proper navigation.
   * - Loads the specified channel.
   * - Scrolls to the target message within the chat container.
   * - Re-enables auto-scrolling after navigation.
   * 
   * @param {string} channelId - The unique ID of the channel containing the message.
   * @param {string} messageId - The unique ID of the message to scroll to.
   * @returns {Promise<void>} - Resolves when the message has been opened and scrolled to.
   */
  async openMessage(channelId: string, messageId: string): Promise<void> {
    await this.showChannel(channelId);
    this.scrollWhenAvailable(messageId, 'chatContainer');
  }

  /**
   * Displays the specified channel if it is not already selected.
   * - Retrieves the currently active channel.
   * - If the requested channel is different, it switches to the new channel.
   * - Closes the search results overlay.
   * - If the app is in responsive mode, ensures the chat interface is displayed.
   * 
   * @param {string} channelId - The unique ID of the channel to be displayed.
   * @returns {Promise<void>} - Resolves when the channel has been displayed.
   */
  async showChannel(channelId: string): Promise<void> {
    const currentChannel = await lastValueFrom(this.chatService.currentChannel$.pipe(take(1)));
    if (!currentChannel || currentChannel.id !== channelId) {
      this.chatService.selectChannel(channelId);
    }
    this.showHiddeService.setShowResult(false);
    if (this.responsive) {
      this.mainContent.showChat(true);
    }
  }

  /**
   * Opens a direct message conversation and scrolls to the specified message.
   * - Temporarily disables auto-scrolling to ensure proper navigation.
   * - Loads the direct message conversation with the specified user.
   * - Scrolls to the target message within the chat container.
   * - Re-enables auto-scrolling after navigation.
   * 
   * @param {any} result - The search result containing details about the direct message.
   * @returns {Promise<void>} - Resolves when the direct message is opened and scrolled to.
   */
  async openDirectMessage(result: any): Promise<void> {
    await this.showDirectMessage(result);
    this.scrollWhenAvailable(result.userMessageId, 'chatContainer');
  }

  /**
   * Opens a direct message conversation with a specified user.
   * - If the current user is the recipient (`directUserId`), checks if the chat is already open.
   * - If the chat is not open, switches to the conversation with the message author.
   * - If the current user is the author, switches to the direct message recipient.
   * - Closes the search results overlay.
   * - Ensures the chat interface is displayed in responsive mode.
   * 
   * @param {any} result - The search result containing details about the direct message.
   * @returns {Promise<void>} - Resolves when the direct message conversation is displayed.
   */
  async showDirectMessage(result: any): Promise<void> {
    if (this.userInfo.uId === result.directUserId) {
      const currentDirectUser = await lastValueFrom(this.chatService.currentDirectUser$.pipe(take(1)));
      if (!currentDirectUser || currentDirectUser !== result.authorId) {
        this.chatService.selectDirectMessage(result.authorId);
      }
    } else {
      this.chatService.selectDirectMessage(result.directUserId);
    }
    this.showHiddeService.setShowResult(false);
    if (this.responsive) {
      this.mainContent.showChat(true);
    }
  }

  /**
   * Opens a thread within a channel or direct message conversation.
   * - Temporarily disables auto-scrolling to ensure proper navigation.
   * - Determines whether the thread belongs to a channel or a direct message.
   * - Calls the appropriate handler to load the thread.
   * - Scrolls to the target message within the chat container.
   * - Re-enables auto-scrolling after navigation.
   * 
   * @param {SearchResult} result - The search result containing details about the thread.
   */
  openThread(result: SearchResult): void {
    if (result.channelId) {
      this.handleChannelThread(result);
    } else if (result.directUserId) {
      this.handleDirectMessageThread(result);
    }
  }

  /**
   * Handles the process of opening a thread within a channel.
   * - Opens the channel.
   * - Scrolls to the respondent message within the chat container.
   * - Opens the thread using `threadService`.
   * - Scrolls to the user's message within the thread.
   * 
   * @private
   * @param {SearchResult} result - The search result containing details about the thread.
   * @returns {Promise<void>} - Resolves when the thread is opened and scrolled to.
   */
  private async handleChannelThread(result: SearchResult): Promise<void> {
    await this.showChannel(result.channelId);
    this.scrollWhenAvailable(result.idOfTheRespondentMessage, 'chatContainer');
    await this.threadService.openThread(result.idOfTheRespondentMessage);
    this.scrollWhenAvailable(result.userMessageId, 'messagesContainer');
  }

  /**
   * Handles the process of opening a thread within a direct message conversation.
   * - Opens the direct message.
   * - Scrolls to the respondent message (the main thread message).
   * - Opens the thread using `threadService`.
   * - Scrolls to the user's message within the thread.
   * 
   * @private
   * @param {any} result - The search result containing details about the thread.
   * @returns {Promise<void>} - Resolves when the thread is opened and scrolled to.
   */
  private async handleDirectMessageThread(result: any): Promise<void> {
    await this.showDirectMessage(result);
    this.scrollWhenAvailable(result.idOfTheRespondentMessage, 'chatContainer');
    await this.threadService.openThread(result.idOfTheRespondentMessage);
    this.scrollWhenAvailable(result.userMessageId, 'messagesContainer');
  }

  /**
   * Attempts to scroll to a message when it becomes available in the DOM.
   * - Uses a `MutationObserver` to detect DOM changes.
   * - Calls `startScrollCheck()` to repeatedly check for the message.
   * - Disconnects the observer once the message is found.
   * 
   * @param {string} messageId - The ID of the message element to scroll to.
   * @param {string} domId - The ID of the container in which to scroll.
   * @returns {void}
   */
  async scrollWhenAvailable(messageId: string, domId: string): Promise<void> {
    const observer = this.observeDOMChanges(() => {
      this.startScrollCheck(messageId, domId);
      observer.disconnect();
    });
  }

  /**
   * Starts a timed loop to check for the availability of a message in the DOM.
   * - Repeats the check up to `maxChecks` times with an interval of `intervalTime` milliseconds.
   * - If the message and container exist, triggers smooth scrolling.
   * - If the message is not found after max attempts, logs a warning.
   * 
   * @private
   * @param {string} messageId - The ID of the message element to locate.
   * @param {string} domId - The ID of the container in which to scroll.
   * @returns {void}
   */
  private startScrollCheck(messageId: string, domId: string): void {
    let checkCounter = 0;
    const maxChecks = 20;
    const intervalTime = 200;
    const interval = setInterval(() => {
      const element = document.getElementById(messageId) as HTMLElement | null;
      const container = document.querySelector(`#${domId}`) as HTMLElement | null;
      if (element && container) {
        setTimeout(() => {
          this.scrollToMessage(container, element);
          clearInterval(interval);
        }, 400)
      }
      if (++checkCounter >= maxChecks) {
        console.warn(`Scroll-Element (${messageId}) oder Container (${domId}) nicht gefunden.`);
        clearInterval(interval);
      }
      if (++checkCounter == maxChecks) {
      }
    }, intervalTime);
  }

  /**
   * Smoothly scrolls a container to bring a specific message into view.
   * - Applies an offset to account for UI elements like a navbar.
   * - Uses smooth scrolling behavior.
   * - Highlights the message after scrolling.
   * 
   * @private
   * @param {HTMLElement} container - The scrolling container.
   * @param {HTMLElement} element - The message element to scroll to.
   * @returns {void}
   */
  private scrollToMessage(container: HTMLElement, element: HTMLElement): void {
    const scrollOffset = 250;
    const targetScroll = element.offsetTop - scrollOffset;
    container.scrollTo({ top: targetScroll, behavior: 'smooth' });
    console.log('Scrolling erfolgreich mit Offset:', scrollOffset, container);
    this.highlightMessage(element);
  }

  /**
   * Observes DOM changes to detect when a new message is added.
   * - Watches for child list modifications in the entire document.
   * - Executes the provided callback function when a change is detected.
   * 
   * @private
   * @param {() => void} callback - The function to execute when a DOM change occurs.
   * @returns {MutationObserver} - The observer instance monitoring the DOM.
   */
  private observeDOMChanges(callback: () => void): MutationObserver {
    const observer = new MutationObserver(() => callback());
    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  }

  /**
   * Highlights a given message element for a short duration.
   * - Adds a CSS class `highlight` to visually emphasize the message.
   * - Removes the highlight effect after 3 seconds.
   * 
   * @param {HTMLElement | null} element - The DOM element representing the message to highlight.
   * @returns {void}
   */
  highlightMessage(element: HTMLElement | null): void {
    if (element) {
      element.classList.add('highlight');

      setTimeout(() => {
        element.classList.remove('highlight');
      }, 3000);
    }
  }

  /**
   * Handles window resize events to determine whether the UI should be in responsive mode.
   * - Uses the `@HostListener` decorator to listen for `window:resize` events.
   * - If the window width is less than 1024px, sets `responsive` to `true`.
   * - Otherwise, sets `responsive` to `false`.
   * 
   * @returns {void}
   */
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.responsive = window.innerWidth < 1024;
  }
}




///////////////////////////FUNKTIONIERT NICHT ÄNDER////////////////////////////////////////////
// filterMessage(msg: UserMessageInterface, type: string) {
//   const author = this.users.find((user) => user.localID === msg.authorId);
//   const channel = this.channels.find((channel) => channel.channelId === msg.channelId)
//   const directMessageName = this.users.find((user) => user.localID === msg.directUserId);
//   const threadMessage = this.userMessages.find((message) => {
//     return message.comments.includes(msg.userMessageId);
//   });
//   const respondent = threadMessage
//     ? this.users.find((user) => user.localID === threadMessage.authorId) : undefined;
//   const threadChannel = this.channels.find((channel) => threadMessage?.channelId === channel.channelId)
//   const threadDirectUserChannel = threadMessage
//     ? this.users.find((user) => user.localID === threadMessage!.authorId) : undefined;
//   const threadDirectUserDirect = threadMessage
//     ? this.users.find((user) => user.localID === threadMessage!.directUserId) : undefined;
//   let threadDirectUserId;
//   let threadDirectUsername;

//   if (threadMessage?.authorId === threadMessage?.directUserId) {
//     if (msg.authorId === threadMessage?.directUserId) {
//       threadDirectUsername = threadDirectUserChannel?.username;
//     } else {
//       threadDirectUsername = threadDirectUserDirect?.username;
//     }
//   } else {
//     if (msg.authorId === threadMessage?.directUserId) {
//       threadDirectUsername = threadDirectUserChannel?.username;
//     } else {
//       threadDirectUsername = threadDirectUserDirect?.username
//     }
//   }

//   if (threadMessage?.directUserId === this.userInfo.uId) {
//     threadDirectUserId = threadMessage?.authorId;
//   } else {
//     threadDirectUserId = threadMessage?.directUserId;
//   }

//   return {
//     type: type || '',
//     authorId: msg.authorId || '',
//     username: author!.username || 'Gelöscht',
//     photoURL: author!.photoURL || 'img-placeholder/person.png',
//     channelId: msg.channelId || threadChannel?.channelId || '',
//     directUserId: threadDirectUserId || msg.directUserId || '',
//     comments: msg.comments || [],
//     emojis: msg.emojis || [],
//     message: msg.message || '',
//     time: msg.time || 0,
//     userMessageId: msg.userMessageId || '',
//     channelName: channel?.name || threadChannel?.name || 'Gelöscht',
//     directUserName: directMessageName?.username || threadDirectUsername || 'Gelöscht', ////////////
//     nameOfTheRespondent: respondent?.username || 'Gelöscht',
//     idOfTheRespondentMessage: threadMessage?.userMessageId || 'Gelöscht',
//   };
// }