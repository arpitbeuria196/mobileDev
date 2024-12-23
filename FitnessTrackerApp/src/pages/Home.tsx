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
  IonIcon,
  IonList
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

/** 1) Import React Toastify (and CSS) */
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Home: React.FC = () => {
  const history = useHistory();

  // *** State for workouts, user, etc. ***
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // *** Input fields for the new workout ***
  const [activity, setActivity] = useState('');
  const [duration, setDuration] = useState('');

  // *** Inline error states for activity/duration ***
  const [activityError, setActivityError] = useState('');
  const [durationError, setDurationError] = useState('');

  // *** State for images, location, etc. ***
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [caloriesTaken, setCaloriesTaken] = useState<number>();
  const [caloriesBurnt, setCaloriesBurnt] = useState<number>();
  const [calorieMessage, setCalorieMessage] = useState<string>('');
  const [calorieDifference, setCalorieDifference] = useState<number>();
  const [image, setImage] = useState<any>('');
  const [location, setLocation] = useState<{ lat: number; lng: number }>({
    lat: 53.349805,
    lng: -6.26031,
  });

  // *** State for food search logic ***
  const [minCalories, setMinCalories] = useState<number>();
  const [maxCalories, setMaxCalories] = useState<number>();
  const [foodCalories, setFoodCalories] = useState<number>();
  const [foodNutrition, setFoodNutrition] = useState<any>(null);
  const [foodImage, setFoodImage] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // *** Initialize reference for hidden file input ***
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------
  //              LIFECYCLE & FIRESTORE
  // --------------------------------------------------
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

  // --------------------------------------------------
  //              CAMERA & FILE UPLOAD
  // --------------------------------------------------
  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
      });
      const imageUrl = photo.webPath;
      setUploadedImage(imageUrl);
    } catch (error: any) {
      console.error('Error taking photo:', error);
      toast.error('Error taking photo: ' + error.message);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

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
      } catch (error: any) {
        console.error('Error saving file:', error);
        toast.error('Error saving file: ' + error.message);
      }
    };

    reader.readAsDataURL(file);
  };

  const removeImage = async () => {
    setUploadedImage(null);
  };

  // --------------------------------------------------
  //           HANDLE SAVE WORKOUT
  // --------------------------------------------------
  const handleSaveWorkout = async () => {
    // Clear previous field errors
    setActivityError('');
    setDurationError('');

    // Check required fields
    if (!activity) {
      setActivityError('Activity is required');
      toast.error('Activity is required!');
      return;
    }
    if (!duration) {
      setDurationError('Duration is required');
      toast.error('Duration is required!');
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

        // Reset fields after success
        setActivity('');
        setDuration('');
        setActivityError('');
        setDurationError('');
        setCaloriesTaken(0);
        setCaloriesBurnt(3.2);
        setFoodCalories(0);
        setFoodImage('');
        setUploadedImage('');
        setFoodNutrition(null);
        setEditIndex(null);

        updateCalorieMessage(caloriesBurned);
        toast.success('Workout saved successfully!');
      } catch (error: any) {
        console.error('Error saving workout:', error);
        toast.error('Error saving workout: ' + error.message);
      }
    }
  };

  // --------------------------------------------------
  //           HANDLE FOOD SEARCH
  // --------------------------------------------------
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
    } catch (error: any) {
      console.error('Error fetching food data:', error);
      toast.error('Error fetching food data: ' + error.message);
    }
  };

  // --------------------------------------------------
  //           CALCULATION & MANAGEMENT
  // --------------------------------------------------
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

  // --------------------------------------------------
  //           DELETE & EDIT
  // --------------------------------------------------
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
    } catch (error: any) {
      console.error('Error deleting workout:', error);
      toast.error('Error deleting workout: ' + error.message);
    }
  };

  const handleEditWorkout = (index: number) => {
    const workoutToEdit = workouts[index];
    setActivity(workoutToEdit.activity);
    setDuration(workoutToEdit.duration.toString());
    setEditIndex(index);
  };

  // --------------------------------------------------
  //           STYLE FOR CALORIE MESSAGE
  // --------------------------------------------------
  const calorieStatusStyle =
    calorieDifference < 0 ? { color: '#388E3C' } : { color: '#D32F2F' };

  // --------------------------------------------------
  //           RENDER
  // --------------------------------------------------
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="custom-toolbar">
          <IonTitle className="title">
            Welcome, {user?.displayName || "User"} to FitFood Tracker 
            {/* Logout Button */}
            <IonButton onClick={() => signOut(auth)} className="logout-button">
              Logout
            </IonButton>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <ToastContainer position="top-center" autoClose={2500} />

        {/* =========================
            Log a Workout Card
        ==========================*/}
        <IonCard>
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
              {/* Inline error for Activity */}
              {activityError && (
                <p className="field-error">
                  {activityError}
                </p>
              )}
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
              {/* Inline error for Duration */}
              {durationError && (
                <p className="field-error">
                  {durationError}
                </p>
              )}
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* =========================
            Upload Section
        ==========================*/}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="ion-card-title">Upload Section</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonButton
              color="primary"
              onClick={takePhoto}
              className="action-button small-button"
            >
              <IonIcon slot="start" icon={cameraOutline} />
              Photo
            </IonButton>

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

            {/* Display the image + Remove button if we have an image */}
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

        {/* =========================
            Auto Calories Calculation
        ==========================*/}
        <IonCard>
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

        {/* =========================
            Search by Calories
        ==========================*/}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="ion-card-title">Search by Calories</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {/* Min Calories */}
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

            {/* Max Calories */}
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

        {/* =========================
            Search Results
        ==========================*/}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="ion-card-title">Search Results</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {!hasSearched && (
              <IonText color="medium">
                <p style={{ textAlign: 'center', marginTop: '12px' }}>
                  No food search yet.
                </p>
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

        {/* =========================
            Save or Edit Workout
        ==========================*/}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="ion-card-title">
              {editIndex !== null ? 'Edit Workouts' : 'Save Workout'}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <button className="bookmarkBtn" onClick={handleSaveWorkout}>
              <span className="IconContainer">
                <svg
                  viewBox="0 0 384 512"
                  height="0.9em"
                  className="icon"
                >
                  <path
                    d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z"
                  ></path>
                </svg>
              </span>
              <p className="text">Save</p>
            </button>
            <h3 style={calorieStatusStyle} className="calorie-status">
              {calorieMessage}
            </h3>
          </IonCardContent>
        </IonCard>

        {/* =========================
            List of Workouts
        ==========================*/}
        <IonCard>
          <IonCardContent>
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
          </IonCardContent>
        </IonCard>

      </IonContent>
    </IonPage>
  );
};

export default Home;
