import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Playground from './components/Playground';
import Arena from './components/Arena';
import Battleground from './components/Battleground';
import Problempage from './components/problempage';

function App() {
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/Playground" element={<Playground/>}/>
        <Route path="/Arena" element={<Arena/>}/>
        <Route path="/Battleground" element={<Battleground/>}/>
        <Route path="/Problempage/:ProblemID" element={<Problempage/>}/>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
