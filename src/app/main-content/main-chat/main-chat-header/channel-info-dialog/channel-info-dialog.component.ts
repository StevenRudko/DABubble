import {
  Component,
  Inject,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialog,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ChatService } from '../../../../service/chat.service';
import { PresenceService } from '../../../../service/presence.service';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { firstValueFrom, Subscription } from 'rxjs';
import { ProfileOverviewComponent } from '../../../../shared/profile-overview/profile-overview.component';
import { AddPeopleComponent } from '../add-people/add-people.component';

/**
 * Interface for the data required by the channel dialog
 */
interface ChannelDialogData {
  channelId: string;
  name: string;
  description: string;
  userId: string;
  createdBy?: string;
}

/**
 * Interface for member data structure
 */
interface MemberData {
  uid: string;
  email: string;
  username: string;
  photoURL: string;
  online?: boolean;
}

@Component({
  selector: 'app-channel-info-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinner,
  ],
  templateUrl: './channel-info-dialog.component.html',
  styleUrls: ['./channel-info-dialog.component.scss'],
})
export class ChannelInfoDialogComponent
  implements AfterViewInit, OnInit, OnDestroy
{
  @ViewChildren('autosize') textareas!: QueryList<ElementRef>;

  isEditingName = false;
  isEditingDescription = false;
  channelName: string;
  channelDescription: string;
  createdBy: string = 'Wird geladen...';
  nameExists = false;

  members: MemberData[] = [];
  isLoadingMembers = true;
  memberCache = new Map<string, MemberData>();
  private presenceSubscription: Subscription | null = null;
  private onlineUsers: Set<string> = new Set();

  constructor(
    public dialogRef: MatDialogRef<ChannelInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChannelDialogData,
    private chatService: ChatService,
    private firestore: Firestore,
    private presenceService: PresenceService,
    private dialog: MatDialog,
    private auth: Auth
  ) {
    this.channelName = data.name;
    this.channelDescription = data.description || '';
  }

  /**
   * Initializes the component by loading creator info and members
   */
  async ngOnInit() {
    await this.loadCreatorInfo();
    await this.loadMembers(this.data.channelId);
    this.setupPresenceSubscription();
  }

  /**
   * Sets up textarea auto-resize after view initialization
   */
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.adjustAllTextareas();
      this.setupTextareaListeners();
    });
  }

  /**
   * Cleans up subscriptions on component destruction
   */
  ngOnDestroy(): void {
    if (this.presenceSubscription) {
      this.presenceSubscription.unsubscribe();
    }
  }

  /**
   * Sets up subscription to track online users
   */
  private setupPresenceSubscription(): void {
    this.presenceSubscription = this.presenceService
      .getOnlineUsers()
      .subscribe((onlineUserIds: string[]) => {
        this.onlineUsers = new Set(onlineUserIds);
        this.updateMembersOnlineStatus();
      });
  }

  /**
   * Updates online status for all members
   */
  private updateMembersOnlineStatus(): void {
    this.members = this.members.map((member) => ({
      ...member,
      online: this.isUserOnline(member.uid),
    }));
  }

  /**
   * Checks if a specific user is online
   * @param userId - The ID of the user to check
   * @returns Boolean indicating if user is online
   */
  private isUserOnline(userId: string): boolean {
    if (userId === this.auth.currentUser?.uid) {
      return true;
    }
    return this.onlineUsers.has(userId);
  }

  /**
   * Loads all members of a channel
   * @param channelId - The ID of the channel
   */
  async loadMembers(channelId: string): Promise<void> {
    try {
      const memberIds = await this.getMemberIds(channelId);
      const memberPromises = memberIds.map((id) => this.loadMemberData(id));

      const members = (await Promise.all(memberPromises)).filter(
        (member): member is MemberData => member !== null
      );

      this.members = members;
      this.updateMembersOnlineStatus();
      this.isLoadingMembers = false;
    } catch (error) {
      console.error('Error loading members:', error);
      this.isLoadingMembers = false;
    }
  }

  /**
   * Retrieves all member IDs for a channel
   * @param channelId - The ID of the channel
   * @returns Array of member IDs
   */
  private async getMemberIds(channelId: string): Promise<string[]> {
    const channelDoc = await getDoc(doc(this.firestore, 'channels', channelId));
    if (!channelDoc.exists()) return [];

    const channelData = channelDoc.data() as any;
    return Object.entries(channelData.members || {})
      .filter(([_, value]) => value === true)
      .map(([key]) => key);
  }

  /**
   * Loads member data for a specific user
   * @param memberId - The ID of the member
   * @returns Member data or null if not found
   */
  private async loadMemberData(memberId: string): Promise<MemberData | null> {
    const cachedMember = this.memberCache.get(memberId);
    if (cachedMember) return cachedMember;

    const userDoc = await getDoc(doc(this.firestore, 'users', memberId));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data();
    const memberData: MemberData = {
      uid: memberId,
      email: userData['email'] || '',
      username: userData['username'] || '',
      photoURL: userData['photoURL'] || 'assets/img/default-avatar.svg',
      online: this.isUserOnline(memberId),
    };

    this.memberCache.set(memberId, memberData);
    return memberData;
  }

  /**
   * Opens the profile dialog for a member
   * @param member - The member whose profile to show
   */
  openProfileDialog(member: MemberData): void {
    const userData = {
      username: member.username,
      email: member.email,
      photoURL: member.photoURL,
      status: this.isUserOnline(member.uid) ? 'active' : 'offline',
      uid: member.uid,
    };

    this.dialog.open(ProfileOverviewComponent, {
      data: userData,
      panelClass: 'profile-dialog-container',
    });
  }

  /**
   * Opens the dialog to add new members
   */
  openAddPeopleDialog(): void {
    const dialogRef = this.dialog.open(AddPeopleComponent, {
      position: { top: '160px' },
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      panelClass: 'member-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.updated) {
        this.loadMembers(this.data.channelId);
      }
    });
  }

  /**
   * Checks if a channel name already exists
   * @param name - The name to check
   * @returns Boolean indicating if name exists
   */
  private async checkChannelNameExists(name: string): Promise<boolean> {
    if (name.trim() === this.data.name) return false;

    const channelsRef = collection(this.firestore, 'channels');
    const q = query(channelsRef, where('name', '==', name.trim()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  /**
   * Validates a new channel name
   * @param name - The name to validate
   */
  async validateChannelName(name: string): Promise<void> {
    if (name.trim().length >= 3) {
      this.nameExists = await this.checkChannelNameExists(name);
    }
  }

  /**
   * Gets the channel document from Firestore
   * @returns The channel document
   */
  private async getChannelDoc() {
    return await getDoc(doc(this.firestore, 'channels', this.data.channelId));
  }

  /**
   * Gets the user document of the channel creator
   * @param channelData - The channel data containing creator info
   * @returns The creator's user document
   */
  private async getCreatorUser(channelData: any) {
    if (!channelData || !channelData['createdBy']) {
      return null;
    }
    return await getDoc(doc(this.firestore, 'users', channelData['createdBy']));
  }

  /**
   * Gets the display name from user data
   * @param userData - The user data
   * @returns The display name
   */
  private getUserDisplayName(userData: any): string {
    if (!userData) return 'Unbekannter Benutzer';
    return (
      userData['username'] ||
      userData['displayName'] ||
      userData['email'] ||
      'Unbekannter Benutzer'
    );
  }

  /**
   * Loads and sets the channel creator information
   */
  private async loadCreatorInfo(): Promise<void> {
    try {
      const channelDoc = await this.getChannelDoc();
      if (!channelDoc.exists()) return;

      const userDoc = await this.getCreatorUser(channelDoc.data());
      if (!userDoc?.exists()) return;

      this.createdBy = this.getUserDisplayName(userDoc.data());
    } catch (error) {
      console.error('Error:', error);
      this.createdBy = 'Nicht verfügbar';
    }
  }

  /**
   * Adjusts the height of all textareas
   */
  private adjustAllTextareas(): void {
    this.textareas.forEach((textarea) =>
      this.adjustTextareaHeight(textarea.nativeElement)
    );
  }

  /**
   * Sets up input event listeners for textareas
   */
  private setupTextareaListeners(): void {
    this.textareas.forEach((textarea) => {
      textarea.nativeElement.addEventListener('input', () =>
        this.adjustTextareaHeight(textarea.nativeElement)
      );
    });
  }

  /**
   * Adjusts the height of a textarea element
   * @param element - The textarea element to adjust
   */
  private adjustTextareaHeight(element: HTMLTextAreaElement): void {
    element.style.height = 'auto';
    element.style.height = `${Math.max(60, element.scrollHeight)}px`;
  }

  /**
   * Toggles the channel name editing mode
   */
  toggleEditName(): void {
    this.isEditingName = !this.isEditingName;
    if (!this.isEditingName) {
      this.channelName = this.data.name;
      this.nameExists = false;
    }
  }

  /**
   * Toggles the channel description editing mode
   */
  toggleEditDescription(): void {
    this.isEditingDescription = !this.isEditingDescription;
    if (!this.isEditingDescription) {
      this.channelDescription = this.data.description || '';
    }
    if (this.isEditingDescription) {
      setTimeout(() => this.adjustAllTextareas());
    }
  }

  /**
   * Checks if changes can be saved
   */
  get canSave(): boolean {
    if (this.isEditingName) {
      return this.channelName.trim().length >= 3 && !this.nameExists;
    }
    return true;
  }

  /**
   * Saves changes to the channel
   */
  async saveChanges(): Promise<void> {
    if (!this.canSave) return;

    try {
      const updates = this.getUpdates();
      await this.chatService.updateChannel(this.data.channelId, updates);
      this.applyUpdates();
    } catch (error) {
      console.error('Error updating channel:', error);
    }
  }

  /**
   * Gets the updates object for channel changes
   * @returns The updates object
   */
  private getUpdates(): Partial<ChannelDialogData> {
    const updates: Partial<ChannelDialogData> = {};
    if (this.isEditingName) updates.name = this.channelName.trim();
    if (this.isEditingDescription) {
      updates.description = this.channelDescription.trim();
    }
    return updates;
  }

  private applyUpdates(): void {
    if (this.isEditingName) {
      this.data.name = this.channelName;
      this.isEditingName = false;
    }
    if (this.isEditingDescription) {
      this.data.description = this.channelDescription;
      this.isEditingDescription = false;
    }
  }

  async leaveChannel(): Promise<void> {
    try {
      await this.chatService.removeUserFromChannel(
        this.data.channelId,
        this.data.userId
      );

      await this.chatService.openSelfChat();

      this.dialogRef.close('channelLeft');
    } catch (error) {
      console.error('Error leaving channel:', error);
    }
  }
}
