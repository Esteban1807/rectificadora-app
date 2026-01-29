import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import IngresoVehiculos from './components/IngresoVehiculos';
import FormularioIngreso from './components/FormularioIngreso';
import ChecklistIngreso from './components/ChecklistIngreso';
import TrabajosPorIngreso from './components/TrabajosPorIngreso';
import OrdenTrabajo from './components/OrdenTrabajo';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<IngresoVehiculos />} />
          <Route path="/ingreso/nuevo" element={<FormularioIngreso />} />
          <Route path="/ingreso/checklist" element={<ChecklistIngreso />} />
          <Route path="/motor/:id" element={<TrabajosPorIngresoWrapper />} />
          <Route path="/motor/:id/orden" element={<OrdenTrabajoWrapper />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function TrabajosPorIngresoWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  return <TrabajosPorIngreso motorId={id} onBack={() => navigate('/')} />;
}

function OrdenTrabajoWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  return <OrdenTrabajo motorId={id} onBack={() => navigate(`/motor/${id}`)} />;
}

export default App;
