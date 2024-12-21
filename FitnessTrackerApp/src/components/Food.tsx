import React from 'react';

interface FoodCardProps {
  foodCalories: number;
  foodNutrition: any;
  foodImage: string;
}

const FoodCard: React.FC<FoodCardProps> = ({ foodCalories, foodNutrition, foodImage }) => {
  return (
    <div>
      <h3>Food Nutrition</h3>
      <img src={foodImage} alt="Food" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
      <p>Calories: {foodCalories} kcal</p>
      <p>Carbs: {foodNutrition?.carbs}</p>
      <p>Fat: {foodNutrition?.fat}</p>
      <p>Protein: {foodNutrition?.protein}</p>
    </div>
  );
};

export default FoodCard;
