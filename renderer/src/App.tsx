import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Onboarding from './pages/onboarding/Onboarding'
import Dashboard from './pages/dashboard/Dashboard'
import Sentry from './components/Sentry'
import Plausible from './components/Plausible'
import { HelmetProvider, Helmet } from 'react-helmet-async'
import { ROUTES } from './lib/routes'

const App = ():JSX.Element => {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Filecoin Station</title>
      </Helmet>
      <Router>
        <Routes>
          <Route path={ROUTES.onboarding} element={<Onboarding />} />
          <Route
            path="*"
            element={
            <>
              <Sentry />
              <Plausible />
              <Routes>
                <Route path={ROUTES.dashboard} element={<Dashboard />} />
              </Routes>
            </>
            }
          >
          </Route>
        </Routes>
      </Router>
    </HelmetProvider>
  )
}

export default App
