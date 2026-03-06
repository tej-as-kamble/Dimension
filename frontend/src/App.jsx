import './App.css';
import { useState } from 'react';
import { Routes, Route } from "react-router-dom";
import Navbar from './components/navbar';
import Home from './components/home';
import Signup from './components/signup';
import Signin from './components/signin';
import Myfollowingpost from './components/myfollowingpost';
import Profile from './components/profile';
import Createpost from './components/createpost';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Logincontext from './context/logincontext';
import Modal from './components/modal';
import Userprofile from './components/userprofile';


function App() {
  const [userlogin, setuserlogin] = useState(false);
  const [modalopen, setmodalopen] = useState(false);

  return (
    <div className="app">
      <Logincontext.Provider value={{ setuserlogin, setmodalopen }}>
        <Navbar login={userlogin} />
        <Routes>
          <Route path='/' element={<Home />}></Route>
          <Route path='/signup' element={<Signup />}></Route>
          <Route path='/signin' element={<Signin />}></Route>
          <Route exact path='/profile' element={<Profile />}></Route>
          <Route path='/createpost' element={<Createpost />}></Route>
          <Route path='/user/:userid' element={<Userprofile />}></Route>
          <Route path='/myfollowingpost' element={<Myfollowingpost />}></Route>
        </Routes>
        <ToastContainer theme="dark" />
        {modalopen && <Modal setmodalopen={setmodalopen} />}
      </Logincontext.Provider>
    </div>
  );
}

export default App;
