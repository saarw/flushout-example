import React from 'react';
import './App.css';
import { Client } from './Client';
import { BackendApi } from './types';
import { Backend } from './Backend';

function App() {
  const backendApi: BackendApi = new Backend();
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
    <div>
    <p>Collaboration example app using distributed data model Flushout (source at <a href="https://github.com/saarw/flushout-example">https://github.com/saarw/flushout-example</a>)</p>
    </div>
    <div className="App">
      <Client title="Client 1" backendApi={backendApi}></Client>
      <Client title="Client 2" backendApi={backendApi}></Client>
    </div>
    </div>
  );
}

export default App;
