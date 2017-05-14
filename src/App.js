import React, { Component } from 'react';
import _ from 'lodash';

import data from './data/data.json';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {features: [], sequence: ''};
  }

  componentWillMount() {
    // go through the features and attach corresponding DNA sequence
    var sequence = data.sequence;
    var features = _.chain(data.features)
      .map(feature => {
        var {start, end} = feature;
        if (!sequence[start] || !sequence[end]) return;
        // TODO: account for end > start at one point

        return Object.assign(feature, {
          sequence: sequence.slice(start, end),
        });
      }).filter()
      .sortBy(feature => feature.start)
      .value();

    this.setState({features, sequence});
  }

  render() {
    return (
      <div className="App">
      </div>
    );
  }
}

export default App;
