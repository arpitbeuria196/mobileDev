import React, { useState } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { addCircleOutline, removeCircleOutline } from 'ionicons/icons';
import './Food.css'; 

interface FoodCardProps {
  foodCalories: number;
  foodNutrition: {
    carbs: number;
    fat: number;
    title: string;
    protein: number;
  };
  foodImage: string;
  caloriesManagement: (calories: number) => void;
}

const FoodCard: React.FC<FoodCardProps> = ({
  foodCalories,
  foodNutrition,
  foodImage,
  caloriesManagement,
}) => {
  const [count, setCount] = useState<number>(0);

  const handleIncrease = (event: React.MouseEvent<HTMLIonButtonElement>) => {
    event.stopPropagation(); 
    const newCount = count + 1;
    setCount(newCount);
    caloriesManagement(newCount * foodCalories);
  };
  
  const handleDecrease = (event: React.MouseEvent<HTMLIonButtonElement>) => {
    event.stopPropagation(); 
    if (count > 0) {
      const newCount = count - 1;
      setCount(newCount);
      caloriesManagement(newCount * foodCalories);
    }
  };
  
  

  return (
    <div className="food-card-container">
      <div className="flip-card">
        <div className="flip-card-inner">
          {/* Front Side */}
          <div className="flip-card-front">
            <img className="food-image" src={foodImage} alt={foodNutrition.title} />
          </div>

          {/* Back Side */}
          <div className="flip-card-back">
            <p className="title">{foodNutrition.title}</p>
            <p>
              <span className="detailed-label">Calories:</span> {foodCalories} kcal
            </p>
            <p>
              <span className="detailed-label">Carbs:</span> {foodNutrition.carbs} 
            </p>
            <p>
              <span className="detailed-label">Fat:</span> {foodNutrition.fat} 
            </p>
            <p>
              <span className="detailed-label">Protein:</span> {foodNutrition.protein} 
            </p>
          </div>
          <div className="controls">
            <button className='decrease-button' onClick={(event) => handleDecrease(event)} color="danger" disabled={count <= 0}>
              <IonIcon icon={removeCircleOutline} />
            </button>
            <button className ='increase-button' onClick={(event) => handleIncrease(event)} color="success">
              <IonIcon icon={addCircleOutline} />
              <span className="count">{count}</span>
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default FoodCard;
