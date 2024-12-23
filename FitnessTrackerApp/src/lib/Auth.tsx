import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { auth, googleProvider, firestore } from '../config/firebaseConfig';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './Auth.css';

/** 1) Import React Toastify */
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Auth: React.FC = () => {
  const history = useHistory();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSignedInForm, setIsSignedInForm] = useState(true);

  // Initialize Firestore document for the user
  const initializeUserDocument = async (userId: string) => {
    try {
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, { workouts: [] });
        console.log('User document initialized.');
      }
    } catch (err) {
      console.error('Error initializing user document:', err);
      /** 2) Use toast error for the catch block */
      toast.error('Error initializing user document: ' + (err as Error).message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log('Google Sign-In Successful:', user);

      // Initialize Firestore document for the user
      await initializeUserDocument(user.uid);

      history.push('/home');
    } catch (err: any) {
      setError('Google Sign-In failed. Please try again or sign up manually.');
      toast.error('Google Sign-In failed: ' + err.message);

      // Switch to signup form after 5s if needed
      setTimeout(() => {
        setError(null);
        setIsSignedInForm(false);
      }, 5000);
    }
  };

  const handleSignUp = async () => {
    try {
      if (!isSignedInForm) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: userName });
        await initializeUserDocument(user.uid);
        history.push('/home');
      } else {
        // Sign in
        await signInWithEmailAndPassword(auth, email, password);
        history.push('/home');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error('Authentication error: ' + err.message);
    }
  };

  const toggleSignedInForm = () => {
    setIsSignedInForm(!isSignedInForm);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSignUp();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{isSignedInForm ? 'Welcome back' : 'Create Account'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" fullscreen>
        {/** 3) Place ToastContainer anywhere (usually top-level) */}
        <ToastContainer position="top-center" autoClose={2500} />

        <div className="auth-container">
          <form onSubmit={handleSubmit} className="form">
            {!isSignedInForm && (
              <input
                type="text"
                className="input"
                placeholder="Full Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            )}
            <input
              type="email"
              className="input"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Inline error (optional) */}
            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="form-btn">
              {isSignedInForm ? 'Sign In' : 'Sign Up'}
            </button>

            <p className="sign-up-label">
              {isSignedInForm ? "Don't have an account?" : 'Already registered?'}{' '}
              <span className="sign-up-link" onClick={toggleSignedInForm}>
                {isSignedInForm ? 'Sign Up' : 'Sign In'}
              </span>
            </p>
          </form>

          {/* Optional: Add a separate Google Sign-In button */}
          <button type="button" onClick={handleGoogleSignIn} className="google-btn">
            Sign in with Google
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Auth;
