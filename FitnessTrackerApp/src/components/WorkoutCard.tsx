import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon } from '@ionic/react';
import { trash, pencil } from 'ionicons/icons';
import './Workout.css';

interface WorkoutCardProps {
  workout: {
    id: string;
    activity: string;
    duration: number;
    caloriesTaken: number,
    caloriesBurnt:number,
    image?: string;
    date: any;
  };
  onDelete: () => void;
  onEdit: () => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onDelete, onEdit }) => {
  const formattedDate = new Date(workout.date.seconds * 1000).toLocaleDateString();

  return (
    <IonCard className="workout-card">
      <IonCardContent className="workout-card-content">
        <div className="workout-card-top">
          <IonCardTitle className="workout-card-title">{workout.activity}</IonCardTitle>
          <p className="workout-card-date">{formattedDate}</p>
        </div>

        <div className="workout-card-bottom">
          <p><strong>Calories Burned:</strong> {workout.caloriesBurnt} kcal</p>
          <p><strong>Calories Gained:</strong> {workout.caloriesTaken} kcal</p>
          <p><strong>Duration:</strong> {workout.duration} minutes</p>
        </div>
        {workout.image && (
          <img
            src={workout.image} 
            alt="Workout"
            style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }}
          />
        )}
        <div className="workout-card-actions">
          <IonButton fill="clear" onClick={onEdit} className="edit-btn">
            <IonIcon icon={pencil} />
          </IonButton>
          <IonButton fill="clear" color="danger" onClick={onDelete} className="delete-btn">
            <IonIcon icon={trash} />
          </IonButton>
        </div>
      </IonCardContent>
      <div className="workout-card-image">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path>
        </svg>
      </div>
    </IonCard>
  );
};

export default WorkoutCard;
