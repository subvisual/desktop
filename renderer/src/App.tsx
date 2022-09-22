import './App.css'
import {
  Link, Route, Routes
} from 'react-router-dom'
import { ActivityLog } from './components/ActivityLog'
import Saturn from './Saturn'
import { TotalJobsCompleted } from './components/TotalJobsCompleted'
import { useEffect } from 'react'

function App (): JSX.Element {
  return (
    <div className='App'>
      <header>
        <h1>Filecoin Station</h1>
      </header>
      <main>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/saturn' element={<Saturn />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

function Home (): JSX.Element {
  useEffect(() => { document.title = 'Filecoin Station' })

  return (
    <div style={{ marginTop: '2em' }}>
      <h2>Welcome to Filecoin Station</h2>
      <TotalJobsCompleted />
      <p><Link to='/saturn' id='link-to-saturn'> Saturn &gt;&gt;</Link></p>
      <ActivityLog />
    </div>
  )
}
