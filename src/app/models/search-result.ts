export interface SearchResult {
  type: string;
  /** ID of the message author */
  authorId: string;
  username: string;
  photoURL: string;
  /** ID of the channel where the message was sent */
  channelId: string;
  directUserId: string;
  /** Content of the message */
  message: string;
  /** Timestamp of when the message was sent */
  time: number;
  /** Unique identifier for the user message */
  userMessageId: string;
  /**
   * The email address of the user.
   * - Must be a valid email format.
   * @type {string}
   */
  email: string;

  /**
   * The unique local identifier (ID) assigned to the user.
   * - Used to differentiate users within the system.
   * @type {string}
   */
  localID: string;

  channelName: string;

  channelDescription: string;

  channelMembers: any;

  directUserName: string;

  nameOfTheRespondent: string;

  idOfTheRespondentMessage: string;
}