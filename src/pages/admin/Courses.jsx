import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../../api/client';

export default function Courses() {
  const [cours, setCours] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  async function chargerCours() {
    setChargement(true);
    try {
      const data = await apiFetch('/courses');
      setCours(data);
      setErreur(null);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Erreur inattendue.');
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerCours();
  }, []);

  return (
    <section className="carte">
      <div className="carte-entete">
        <h2>Cours</h2>
      </div>

      {erreur && <p className="message message-erreur">{erreur}</p>}

      {chargement ? (
        <p className="texte-discret">Chargement...</p>
      ) : cours.length === 0 ? (
        <p className="table-vide">Aucun cours pour le moment.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Examens</th>
            </tr>
          </thead>
          <tbody>
            {cours.map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.name}</td>
                <td>{c.examCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}