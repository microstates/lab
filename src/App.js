import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import './index.css';

import JSONTree from 'react-json-tree';
import { AutoSizer } from 'react-virtualized';
import FSM from './components/fsm';

function App() {
  return (
    <div className="container-fluid h-100">
      <div className="row h-50">
        <div className="col-lg-6">
          <AutoSizer>
            {({ height, width }) => <FSM width={width} height={height} />}
          </AutoSizer>
        </div>
        <div className="col-lg-6 h-100 json-tree-container">
          <JSONTree className="h-100" data={{ hello: 'world' }} />
        </div>
      </div>
      <div className="row h-50">
        <div className="col">main</div>
      </div>
    </div>
  );
}

export default App;
