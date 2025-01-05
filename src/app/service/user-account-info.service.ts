import { Injectable } from '@angular/core';

/**
 * The UserAccountInfoService handles the display of user notifications
 * or status messages in the application. It provides methods to show
 * specific messages for a limited duration.
 */
@Injectable({
  providedIn: 'root',
})
export class UserAccountInfoService {
  /**
   * Array of predefined messages to be displayed to the user.
   * Examples:
   * - `messages[0]`: "Konto erfolgreich erstellt!" (Account successfully created).
   * - `messages[1]`: "E-Mail gesendet" (Email sent).
   * - `messages[2]`: "Anmelden" (Sign in).
   * @type {string[]}
   */
  messages: string[] = [
    'Konto erfolgreich erstellt!',
    'E-Mail gesendet',
    'Anmelden',
  ];

  /**
   * Flag to indicate whether a message is currently being displayed.
   * - `true`: Message is visible.
   * - `false`: No message is visible.
   * @type {boolean}
   */
  show: boolean = false;

  /**
   * The currently displayed message.
   * This is dynamically updated based on the index passed to `showMessage`.
   * @type {string}
   */
  currentMessage: string = '';

  /**
   * Displays a message to the user for a limited duration.
   * - The message is retrieved from the `messages` array based on the provided index.
   * - The `show` flag is set to `true` to make the message visible.
   * - After 2 seconds, the message is hidden by setting `show` to `false`.
   *
   * @param {number} i - The index of the message in the `messages` array to display.
   * @returns {void}
   */
  showMessage(i: number): void {
    this.currentMessage = this.messages[i];
    this.show = true;
    setTimeout(() => {
      this.show = false;
    }, 2000);
  }
}
