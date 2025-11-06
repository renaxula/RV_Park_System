import { useState, useEffect } from 'react'
import './App.css'
import axios from 'axios';
import { AdminDashboard } from './components/pages/AdminDashboard';
import { AvailableSpots } from './components/pages/AvailableSpots';
import { ChangePassword } from './components/pages/ChangePassword';
import { ChangeRates } from './components/pages/ChangeRates';
import { ElevateDemote } from './components/pages/ElevateDemote';
import { EmployeeReservation } from './components/pages/EmployeeReservation';
import { ResetPassword } from './components/pages/ResetPassword';
import { ViewReservations } from './components/pages/ViewReservations';
import { OpenSitesReport } from './components/pages/OpenSitesReport';
import { OccupiedSitesReport } from './components/pages/OccupiedSitesReport';

// TODO: Add react router
// Make it look not ugly


function App() {
  return (
    <>
      <OccupiedSitesReport />
    </>
  )
}

export default App
