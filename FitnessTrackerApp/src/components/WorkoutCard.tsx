import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon } from '@ionic/react';
import { trash, pencil } from 'ionicons/icons';
import './Workout.css';

interface WorkoutCardProps {
  workout: {
    id: string;
    activity: string;
    duration: number;
    caloriesBurned: number;
    date: any;
  };
  onDelete: () => void;
  onEdit: () => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onDelete, onEdit }) => {
  const formattedDate = new Date(workout.date.seconds * 1000).toLocaleDateString();

  return (
    <IonCard className="workout-card">
      <IonCardHeader className="workout-card-header">
        <IonCardTitle className="workout-card-title">{workout.activity}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent className="workout-card-content">
        <div className="workout-details">
          <p><strong>Duration:</strong> {workout.duration} minutes</p>
          <p><strong>Calories Burned:</strong> {workout.caloriesBurned} kcal</p>
          <p><strong>Date:</strong> {formattedDate}</p>
        </div>
        
        <div className="workout-card-actions">
          <IonButton className="edit-btn" fill="clear" onClick={onEdit}>
            <IonIcon icon={pencil} />
          </IonButton>
          <IonButton className="delete-btn" fill="clear" color="danger" onClick={onDelete}>
            <IonIcon icon={trash} />
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default WorkoutCard;
