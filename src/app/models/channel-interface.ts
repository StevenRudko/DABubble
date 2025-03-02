import { DocumentData } from '@angular/fire/firestore';

/**
 * Interface for channel data structure
 */
export interface ChannelInterface extends DocumentData {
  /** Channel creation timestamp */
  createdAt: string;

  /** User ID of channel creator */
  createdBy: string;

  /** Channel description text */
  description: string;

  /** Map of member IDs to boolean membership status */
  members: { [key: string]: boolean };

  /** Channel display name */
  name: string;

  /** Channel type identifier */
  type: string;

  /**
   * Last update timestamp
   * Can be either a number or a string depending on the context
   */
  updatedAt: number | string;

  /**
   * Unique channel identifier
   */
  channelId: string;

  /**
   * Alias for channelId - für Kompatibilität mit bestehendem Code
   */
  id: string;
}
