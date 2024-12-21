import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonList,
  IonText,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { auth, firestore } from '../config/firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  updateDoc,
  deleteField,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { trash, pencil, logOutOutline } from 'ionicons/icons';
import './Home.css';
import FoodCard from '../components/Food';  // Import the FoodCard component

const Home: React.FC = () => {
  const history = useHistory();
  const [activity, setActivity] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  
  const [minCalories, setMinCalories] = useState<number>(0);  // State for minimum calories
  const [maxCalories, setMaxCalories] = useState<number>(100);  // State for maximum calories
  const [foodCalories, setFoodCalories] = useState<number>(0);
  const [foodNutrition, setFoodNutrition] = useState<any>(null);
  const [foodImage, setFoodImage] = useState<any>(null);

  // Fetch workouts in real-time
  const fetchWorkouts = (userId: string) => {
    const userDocRef = doc(firestore, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        setWorkouts(userData?.workouts || []);
      } else {
        setWorkouts([]);
      }
    });
    return unsubscribe;
  };

  // Initialize user and set up workout listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const unsubscribeWorkouts = fetchWorkouts(currentUser.uid);
        return () => unsubscribeWorkouts();
      } else {
        history.push('/auth');
      }
    });
    return () => unsubscribe();
  }, [history]);

  // Save a workout to Firestore
  const handleSaveWorkout = async () => {
    if (!activity || !duration) return;

    if (user) {
      const workoutData = {
        activity,
        duration: parseInt(duration),
        caloriesBurned: foodCalories, // Store the calories burned from food
        date: Timestamp.fromDate(new Date()),
      };

      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        let updatedWorkouts = [...workouts];

        if (editIndex !== null) {
          updatedWorkouts[editIndex] = workoutData;
        } else {
          updatedWorkouts.push(workoutData);
        }

        await setDoc(userDocRef, { workouts: updatedWorkouts }, { merge: true });
        setActivity('');
        setDuration('');
        setMinCalories(0); // Reset calories values
        setMaxCalories(500); // Reset calories values
        setFoodCalories(0);
        setFoodImage('');
        setFoodNutrition(null);
        setEditIndex(null);
      } catch (error) {
        console.error('Error saving workout:', error);
      }
    }
  };

  // Handle food API search (getting nutrition and calories)
  const handleSearchFood = async () => {
    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/findByNutrients?minCalories=${minCalories}&maxCalories=${maxCalories}&number=10&apiKey=8edf976075e44736b9986ba74d428985`
      );
      const data = await response.json();
      console.log(data);

      if (data && data.length > 0) {
        // Set multiple food items as the query results
        const foodItems = data.map((item: any) => ({
          calories: item.calories,
          carbs: item.carbs,
          fat: item.fat,
          protein: item.protein,
          image: item.image,
        }));

        // Update state with the food items
        setFoodCalories(foodItems[0]?.calories || 0);
        setFoodNutrition(foodItems); // Store multiple nutrition results
        setFoodImage(foodItems[0]?.image); // Set the image of the first item
      } else {
        setFoodCalories(0); // If no results, set calories to 0
        setFoodNutrition(null); // Clear nutrition info
      }
    } catch (error) {
      console.error('Error fetching food data:', error);
    }
  };

  // Delete a workout from Firestore
  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      const userDocRef = doc(firestore, 'users', user?.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedWorkouts = userData?.workouts.filter((workout: any) => workout.id !== workoutId);
        await setDoc(userDocRef, { workouts: updatedWorkouts }, { merge: true });
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Welcome, {user?.displayName || 'User'}</IonTitle>
          <IonButton slot="end" onClick={() => signOut(auth)} fill="clear">
            <IonIcon icon={logOutOutline} slot="icon-only" />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" fullscreen>
        <div className="home-container">
          <IonItem>
            <IonLabel position="floating">Activity</IonLabel>
            <IonInput
              value={activity}
              onIonChange={(e) => setActivity(e.detail.value!)}
              placeholder="Enter your workout activity"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating">Duration (minutes)</IonLabel>
            <IonInput
              value={duration}
              onIonChange={(e) => setDuration(e.detail.value!)}
              type="number"
              placeholder="Enter workout duration"
            />
          </IonItem>

          <IonButton expand="block" onClick={handleSaveWorkout}>
            {editIndex !== null ? 'Update Workout' : 'Save Workout'}
          </IonButton>

          {/* Food Intake Section */}
          <IonItem>
            <IonLabel position="floating">Minimum Calories</IonLabel>
            <IonInput
              value={minCalories}
              onIonChange={(e) => setMinCalories(Number(e.detail.value!))}
              type="number"
              placeholder="Enter min calories"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating">Maximum Calories</IonLabel>
            <IonInput
              value={maxCalories}
              onIonChange={(e) => setMaxCalories(Number(e.detail.value!))}
              type="number"
              placeholder="Enter max calories"
            />
          </IonItem>

          <IonButton expand="block" onClick={handleSearchFood}>
            Get Nutrition & Calories
          </IonButton>

          {foodNutrition && (
            <IonGrid>
              <IonRow>
                {foodNutrition.map((food: any, index: number) => (
                  <IonCol key={index} size="6">
                    <FoodCard
                      foodCalories={food.calories}
                      foodNutrition={food}
                      foodImage={food.image}
                    />
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          )}

          <IonList>
            {workouts.length > 0 ? (
              workouts.map((workout: any, index: number) => (
                <IonItem key={index}>
                  <IonLabel>
                    {workout.activity} for {workout.duration} minutes, burned {workout.caloriesBurned} calories
                  </IonLabel>
                  <IonIcon icon={pencil} />
                  <IonIcon icon={trash} />
                </IonItem>
              ))
            ) : (
              <IonText>No workouts saved yet</IonText>
            )}
          </IonList>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
