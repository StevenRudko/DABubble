import { Injectable } from '@angular/core';
import {
  Auth,
  user,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  User,
  browserSessionPersistence,
  browserLocalPersistence,
} from '@angular/fire/auth';
import { setPersistence } from 'firebase/auth';
import { from, Observable } from 'rxjs';
import { PresenceService } from './presence.service';
import { Firestore, doc, setDoc, updateDoc } from '@angular/fire/firestore';

/**
 * The AuthService provides methods for user authentication and account management.
 * It handles registration, login, logout, password reset, and online status management.
 * Additionally, it saves user information to Firestore.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * Observable of the currently authenticated Firebase user.
   * Automatically updates when the authentication state changes.
   * @type {Observable<User | null>}
   */
  user$: Observable<User | null>;

  /**
   * Initializes the AuthService with necessary dependencies.
   * - Sets session storage persistence for Firebase authentication.
   * - Initializes the `user$` observable to monitor authentication state changes.
   * @param {Auth} firebaseAuth - The Firebase authentication instance used for authentication operations.
   * @param {Firestore} firestore - The Firestore instance used for storing and retrieving user data.
   * @param {PresenceService} presenceService - Service for managing the user's online/offline status.
   * @constructor
   */
  constructor(
    private firebaseAuth: Auth,
    private firestore: Firestore,
    private presenceService: PresenceService
  ) {
    this.setLocalStoragePersistence();
    this.user$ = user(this.firebaseAuth);
  }

  /**
   * Sets session storage persistence for Firebase authentication.
   * Ensures the authentication session is tied to the browser session.
   * @private
   * @returns {void}
   */
  private setLocalStoragePersistence(): void {
    setPersistence(this.firebaseAuth, browserLocalPersistence);
  }

  /**
   * Registers a new user and saves their information to Firestore.
   * - Updates the user's profile with a display name and photo URL.
   * @param {string} email - The email address of the new user.
   * @param {string} username - The display name of the new user.
   * @param {string} password - The password for the new user account.
   * @param {string} photoUrl - The profile photo URL for the new user.
   * @returns {Observable<void>} - Observable that completes when the user is successfully registered.
   */
  register(
    email: string,
    username: string,
    password: string,
    photoUrl: string
  ): Observable<void> {
    const promise = (async () => {
      const response = await createUserWithEmailAndPassword(
        this.firebaseAuth,
        email,
        password
      );
      await this.updateUserProfile(response.user, username, photoUrl);
      await this.saveUserInfoToFirestore(response.user);
    })();
    return from(promise);
  }

  /**
   * Logs in a user with email and password and sets their online status.
   * @param {string} email - The email address of the user.
   * @param {string} password - The user's password.
   * @returns {Observable<void>} - An observable that completes when the login is successful.
   */
  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    ).then(() => {
      this.presenceService.setOnlineStatus();
    });
    return from(promise);
  }

  /**
   * Logs in a user using Google Authentication and saves their information to Firestore.
   * @returns {Promise<void>} - Promise that resolves when the login and saving are successful.
   * @throws {Error} - Throws an error if the login or saving process fails.
   */
  async googleLogin(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.firebaseAuth, provider);
      const user = result.user;
      if (!user) {
        console.error(
          'Google-Login fehlgeschlagen: Kein Benutzerobjekt gefunden'
        );
        throw new Error('Google-Login fehlgeschlagen');
      }
      await this.saveUserInfoToFirestore(user);
      this.presenceService.setOnlineStatus();
    } catch (error) {
      console.error('Fehler beim Google-Login:', error);
      throw error;
    }
  }

  /**
   * Logs out the currently authenticated user.
   * - Signs the user out using Firebase Authentication.
   * - Clears the session storage to remove temporary data.
   * - Sets the user's offline status after a successful logout.
   * @returns {Observable<void>} - An observable that completes when the logout is successful.
   */
  logout(): Observable<void> {
    const promise = signOut(this.firebaseAuth).then(() => {
      sessionStorage.clear();
      this.presenceService.setOfflineStatus();
    });
    return from(promise);
  }

  /**
   * Sends a password reset email to the specified email address.
   * @param {string} email - The email address to send the password reset email to.
   * @returns {Promise<void>} - Promise that resolves when the email is sent successfully.
   */
  sendPasswordResetMail(email: string): Promise<void> {
    return sendPasswordResetEmail(this.firebaseAuth, email);
  }

  /**
   * Updates the Firebase user's profile with a display name and photo URL.
   * @private
   * @param {User} user - The Firebase user object.
   * @param {string} displayName - The display name to set for the user.
   * @param {string} photoUrl - The profile photo URL to set for the user.
   * @returns {Promise<void>} - Promise that resolves when the profile is successfully updated.
   */
  updateUserProfile(
    user: User,
    displayName: string,
    photoUrl: string
  ): Promise<void> {
    return updateProfile(user, {
      displayName,
      photoURL: photoUrl,
    });
  }

  /**
   * Saves user information (email, username, photoURL) to Firestore.
   * @private
   * @param {User} user - The Firebase user object.
   * @returns {Promise<void>} - Promise that resolves when the information is successfully saved.
   * @throws {Error} - Throws an error if the saving process fails.
   */
  async saveUserInfoToFirestore(user: User): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userRef, {
        email: user.email,
        username: user.displayName,
        photoURL: user.photoURL,
      });
      console.log('Benutzerinformationen erfolgreich in Firestore gespeichert');
    } catch (error) {
      console.error(
        'Fehler beim Speichern der Benutzerinformationen in Firestore:',
        error
      );
      throw error;
    }
  }

  /**
   * Updates the username of a user in Firestore.
   * - Fetches the user's document in the `users` collection using the provided user ID.
   * - Updates the `username` field with the new username.
   *
   * @param {string} userId - The unique identifier (UID) of the user whose username should be updated.
   * @param {string} newUsername - The new username to set for the user.
   * @returns {Promise<void>} - A promise that resolves when the username is successfully updated.
   * @throws {Error} - Throws an error if the update operation fails.
   */
  async updateUserNameInFirestore(
    userId: string,
    newUsername: string
  ): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${userId}`);
      await updateDoc(userRef, {
        username: newUsername,
      });

      console.log('Benutzername erfolgreich in Firestore aktualisiert');
    } catch (error) {
      console.error(
        'Fehler beim Aktualisieren des Benutzernamens in Firestore:',
        error
      );
      throw error;
    }
  }
}
