/**
 * Represents a user in the application.
 * This interface defines the structure of user data 
 * stored or retrieved from the application or backend.
 */
export interface UserInterface {
    /**
     * The email address of the user.
     * - Must be a valid email format.
     * @type {string}
     */
    email: string;
  
    /**
     * The username of the user.
     * - Typically a unique identifier chosen by the user.
     * @type {string}
     */
    username: string;
  
    /**
     * The unique local identifier (ID) assigned to the user.
     * - Used to differentiate users within the system.
     * @type {string}
     */
    localID: string;
  
    /**
     * The URL of the user's profile photo.
     * - Can be `null` if the user has not set a profile photo.
     * @type {string | null}
     */
    photoUrl: string | null;
  }
  