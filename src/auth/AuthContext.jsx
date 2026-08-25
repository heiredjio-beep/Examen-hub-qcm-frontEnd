import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  EVENEMENT_NON_AUTHENTIFIE,
  apiFetch,
  ecrireToken,
  effacerToken,
  lireToken,
} from '../api/client';

const CLE_UTILISATEUR = 'examhub.user';

const AuthContext = createContext(null);

function lireUtilisateurStocke() {
  const brut = localStorage.getItem(CLE_UTILISATEUR);
  if (!brut) return null;
  try {
    return JSON.parse(brut);
  } catch {
    return null;
  }
}

/**
 * Etat d'authentification partage par toute l'application.
 *
 * Le token et l'utilisateur sont persistes dans localStorage : un
 * rafraichissement de page ne doit pas deconnecter l'utilisateur.
 * Le role vient toujours du serveur, jamais d'un choix cote client.
 */
export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(lireUtilisateurStocke);
  const [pretAuDemarrage, setPretAuDemarrage] = useState(false);

  useEffect(() => {
    // Le token stocke peut avoir expire pendant que l'onglet etait ferme.
    // On ne fait pas confiance a ce qui est en localStorage sans verifier.
    const token = lireToken();
    if (!token) {
      setUtilisateur(null);
      setPretAuDemarrage(true);
      return;
    }
    setPretAuDemarrage(true);
  }, []);

  const login = useCallback(async (email, motDePasse) => {
    const reponse = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password: motDePasse },
    });

    ecrireToken(reponse.token);
    localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(reponse.user));
    setUtilisateur(reponse.user);

    return reponse.user;
  }, []);

  const logout = useCallback(() => {
    effacerToken();
    localStorage.removeItem(CLE_UTILISATEUR);
    setUtilisateur(null);
  }, []);

  useEffect(() => {
    // Un 401 renvoye par n'importe quel appel vide la session. Combine a
    // ProtectedRoute, cela redirige l'utilisateur vers /login sans que
    // chaque page ait a gerer le cas du token expire.
    function surNonAuthentifie() {
      effacerToken();
      localStorage.removeItem(CLE_UTILISATEUR);
      setUtilisateur(null);
    }

    window.addEventListener(EVENEMENT_NON_AUTHENTIFIE, surNonAuthentifie);
    return () => window.removeEventListener(EVENEMENT_NON_AUTHENTIFIE, surNonAuthentifie);
  }, []);

  const valeur = useMemo(
    () => ({
      utilisateur,
      estConnecte: utilisateur !== null,
      estAdmin: utilisateur?.role === 'ADMIN',
      estEtudiant: utilisateur?.role === 'STUDENT',
      pretAuDemarrage,
      login,
      logout,
    }),
    [utilisateur, pretAuDemarrage, login, logout]
  );

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexte = useContext(AuthContext);
  if (contexte === null) {
    throw new Error('useAuth doit etre utilise a l interieur de AuthProvider.');
  }
  return contexte;
}
