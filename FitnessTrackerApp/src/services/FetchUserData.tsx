
import { firestore } from '../config/firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';

const fetchUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(firestore, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User Data:', userData);
      console.log('Goals:', userData?.goals);
      console.log('Workouts:', userData?.workouts);
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error fetching document:', error);
  }
};

fetchUserData("userId_123");
