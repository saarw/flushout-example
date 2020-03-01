import React from 'react';
import './App.css';
import { Client } from './Client';
import { CompletionBatch, Master } from 'flushout';
import { TodoList, BackendApi } from './types';

function App() {
  const master = new Master<TodoList>({
    commandCount: 0,
    document: {
      todos: {}
    }
  });
  const backendApi: BackendApi = {
    latestSnapshot: () => {
      // Copy the snapshot from the backend to simulate a network encoding/decoding
      const snapshotCopy = JSON.parse(JSON.stringify(master.getSnapshot()));
      return Promise.resolve(snapshotCopy);
    },
    sendFlush: (flush: CompletionBatch) => {
      return master.apply(flush);
    }
  };
  return (
    <div className="App">
      <Client title="Client 1" backendApi={backendApi}></Client>
      <Client title="Client 2" backendApi={backendApi}></Client>
    </div>
  );
}

export default App;
