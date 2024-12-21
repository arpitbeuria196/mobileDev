import React, { useState, useEffect } from 'react';
import WorkoutCard from '../components/WorkoutCard';
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
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { trash, pencil, logOutOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';
import './Home.css';
import FoodCard from '../components/Food';

const Home: React.FC = () => {
  const history = useHistory();
  const [activity, setActivity] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const [minCalories, setMinCalories] = useState<number>(0);
  const [maxCalories, setMaxCalories] = useState<number>(100);
  const [foodCalories, setFoodCalories] = useState<number>(0);
  const [foodNutrition, setFoodNutrition] = useState<any>(null);
  const [foodImage, setFoodImage] = useState<any>(null);
  const [caloriesTaken, setCaloriesTaken] = useState<number>(0);

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

  const handleSaveWorkout = async () => {
    if (!activity || !duration) return;

    if (user) {
      const workoutData = {
        id: new Date().getTime().toString(),
        activity,
        duration: parseInt(duration),
        caloriesBurned: caloriesTaken,
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
        setMinCalories(0);
        setMaxCalories(100);
        setFoodCalories(0);
        setFoodImage('');
        setFoodNutrition(null);
        setCaloriesTaken(0);
        setEditIndex(null);
      } catch (error) {
        console.error('Error saving workout:', error);
      }
    }
  };

  const handleSearchFood = async () => {
    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/findByNutrients?minCalories=${minCalories}&maxCalories=${maxCalories}&number=10&apiKey=8edf976075e44736b9986ba74d428985`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const foodItems = data.map((item: any) => ({
          calories: item.calories,
          carbs: item.carbs,
          fat: item.fat,
          protein: item.protein,
          image: item.image,
        }));

        setFoodCalories(foodItems[0]?.calories || 0);
        setFoodNutrition(foodItems);
        setFoodImage(foodItems[0]?.image);
      } else {
        setFoodCalories(0);
        setFoodNutrition(null);
      }
    } catch (error) {
      console.error('Error fetching food data:', error);
    }
  };

  const caloriesManagement = (calories: number) => {
    setCaloriesTaken((prevCalories) => (prevCalories || 0) + calories);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      const userDocRef = doc(firestore, 'users', user?.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedWorkouts = userData?.workouts.filter((workout: any) => workout.id !== workoutId);

        if (updatedWorkouts) {
          await setDoc(userDocRef, { workouts: updatedWorkouts }, { merge: true });
        }
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const handleEditWorkout = (index: number) => {
    const workoutToEdit = workouts[index];
    setActivity(workoutToEdit.activity);
    setDuration(workoutToEdit.duration.toString());
    setEditIndex(index);
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
      <IonContent className="ion-padding home-container" fullscreen>
        <motion.div
          className="form-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Log Your Workout</h2>
          <IonItem className="input-item">
            <IonLabel position="floating">Activity</IonLabel>
            <IonInput
              value={activity}
              onIonChange={(e) => setActivity(e.detail.value!)}
              placeholder="e.g., Running"
            />
          </IonItem>

          <IonItem className="input-item">
            <IonLabel position="floating">Duration (minutes)</IonLabel>
            <IonInput
              value={duration}
              onIonChange={(e) => setDuration(e.detail.value!)}
              type="number"
              placeholder="e.g., 30"
            />
          </IonItem>

          <IonItem className="input-item">
            <IonLabel position="floating">Calories Burned</IonLabel>
            <IonInput value={caloriesTaken || 0} readonly />
          </IonItem>
        </motion.div>

        <motion.div
          className="food-search-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Search Food by Calories</h2>
          <IonItem className="input-item">
            <IonLabel position="floating">Min Calories</IonLabel>
            <IonInput
              value={minCalories}
              onIonChange={(e) => setMinCalories(Number(e.detail.value!))}
              type="number"
              placeholder="e.g., 100"
            />
          </IonItem>

          <IonItem className="input-item">
            <IonLabel position="floating">Max Calories</IonLabel>
            <IonInput
              value={maxCalories}
              onIonChange={(e) => setMaxCalories(Number(e.detail.value!))}
              type="number"
              placeholder="e.g., 500"
            />
          </IonItem>

          <IonButton expand="block" onClick={handleSearchFood}>
            Search Foods
          </IonButton>

          {foodNutrition && (
            <IonGrid>
              <IonRow>
                {foodNutrition.map((food: any, index: number) => (
                  <IonCol key={index} size="6">
                    <FoodCard
                      foodCalories={food.calories}
                      caloriesManagement={caloriesManagement}
                      foodNutrition={food}
                      foodImage={food.image}
                    />
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          )}
        </motion.div>

        <motion.div
          className="save-workout-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <IonButton expand="block" onClick={handleSaveWorkout}>
            {editIndex !== null ? 'Save Changes' : 'Save Workout'}
          </IonButton>
        </motion.div>

        <IonList className="workout-list">
        {workouts.map((workout, index) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            onDelete={() => handleDeleteWorkout(workout.id)}
            onEdit={() => handleEditWorkout(index)}
          />
        ))}
      </IonList>

      </IonContent>
    </IonPage>
  );
};

export default Home;
