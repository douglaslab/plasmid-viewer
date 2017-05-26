import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';

import Overview from './Overview';
import Model from './Model';
import Detail from './Detail';
import data from './data/data.json';
import colors from './data/colors.json';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      colors,
      features: [],
      sequence: '',
      strand: 'double', // can be single or double
      selectedPhase: {},
    };

    this.selectPhase = this.selectPhase.bind(this);
    this.moveWindow = this.moveWindow.bind(this);
  }

  componentWillMount() {
    // go through the features and attach corresponding DNA sequence
    var sequence = data.sequence;
    var arcColors = d3.scaleOrdinal(d3.schemeCategory20);
    var features = _.chain(data.features)
      .map(feature => {
        var {name, start, end, arcColor} = feature;
        var subsequence = sequence.slice(start-1, end); // GenBank uses 1-based indexing
        if (start > end) {
          // if start is bigger than end, it must mean the sequence wraps around
          subsequence = sequence.slice(start-1) + sequence.slice(0, end);
        }

        return Object.assign(feature, {
          sequence: subsequence,
          arcColor: arcColor || arcColors(name),
        });
      }).filter().value();

    // default selected phase to first
    var selectedPhase = {
      name: features[0].name,
      start: 0,
      end: 20,
    };

    this.setState({features, sequence, selectedPhase});
  }

  selectPhase(phase) {
    var selectedPhase = {
      name: phase.name,
      start: 0,
      end: 20,
    };
    this.setState({selectedPhase});
  }

  moveWindow(start, end) {
    var selectedPhase = Object.assign(this.state.selectedPhase, {start, end});
    this.setState({selectedPhase});
  }

  render() {
    var props = {
      selectPhase: this.selectPhase,
      moveWindow: this.moveWindow,
    };
    // a list of selectable features
    var features = _.chain(this.state.features)
      .sortBy(feature => feature.listorder)
      .map(feature => {
        var style = {
          fontSize: '1.2em',
          marginRight: 15,
          borderBottom: this.state.selectedPhase.name === feature.name ? '1px solid': 'none',
          cursor: 'pointer',
          display: 'inline-block',
        };
        return (
          <span style={style} onClick={() => this.selectPhase(feature)}>
            {feature.name}
          </span>
        );
      }).value();

    return (
      <div className="App">
        <Overview {...props} {...this.state} />
        <Model {...this.state} />
        <div style={{paddingLeft: 60, paddingRight: 20, paddingBottom: 20}}>
          {features}
        </div>
        <Detail {...props} {...this.state} />
      </div>
    );
  }
}

export default App;
