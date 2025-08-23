import { Outlet } from 'react-router-dom'
import Navigation from './components/Navigation';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css'

function App() {

  return (
    <>
      <div>
        <Navigation/>
      </div>
      <div>
        <Outlet />
      </div>
    </>
  )
}

export default App
