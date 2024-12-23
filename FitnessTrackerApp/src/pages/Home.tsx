import React, { useState, useRef, useEffect } from 'react';
import WorkoutCard from '../components/WorkoutCard';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonCol,
  IonRow,
  IonText,
  IonItem,
  IonImg,
  IonLabel,
  IonButton,
  IonIcon
} from '@ionic/react';
import { cameraOutline, folderOutline, closeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { auth, firestore } from '../config/firebaseConfig';
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { logOutOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';
import FoodCard from '../components/Food';

import './Home.css';

const Home: React.FC = () => {
  const [activity, setActivity] = useState('');
  const [duration, setDuration] = useState('');
  const history = useHistory();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const [minCalories, setMinCalories] = useState<number>();
  const [maxCalories, setMaxCalories] = useState<number>();
  const [foodCalories, setFoodCalories] = useState<number>();
  const [foodNutrition, setFoodNutrition] = useState<any>(null);
  const [foodImage, setFoodImage] = useState<any>(null);
  const [caloriesTaken, setCaloriesTaken] = useState<number>();
  const [caloriesBurnt, setCaloriesBurnt] = useState<number>();
  const [calorieMessage, setCalorieMessage] = useState<string>('');
  const [calorieDifference, setCalorieDifference] = useState<number>();
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [image, setImage] = useState<any>('');
  const [location, setLocation] = useState<{ lat: number; lng: number }>({
    lat: 53.349805,
    lng: -6.26031,
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fetchedImage, setFetchedImage] = useState<string | null>(null);

  // Reference to the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Take photo from camera
  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
      });
      const imageUrl = photo.webPath;
      setUploadedImage(imageUrl);
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  // File Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
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

  // Trigger file input by clicking the hidden <input>
  const openFilePicker = () => {
    fileInputRef.current?.click();
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
        caloriesBurnt: caloriesBurnt || 0,
        image: uploadedImage,
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
        setCaloriesTaken(0);
        setCaloriesBurnt(3.2);
        setFoodCalories(0);
        setFoodImage('');
        setUploadedImage('');
        setFoodNutrition(null);
        setEditIndex(null);
        updateCalorieMessage(caloriesBurned);
      } catch (error) {
        console.error('Error saving workout:', error);
      }
    }
  };

  // handle Search Food
  const handleSearchFood = async () => {
    setHasSearched(true);
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
          title: item.title,
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

  //remove Images
  const removeImage = async () => {
    setUploadedImage(null);
  };

  // Calories Management
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
    const caloriesBurned = Math.round(met * (user?.weight || 70) * (duration / 60));
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
        const updatedWorkouts = userData?.workouts.filter(
          (workout: any) => workout.id !== workoutId
        );

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

  const calorieStatusStyle =
    calorieDifference < 0 ? { color: '#388E3C' } : { color: '#D32F2F' };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Welcome, {user?.displayName || 'User'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonCard className="workout-card">
          <IonCardHeader>
            <IonCardTitle className="ion-card-title">Log a Workout</IonCardTitle>
          </IonCardHeader>

          <IonCardContent>
            {/* Activity input */}
            <IonItem className="input-item">
              <div className="label-wrapper">
                <IonLabel position="stacked" className="ion-label-styled">
                  Activity
                </IonLabel>
              </div>

              <input
                className="input"
                type="text"
                placeholder="e.g. Running..."
                value={activity}
                onChange={(e) => {
                  setActivity(e.target.value);
                  handleCalorieCalculation(e.target.value, parseInt(duration));
                }}
              />
            </IonItem>

            {/* Duration input (with step=1 for up/down arrows) */}
            <IonItem className="input-item">
              <div className="label-wrapper">
                <IonLabel position="stacked" className="ion-label-styled">
                  Duration (Minutes)
                </IonLabel>
              </div>

              <input
                className="input"
                type="number"
                step="1"
                placeholder="e.g. 30"
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  handleCalorieCalculation(activity, parseInt(e.target.value));
                }}
              />
            </IonItem>

            {/* Camera button */}
            <IonButton
              color="primary"
              onClick={takePhoto}
              className="action-button small-button"
            >
              <IonIcon slot="start" icon={cameraOutline} />
              Photo
            </IonButton>

            {/* File Manager button & hidden input */}
            <IonButton
              color="secondary"
              onClick={openFilePicker}
              className="action-button small-button"
            >
              <IonIcon slot="start" icon={folderOutline} />
              File
            </IonButton>
            {/* Hidden <input> for file selection */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            {/* Display the image, plus a Remove button if we have an image */}
            {uploadedImage && (
              <div style={{ marginTop: '16px' }}>
                <IonImg src={uploadedImage} alt="Uploaded" />

                <IonButton
                  color="danger"
                  fill="outline"
                  style={{ marginTop: '8px' }}
                  onClick={removeImage}
                >
                  <IonIcon slot="start" icon={closeOutline} />
                  Remove Image
                </IonButton>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Calories Calculation Card */}
        <IonCard className="workout-card">
          <IonCardHeader>
            <IonCardTitle className="ion-card-title">Auto Calories Calculation</IonCardTitle>
          </IonCardHeader>

          <IonCardContent>
            {/* Calories Gained */}
            <IonItem className="input-item">
              <div className="label-wrapper">
                <IonLabel position="stacked" className="ion-label-styled">
                  Calories Gained
                </IonLabel>
              </div>

              <input
                className="input"
                type="text"
                placeholder="Based on Food selection"
                readOnly
                value={caloriesTaken || ''}
              />
            </IonItem>

            {/* Calories Burnt */}
            <IonItem className="input-item">
              <div className="label-wrapper">
                <IonLabel position="stacked" className="ion-label-styled">
                  Calories Burnt
                </IonLabel>
              </div>

              <input
                className="input"
                type="text"
                placeholder="Based on Exercise"
                readOnly
                value={caloriesBurnt || ''}
              />
            </IonItem>
            {/* Calorie Difference */}
            <IonItem className="input-item">
              <div className="label-wrapper">
                <IonLabel position="stacked" className="ion-label-styled">
                  Calories Difference
                </IonLabel>
              </div>

              <input
                className="input"
                type="text"
                placeholder="Based on Exercise"
                readOnly
                value={
                  caloriesTaken !== undefined && caloriesBurnt !== undefined
                    ? Math.round(caloriesTaken - caloriesBurnt)
                    : ''
                }
                style={{
                  color:
                    caloriesTaken !== undefined && caloriesBurnt !== undefined
                      ? caloriesTaken - caloriesBurnt > 0
                        ? '#388E3C'
                        : '#D32F2F'
                      : '#000',
                }}
              />
            </IonItem>
          </IonCardContent>
        </IonCard>
        <IonCard>
  <IonCardHeader>
    <IonCardTitle className="ion-card-title">Search by Calories</IonCardTitle>
  </IonCardHeader>

  <IonCardContent>
    {/* New form with 2 labels and 2 inputs in one line */}
    <IonItem className="input-item">
              <div className="label-wrapper">
    <IonLabel position="stacked" className="ion-label-styled">
    Min Calories
    </IonLabel>
              </div>
              <input
          className="small-input"
          type="number"
          placeholder="Cal"
          value={minCalories}
          onChange={(e) => setMinCalories(Number(e.target.value))}
        />
    </IonItem>

    <IonItem className="input-item">
              <div className="label-wrapper">
    <IonLabel position="stacked" className="ion-label-styled">
    Max Calories
    </IonLabel>
              </div>
              <input
          className="small-input"
          type="number"
          placeholder="Cal"
          value={maxCalories}
          onChange={(e) => setMaxCalories(Number(e.target.value))}
        />
    </IonItem>
    <button className="button" onClick={handleSearchFood}>
        <svg
          className="svgIcon"
          viewBox="0 0 512 512"
          height="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm50.7-186.9L162.4 380.6c-19.4 7.5-38.5-11.6-31-31l55.5-144.3c3.3-8.5 9.9-15.1 18.4-18.4l144.3-55.5c19.4-7.5 38.5 11.6 31 31L325.1 306.7c-3.2 8.5-9.9 15.1-18.4 18.4zM288 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path>
        </svg>
        Explore
      </button>

  </IonCardContent>
</IonCard>

<IonCard>
  <IonCardHeader>
    <IonCardTitle className="ion-card-title">Search Results</IonCardTitle>
  </IonCardHeader>

  <IonCardContent>

  {!hasSearched && (
            <IonText color="medium">
              <p style={{ textAlign: 'center', marginTop: '12px' }}>No food search yet.</p>
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

  </IonCardContent>
  </IonCard>
  <IonCard>
  <IonCardHeader>
    <IonCardTitle className="ion-card-title">Save Workout</IonCardTitle>
  </IonCardHeader>
  <IonCardContent>
  <button className="bookmarkBtn">
      <span className="IconContainer">
        <svg viewBox="0 0 384 512" height="0.9em" className="icon">
          <path
            d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z"
          ></path>
        </svg>
      </span>
   <p className="text">Save</p>
    </button>
    </IonCardContent>
    </IonCard>

</IonContent>

    </IonPage>
  );
};

export default Home;
