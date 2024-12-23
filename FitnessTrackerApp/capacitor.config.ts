import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.technyks.FitFoodTrackerApp',
  appName: 'FitFoodTrackerApp',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, 
      launchAutoHide: true,    
      backgroundColor: '#ffffff', 
      androidScaleType: 'CENTER_CROP',
      iosSpinnerStyle: 'small', 
      iosSpinnerColor: '#000000',
      showSpinner: false, 
    },
    
  },
  
};

export default config;
