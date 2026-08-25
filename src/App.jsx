import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Layout } from './components/Layout';

import Login from './pages/Login';
import Students from './pages/admin/Students';
import Dashboard from './pages/admin/Dashboard';
import Courses from './pages/admin/Courses';
import Exams from './pages/admin/Exams';
import QuestionEditor from './pages/admin/QuestionEditor';
import ExamResults from './pages/admin/ExamResults';
import AvailableExams from './pages/student/AvailableExams';
import TakeExam from './pages/student/TakeExam';
import ExamResult from './pages/student/ExamResult';
import MyResults from './pages/student/MyResults';

/**
 * Les onze routes du sujet, declarees une fois pour toutes par le socle.
 *
 * Ce fichier appartient a P1. Les autres membres remplissent uniquement
 * leur page dans src/pages/ : personne n'a besoin de modifier App.jsx,
 * donc ce fichier partage ne genere aucun conflit Git (regle R8).
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Espace administrateur - role ADMIN exige */}
            <Route element={<ProtectedRoute role="ADMIN" />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/students" element={<Students />} />
              <Route path="/admin/courses" element={<Courses />} />
              <Route path="/admin/exams" element={<Exams />} />
              <Route path="/admin/exams/:id/questions" element={<QuestionEditor />} />
              <Route path="/admin/exams/:id/results" element={<ExamResults />} />
            </Route>

            {/* Espace etudiant - role STUDENT exige */}
            <Route element={<ProtectedRoute role="STUDENT" />}>
              <Route path="/student" element={<AvailableExams />} />
              <Route path="/student/exams/:id" element={<TakeExam />} />
              <Route path="/student/exams/:id/result" element={<ExamResult />} />
              <Route path="/student/results" element={<MyResults />} />
            </Route>

            {/* La racine renvoie vers /login ; ProtectedRoute se charge
                ensuite d'orienter chacun vers l'espace de son role. */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
