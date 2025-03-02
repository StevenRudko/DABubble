/**
 * Represents the navigation state of the application UI
 * Controls which views are currently visible to the user
 */
export interface NavigationState {
  /** Flag indicating if the chat view is visible */
  showChat: boolean;

  /** Flag indicating if the thread view is visible */
  showThread: boolean;
}
