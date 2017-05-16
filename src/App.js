import React, { Component } from 'react';
import _ from 'lodash';

import Overview from './Overview';
import data from './data/data.json';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      features: [],
      sequence: '',
      strand: 'double', // can be single or double
    };
  }

  componentWillMount() {
    // go through the features and attach corresponding DNA sequence
    var sequence = data.sequence;
    var features = _.chain(data.features)
      .map(feature => {
        var {start, end} = feature;
        var subsequence = sequence.slice(start, end + 1);
        if (start > end) {
          // if start is bigger than end, it must mean the sequence wraps around
          subsequence = sequence.slice(start) + sequence.slice(0, end + 1);
        }

        return Object.assign(feature, {
          sequence: subsequence,
        });
      }).filter().value();

    this.setState({features, sequence});
  }

  render() {
    return (
      <div className="App">
        <Overview {...this.state} />
      </div>
    );
  }
}

export default App;
