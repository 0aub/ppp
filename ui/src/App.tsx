import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Reports from './pages/Reports';
import Projects from './pages/Projects';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Reports />} />
        <Route path="projects" element={<Projects />} />
      </Route>
    </Routes>
  );
}

export default App;
