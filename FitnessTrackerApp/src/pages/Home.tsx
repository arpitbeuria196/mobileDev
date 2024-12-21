import React, { useState, useEffect } from 'react';
import WorkoutCard from '../components/WorkoutCard';
import { Geolocation } from '@ionic-native/geolocation';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { File } from '@ionic-native/file';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';



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
  IonImg,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { auth, firestore } from '../config/firebaseConfig';
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { logOutOutline } from 'ionicons/icons';
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

  const [minCalories, setMinCalories] = useState<number>();
  const [maxCalories, setMaxCalories] = useState<number>();
  const [foodCalories, setFoodCalories] = useState<number>();
  const [foodNutrition, setFoodNutrition] = useState<any>(null);
  const [foodImage, setFoodImage] = useState<any>(null);
  const [caloriesTaken, setCaloriesTaken] = useState<number>();
  const [caloriesBurnt, setCaloriesBurnt] = useState<number>(); // Default to 5 calories
  const [calorieMessage, setCalorieMessage] = useState<string>('');
  const [calorieDifference, setCalorieDifference] = useState<number>(); // To store calorie difference
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [image,setImage] = useState<any>("");
  const [location, setLocation] = useState<{ lat: number, lng: number }>({
    lat: 53.349805,  
    lng: -6.26031,  
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
const [fetchedImage, setFetchedImage] = useState<string | null>(null); 

  useEffect(() => {
    getCurrentLocation();
  }, []);

  //Take Photo

  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri, 
        source: CameraSource.Camera, 
        quality: 90,
      });
  
      // Get the image URI
      const imageUrl = photo.webPath; 
      setUploadedImage(imageUrl); 
  
    } catch (error) {
      console.error("Error taking photo:", error);
    }
  };

  


  
  //File Upload
  const handleFileUpload = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
  
    reader.onload = async () => {
      const base64String = reader.result as string;
  
      try {
        setUploadedImage(base64String); 
  
        await Filesystem.writeFile({
          path: `workout_images/${file.name}`,
          data: base64String.split(',')[1],
          directory: Directory.Data,
        });
      } catch (error) {
        console.error('Error saving file:', error);
      }
    };
  
    reader.readAsDataURL(file);
  };
  
  
  
  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Error getting location:", error);
          // You can log the entire error object to see its properties
          alert(`Error getting location: ${JSON.stringify(error)}`);
          
          // Default location as fallback
          setLocation({ lat: 53.349805, lng: -6.26031 }); 
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };
  
  

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
    if (!activity || !duration) {
      alert('Activity and duration are required!');
      return;
    }    

    const caloriesBurned = handleCalorieCalculation(activity, parseInt(duration));

    if (user) {
      const workoutData = {
        id: new Date().getTime().toString(),
        activity,
        duration: parseInt(duration),
        caloriesTaken: caloriesTaken || 0,
        caloriesBurnt:caloriesBurnt || 0,
        image: uploadedImage, 
        date: Timestamp.fromDate(new Date()),
      };

      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        console.log(userDocRef)

        let updatedWorkouts = [...workouts];

        if (editIndex !== null) {
          updatedWorkouts[editIndex] = workoutData;
        } else {
          updatedWorkouts.push(workoutData);
        }

        await setDoc(userDocRef, { workouts: updatedWorkouts }, { merge: true });
        setActivity('');
        setDuration('');
        setCaloriesTaken(0);
        setCaloriesBurnt(3.2); 
        setFoodCalories(0);
        setFoodImage('');
        setUploadedImage('')
        setFoodNutrition(null);
        setEditIndex(null);
        updateCalorieMessage(caloriesBurned); 
      } catch (error) {
        console.error('Error saving workout:', error);
      }
    }
  };

  const handleSearchFood = async () => {
    setHasSearched(true);
    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/findByNutrients?minCalories=${minCalories}&maxCalories=${maxCalories}&number=10&apiKey=8edf976075e44736b9986ba74d428985`
      );
      const data = await response.json();

      console.log(data);

      if (data && data.length > 0) {
        const foodItems = data.map((item: any) => ({
          calories: item.calories,
          carbs: item.carbs,
          fat: item.fat,
          protein: item.protein,
          title:item.title,
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

  const handleCalorieCalculation = (activity: string, duration: number) => {
    const metValues: { [key: string]: number } = {
      running: 9.8,
      walking: 3.8,
      cycling: 8,
      swimming: 7,
      yoga: 2.5,
      weightlifting: 3,
    };

    const met = metValues[activity.toLowerCase()] || 0;
    const caloriesBurned = Math.round(met * (user?.weight || 70) * (duration / 60)); // Round to nearest whole number
    setCaloriesBurnt(caloriesBurned);
    return caloriesBurned;

  };

  const updateCalorieMessage = (caloriesBurned: number) => {
    const calorieDiff = caloriesTaken - caloriesBurned;
    setCalorieDifference(calorieDiff);

    if (calorieDiff < 0) {
      setCalorieMessage('Keep up the good work! You are burning more than you are eating!');
    } else {
      setCalorieMessage('You need to work out more to burn those calories!');
    }
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

  const calorieStatusStyle = calorieDifference < 0 ? { color: 'green' } : { color: 'red' };

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
              onIonChange={(e) => {
                setActivity(e.detail.value!);
                handleCalorieCalculation(e.detail.value!, parseInt(duration)); // Update calories as you type
              }}
              placeholder="e.g., Running"
            />
          </IonItem>

          <IonItem className="input-item">
            <IonLabel position="floating">Duration (minutes)</IonLabel>
            <IonInput
              value={duration}
              onIonChange={(e) => {
                setDuration(e.detail.value!);
                handleCalorieCalculation(activity, parseInt(e.detail.value!)); // Update calories when duration is changed
              }}
              type="number"
              placeholder="e.g., 30"
            />
          </IonItem>
          <IonButton onClick={takePhoto}>
          Take a Photo
        </IonButton>

        {uploadedImage && (
          <IonImg src={uploadedImage} alt="Uploaded Image" />
        )}

          <IonItem>
            <IonLabel>Upload Workout Image</IonLabel>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setUploadedImage(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              style={{ padding: '8px' }}
            />
          </IonItem>
        </motion.div>

        <motion.div
          className="food-search-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Auutomatic Calories Management</h2>
          <IonItem className="input-item">
  <IonLabel position="floating">Calories Gained by Food</IonLabel>
  <IonInput
    value={caloriesTaken || 0}
    readonly
    className="custom-placeholder"  
  />
</IonItem>

<IonItem className="input-item">
  <IonLabel position="floating">Calories Burned by Exercise</IonLabel>
  <IonInput
    placeholder="Default 3.2"
    value={caloriesBurnt || 0} 
    readonly
    className="custom-placeholder" 
  />
</IonItem>

<h2> Calorie Difference</h2>
<IonItem className="input-item">
  <IonLabel position="floating">Calories Gained - Burned</IonLabel>
  <IonInput
    value={caloriesTaken !== undefined && caloriesBurnt !== undefined ? Math.round(caloriesTaken - caloriesBurnt) : 0}
    readonly
    style={{
      color: caloriesTaken !== undefined && caloriesBurnt !== undefined ? (caloriesTaken - caloriesBurnt > 0 ? 'green' : 'red') : 'black',
    }}
  />
</IonItem>




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
          <h2>Add Food Results to Find Calories Gained by Food</h2>

          <IonButton expand="block" onClick={handleSearchFood}>
            Search Foods
          </IonButton>

          {!hasSearched && (
          <IonText color="medium">
            <p>No Search till yet</p>
          </IonText>
        )}

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

        <h3 style={calorieStatusStyle}>{calorieMessage}</h3>

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
