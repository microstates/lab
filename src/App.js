import React, { PureComponent } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import './index.css';

import JSONTree from 'react-json-tree';
import { AutoSizer } from 'react-virtualized';
import FSM from './components/fsm';

class App extends PureComponent {
  state = {
    chart: {
      states: [],
      transitions: []
    }
  };

  render() {
    return (
      <div className="container-fluid h-100">
        <div className="row h-50">
          <div className="col-lg-7">
            <AutoSizer>
              {({ height, width }) => (
                <FSM
                  chart={this.state.chart}
                  width={width}
                  height={height}
                  onChange={chart => this.setState({ chart })}
                />
              )}
            </AutoSizer>
          </div>
          <div className="col-lg-5 h-100 json-tree-container">
            <JSONTree
              className="h-100"
              data={this.state.chart}
              hideRoot={true}
            />
          </div>
        </div>
        <div className="row h-50">
          <div className="col">main</div>
        </div>
      </div>
    );
  }
}

export default App;
