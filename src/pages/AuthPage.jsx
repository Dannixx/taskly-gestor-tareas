
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

import { auth } from "../services/firebase";
import "./AuthPage.css";

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const email = formData.get("email").trim();
    const password = formData.get("password");
    const name = formData.get("name")?.trim();

    try {
      if (isRegister) {
        const confirmPassword = formData.get("confirmPassword");

        if (password !== confirmPassword) {
          setNotice("Las contraseñas no coinciden.");
          return;
        }

        const userCredential =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

        if (name) {
          await updateProfile(userCredential.user, {
            displayName: name
          });
        }
      } else {
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }
    } catch (error) {
      console.error("Error de autenticación:", error);

      const messages = {
        "auth/email-already-in-use":
          "Este correo ya tiene una cuenta registrada.",
        "auth/invalid-email":
          "El correo electrónico no es válido.",
        "auth/weak-password":
          "La contraseña debe tener al menos 6 caracteres.",
        "auth/invalid-credential":
          "El correo o la contraseña son incorrectos.",
        "auth/user-disabled":
          "Esta cuenta se encuentra deshabilitada.",
        "auth/too-many-requests":
          "Demasiados intentos. Inténtalo más tarde.",
        "auth/network-request-failed":
          "No se pudo conectar. Revisa tu conexión a internet."
      };

      setNotice(
        messages[error.code] ||
        "Ocurrió un error. Inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (newMode) => {
    setMode(newMode);
    setNotice("");
  };

  return (
    <main className="auth-container">
      <section className="auth-card">
        <div className="auth-decoration">
          <div className="brand">
            <span className="brand-icon">✓</span>
            <span>Taskly</span>
          </div>

          <div className="decoration-content">
            <span className="decoration-emoji">📝</span>
            <h1>Organiza tu día, alcanza tus metas.</h1>
            <p>
              Un espacio para organizar tus actividades,
              establecer prioridades y cumplir tus objetivos.
            </p>
          </div>

          <p className="decoration-footer">
            Cada tarea es un paso hacia tus metas.
          </p>
        </div>

        <div className="auth-form-container">
          <div className="auth-form">
            <p className="welcome">BIENVENIDA/O A TASKLY</p>

            <h2>
              {isRegister
                ? "Crea tu cuenta"
                : "¡Qué bueno tenerte aquí!"}
            </h2>

            <p className="auth-subtitle">
              {isRegister
                ? "Regístrate para comenzar a organizar tus tareas."
                : "Ingresa tus datos para continuar."}
            </p>

            <div className="auth-tabs">
              <button
                type="button"
                className={!isRegister ? "active" : ""}
                onClick={() => changeMode("login")}
              >
                Iniciar sesión
              </button>

              <button
                type="button"
                className={isRegister ? "active" : ""}
                onClick={() => changeMode("register")}
              >
                Registrarse
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {isRegister && (
                <div className="form-group">
                  <label htmlFor="name">
                    Nombre completo
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Escribe tu nombre"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>

              {isRegister && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Repite tu contraseña"
                    minLength={6}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading
                  ? "Procesando..."
                  : isRegister
                    ? "Crear mi cuenta"
                    : "Iniciar sesión"}
              </button>

              {notice && (
                <p className="form-notice" role="alert">
                  {notice}
                </p>
              )}
            </form>

            <p className="auth-bottom">
              Organiza tus pendientes, un día a la vez 💜
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AuthPage;
