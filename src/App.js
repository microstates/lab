import React, { PureComponent } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import './index.css';

import JSONTree from 'react-json-tree';
import { AutoSizer } from 'react-virtualized';
import Designer from './components/Designer';

class App extends PureComponent {
  constructor(props) {
    super(props);

    let chart = localStorage.getItem('chart');
    if (chart) {
      chart = JSON.parse(chart);
    } else {
      chart = {
        states: [],
        transitions: []
      };
    }

    this.state = { chart };
  }

  save = chart => {
    this.setState({ chart });
    localStorage.setItem('chart', JSON.stringify(chart));
  };

  render() {
    return (
      <div className="container-fluid h-100">
        <div className="row h-50">
          <div className="col-lg-7">
            <AutoSizer>
              {({ height, width }) => (
                <Designer
                  chart={this.state.chart}
                  width={width}
                  height={height}
                  onChange={this.save}
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
