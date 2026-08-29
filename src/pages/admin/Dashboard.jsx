
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, ApiError } from '../../api/client';

export default function Dashboard() {
  const [compteurs, setCompteurs] = useState({
    etudiantsActifs: 0,
    cours: 0,
    examens: 0,
    tentatives: 0,
  });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    async function charger() {
      setChargement(true);
      try {
        const [etudiants, cours, examens] = await Promise.all([
          apiFetch('/students'),
          apiFetch('/courses'),
          apiFetch('/exams'),
        ]);
        setCompteurs({
          etudiantsActifs: etudiants.filter((e) => e.isActive).length,
          cours: cours.length,
          examens: examens.length,
          tentatives: examens.reduce((total, e) => total + (e.attemptCount ?? 0), 0),
        });
        setErreur(null);
      } catch (err) {
        setErreur(err instanceof ApiError ? err.message : 'Erreur inattendue.');
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  return (
    <section className="carte">
      <div className="carte-entete">
        <h2>Tableau de bord</h2>
      </div>

      {erreur && <p className="message message-erreur">{erreur}</p>}

      {chargement ? (
        <p className="texte-discret">Chargement...</p>
      ) : (
        <div className="grille-compteurs">
          <div className="carte-compteur">
            <span className="compteur-valeur">{compteurs.etudiantsActifs}</span>
            <span className="compteur-libelle">Etudiants actifs</span>
          </div>
          <div className="carte-compteur">
            <span className="compteur-valeur">{compteurs.cours}</span>
            <span className="compteur-libelle">Cours</span>
          </div>
          <div className="carte-compteur">
            <span className="compteur-valeur">{compteurs.examens}</span>
            <span className="compteur-libelle">Examens</span>
          </div>
          <div className="carte-compteur">
            <span className="compteur-valeur">{compteurs.tentatives}</span>
            <span className="compteur-libelle">Tentatives</span>
          </div>
        </div>
      )}

      <div className="liens-rapides" style={{ marginTop: 20 }}>
        <Link to="/admin/students">Etudiants</Link>{' '}
        <Link to="/admin/courses">Cours</Link>{' '}
        <Link to="/admin/exams">Examens</Link>
      </div>
    </section>
  );
}