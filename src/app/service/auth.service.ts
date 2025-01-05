import { inject, Injectable, Signal, signal } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, User } from 'firebase/auth';
import { from, Observable } from 'rxjs';
import { UserInterface } from '../models/user-interface';

/**
 * The AuthService provides methods for user authentication and account management.
 * It uses Firebase Authentication to handle user registration, login, logout, 
 * password resets, and profile updates.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * Firebase Auth instance injected for authentication operations.
   * @type {Auth}
   */
  firebaseAuth: Auth = inject(Auth)

  /**
   * Observable of the currently authenticated Firebase user.
   * Automatically updates when the authentication state changes.
   * @type {Observable<User | null>}
   */
  user$: Observable<User | null> = user(this.firebaseAuth)

  /**
   * Signal to store and manage the current application user.
   * This can include additional user data beyond what Firebase provides.
   * @type {signal<UserInterface | null | undefined>}
   */
  currentUserSig = signal<UserInterface | null | undefined>(undefined);

   /**
   * Registers a new user with email, password, and additional profile information.
   * - Updates the user's profile with a display name and photo URL.
   * 
   * @param {string} email - The email address of the new user.
   * @param {string} username - The display name of the new user.
   * @param {string} password - The password for the new user account.
   * @param {string} photoUrl - The profile photo URL for the new user.
   * @returns {Observable<void>} - Observable that completes when the user is successfully registered.
   */
  register(email: string, username: string, password: string, photoUrl: string): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    ).then(response => this.updateUserProfile(response.user, username, photoUrl));

    return from(promise);
  }

  /**
   * Logs in a user with an email and password.
   * 
   * @param {string} email - The email address of the user.
   * @param {string} password - The user's password.
   * @returns {Observable<void>} - Observable that completes when the login is successful.
   */
  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password,
    ).then(() => { });
    return from(promise);
  }

  /**
   * Logs in a user using Google Authentication.
   * 
   * @returns {Observable<UserCredential>} - Observable that completes when the login is successful.
   */
  googleLogin() {
    const provider = new GoogleAuthProvider();
    const promise = signInWithPopup(this.firebaseAuth, provider);
    return from(promise);
  }

  /**
   * Logs out the currently authenticated user.
   * 
   * @returns {Observable<void>} - Observable that completes when the logout is successful.
   */
  logout(): Observable<void> {
    const promise = signOut(this.firebaseAuth);
    return from(promise);
  }

  /**
   * Sends a password reset email to the specified email address.
   * 
   * @param {string} email - The email address to send the password reset email to.
   * @returns {Promise<void>} - Promise that resolves when the email is sent successfully.
   */
  sendPasswordResetMail(email: string): Promise<void> {
    return sendPasswordResetEmail(this.firebaseAuth, email);
  }

  /**
   * Updates the Firebase user's profile with a display name and photo URL.
   * 
   * @private
   * @param {User} user - The Firebase user object.
   * @param {string} displayName - The display name to set for the user.
   * @param {string} photoUrl - The profile photo URL to set for the user.
   * @returns {Promise<void>} - Promise that resolves when the profile is successfully updated.
   */
  private updateUserProfile(user: User, displayName: string, photoUrl: string): Promise<void> {
    return updateProfile(user, {
      displayName,
      photoURL: photoUrl
    });
  }
}