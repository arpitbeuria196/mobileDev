import { firestore } from '../config/firebaseConfig'; 
import { collection, doc, setDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';  

// Types for user data and workouts
interface Workout {
  date: Timestamp;
  activity: string;
  duration: number;
}

interface Goals {
  muscleGain: boolean;
  weightLoss: boolean;
}

interface UserData {
  name: string;
  age: number;
  height: number;
  weight: number;
  goals: Goals;
  workouts: Workout[];
}

// Save user data function
const saveUserData = async (userId: string, userData: UserData) => {
  try {
    await setDoc(doc(firestore, "users", userId), userData);
    console.log('User data saved successfully');
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// Example usage: Create a user data object
const userId = "userId_123";  // Example dynamic user ID
const userData: UserData = {
  name: "Arpit Beuria",
  age: 24,
  height: 5.9,
  weight: 84,
  goals: {
    muscleGain: true,
    weightLoss: true
  },
  workouts: [
    {
      date: Timestamp.fromDate(new Date("2024-12-20T22:56:15Z")),  // Firestore Timestamp
      activity: "Squat",
      duration: 20
    }
  ]
};

// Save the user data to Firestore
saveUserData(userId, userData);
