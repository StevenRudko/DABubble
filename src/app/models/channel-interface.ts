/**
 * Interface for channel data structure
 */
export interface ChannelInterface {
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
  /** Last update timestamp */
  updatedAt: number;
  /** Unique channel identifier */
  channelId: string;
}
