import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * Enveloppe commune a toutes les pages : barre de navigation, titre,
 * zone de contenu. Le socle la fournit pour que les quatre autres
 * membres n'aient a ecrire que le contenu de leur page.
 *
 * La navigation s'adapte au role : un etudiant ne voit jamais les liens
 * d'administration. Ce n'est qu'un confort d'interface, la protection
 * reelle reste le roleGuard cote serveur.
 */
export function Layout({ children }) {
  const { utilisateur, estConnecte, estAdmin, logout } = useAuth();
  const naviguer = useNavigate();

  function seDeconnecter() {
    logout();
    naviguer('/login', { replace: true });
  }

  return (
    <div className="application">
      <header className="entete">
        <Link to={estAdmin ? '/admin' : '/student'} className="marque">
          Exam Hub
        </Link>

        {estConnecte && (
          <nav className="navigation">
            {estAdmin ? (
              <>
                <Link to="/admin">Tableau de bord</Link>
                <Link to="/admin/courses">Cours</Link>
                <Link to="/admin/exams">Examens</Link>
                <Link to="/admin/students">Etudiants</Link>
              </>
            ) : (
              <>
                <Link to="/student">Examens disponibles</Link>
                <Link to="/student/results">Mes resultats</Link>
              </>
            )}
          </nav>
        )}

        {estConnecte && (
          <div className="session">
            <span className="texte-discret">{utilisateur.fullName}</span>
            <span className="badge">{estAdmin ? 'Administrateur' : 'Etudiant'}</span>
            <button type="button" className="bouton bouton-discret" onClick={seDeconnecter}>
              Se deconnecter
            </button>
          </div>
        )}
      </header>

      <main className="contenu">{children}</main>
    </div>
  );
}
