import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { auth, googleProvider, firestore } from '../config/firebaseConfig';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './Auth.css';

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
      setError(err.message);
    }
  };

  const handleSignUp = async () => {
    try {
      if (!isSignedInForm) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: userName });
        history.push('/home');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        history.push('/home');
      }
    } catch (err: any) {
      setError(err.message);
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
            {error && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
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
          <div className="buttons-container">
            <div className="google-login-button" onClick={handleGoogleSignIn}>
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                version="1.1"
                x="0px"
                y="0px"
                className="google-icon"
                viewBox="0 0 48 48"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#FFC107"
                  d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                ></path>
                <path
                  fill="#FF3D00"
                  d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                ></path>
                <path
                  fill="#4CAF50"
                  d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                ></path>
                <path
                  fill="#1976D2"
                  d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                ></path>
              </svg>
              <span>Sign in with Google</span>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Auth;
