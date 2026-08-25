import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * Garde de navigation.
 *
 * Deux comportements distincts, exiges explicitement par le sujet :
 *  - non connecte            -> redirection vers /login
 *  - connecte, mauvais role  -> renvoi vers l'espace de son role reel
 *                               (un etudiant qui tape /admin dans la barre
 *                               d'adresse atterrit sur /student, pas sur
 *                               une page blanche ni sur /login)
 *
 * Cette garde ne protege rien en soi : elle rend l'interface coherente.
 * La vraie protection est le roleGuard cote serveur (P2).
 */
export function ProtectedRoute({ role }) {
  const { estConnecte, utilisateur, pretAuDemarrage } = useAuth();
  const emplacement = useLocation();

  // Tant que la session stockee n'a pas ete relue, on n'affiche rien :
  // sinon un rafraichissement de page renvoie brievement vers /login.
  if (!pretAuDemarrage) {
    return null;
  }

  if (!estConnecte) {
    return <Navigate to="/login" replace state={{ depuis: emplacement.pathname }} />;
  }

  if (role && utilisateur.role !== role) {
    const espaceReel = utilisateur.role === 'ADMIN' ? '/admin' : '/student';
    return <Navigate to={espaceReel} replace />;
  }

  return <Outlet />;
}
