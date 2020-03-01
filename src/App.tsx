import React from 'react';
import './App.css';
import { Client } from './Client';
import { BackendApi } from './types';
import { Backend } from './Backend';

function App() {
  const backendApi: BackendApi = new Backend();
  return (
    <div className="App">
      <Client title="Client 1" backendApi={backendApi}></Client>
      <Client title="Client 2" backendApi={backendApi}></Client>
    </div>
  );
}

export default App;
