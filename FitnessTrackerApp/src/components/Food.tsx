import React, { useState } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { addCircleOutline, removeCircleOutline } from 'ionicons/icons';

interface FoodCardProps {
  foodCalories: number;
  foodNutrition: {
    carbs: number;
    fat: number;
    title:String;
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

  const handleIncrease = () => {
    const newCount = count + 1;
    setCount(newCount);
    caloriesManagement(newCount * foodCalories);
  };

  const handleDecrease = () => {
    if (count > 0) {
      const newCount = count - 1;
      setCount(newCount);
      caloriesManagement(newCount * foodCalories);
    }
  };

  return (
    <div className="food-card">
      <img className="food-image" src={foodImage} alt="Food" />
      <div className="food-info">
        <h3 className="food-title">{foodNutrition.title}</h3>
        <p className="food-details">
          <span>Calories:</span> {foodCalories} kcal
        </p>
        <p className="food-details">
          <span>Carbs:</span> {foodNutrition.carbs} g
        </p>
        <p className="food-details">
          <span>Fat:</span> {foodNutrition.fat} g
        </p>
        <p className="food-details">
          <span>Protein:</span> {foodNutrition.protein} g
        </p>
      </div>
      <div className="count-controls">
        <IonButton
          onClick={handleDecrease}
          color="danger"
          disabled={count <= 0} // Disable decrement if count is 0
        >
          <IonIcon icon={removeCircleOutline} />
        </IonButton>
        <span>{count}</span>
        <IonButton onClick={handleIncrease} color="success">
          <IonIcon icon={addCircleOutline} />
        </IonButton>
      </div>
    </div>
  );
};

export default FoodCard;
