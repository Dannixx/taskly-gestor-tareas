
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "./services/firebase";
import AuthPage from "./pages/AuthPage";
import TaskDashboard from "./pages/TaskDashboard";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingSession(false);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (checkingSession) {
    return (
      <main className="session-loading">
        Cargando Taskly...
      </main>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <TaskDashboard
      user={user}
      onLogout={handleLogout}
    />
  );
}

export default App;
