import { Injectable, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  User,
  setPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { from, Observable } from 'rxjs';
import { PresenceService } from './presence.service';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

// keep for new featuress
// import { UserInterface } from '../models/user-interface';

/**
 * The AuthService provides methods for user authentication and account management.
 * It uses Firebase Authentication to handle user registration, login, logout,
 * password resets, and profile updates.
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
  user$: Observable<User | null>; // = user(this.firebaseAuth)

  // keep for new featuress
  // /**
  //  * Signal to store and manage the current application user.
  //  * This can include additional user data beyond what Firebase provides.
  //  * @type {signal<UserInterface | null | undefined>}
  //  */
  // currentUserSig = signal<UserInterface | null | undefined>(undefined);

  constructor(
    private firebaseAuth: Auth,
    private firestore: Firestore,
    private presenceService: PresenceService
  ) {
    this.setSessionStoragePersistence();
    this.user$ = user(this.firebaseAuth);
  }

  // Setzt die Persistenz auf Session Storage
  private setSessionStoragePersistence(): void {
    setPersistence(this.firebaseAuth, browserSessionPersistence);
  }

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
  register(
    email: string,
    username: string,
    password: string,
    photoUrl: string
  ): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    ).then((response) => {
      this.updateUserProfile(response.user, username, photoUrl);
      this.saveUserInfoToFirestore(response.user);
    });

    return from(promise);
  }

  /**
   * Logs in a user using email and password authentication.
   * - Authenticates the user with Firebase.
   * - Sets the user's online status after a successful login.
   *
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


  async googleLogin(): Promise<void> {
    const provider = new GoogleAuthProvider();
  
    try {
      const result = await signInWithPopup(this.firebaseAuth, provider);
      const user = result.user;
  
      if (!user) {
        console.error('Google-Login fehlgeschlagen: Kein Benutzerobjekt gefunden');
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
   *
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
  private updateUserProfile(
    user: User,
    displayName: string,
    photoUrl: string
  ): Promise<void> {
    return updateProfile(user, {
      displayName,
      photoURL: photoUrl,
    });
  }

  private async saveUserInfoToFirestore(user: User): Promise<void> {
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
}
