import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Switch } from 'react-router-dom'; 
import Home from './pages/Home';
import Auth from './lib/Auth';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth'; 
import { auth } from './config/firebaseConfig';
import { ToastContainer } from 'react-toastify';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

setupIonicReact();

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const history = useHistory(); 

  useEffect(() => {
   
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true); 
        history.push('/home'); 
      } else {
        setIsAuthenticated(false);
        history.push('/auth');
      }
    });

    // Clean up the subscription on component unmount
    return () => unsubscribe();
  }, [history]);

  return (
    <IonApp>
       <ToastContainer position="top-center" autoClose={3500} />
      <IonReactRouter>
        <IonRouterOutlet>
          {/* Use Switch for routing */}
          <Switch>
            <Route path="/home" component={Home} />
            <Route path="/auth" component={Auth} /> 
            {/* Default route */}
            <Route path="/" component={Auth} /> {/* Redirect to auth page */}
          </Switch>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
