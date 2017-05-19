import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import isMobile from 'ismobilejs';

import Overview from './Overview';
import Model from './Model';
import Detail from './Detail';
import data from './data/data.json';

var colors = d3.scaleOrdinal(d3.schemeCategory20);
var isMobilePhone = isMobile.phone;
var overviewWidth = isMobilePhone ? window.innerWidth : 400;
var overviewHeight = isMobilePhone ? window.innerWidth : 400;
var modelWidth = isMobilePhone ? window.innerWidth : 400;
var modelHeight = isMobilePhone ? window.innerWidth : 400;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      features: [],
      sequence: '',
      strand: 'double', // can be single or double
      windowWidth: 16, // number of translated protein sequence to show
      selectedPhase: {},
    };

    this.selectPhase = this.selectPhase.bind(this);
    this.moveWindow = this.moveWindow.bind(this);
  }

  componentWillMount() {
    // go through the features and attach corresponding DNA sequence
    var sequence = data.sequence;
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
          arcColor: arcColor || colors(name),
        });
      }).filter().value();

    // default selected phase to first
    var selectedPhase = {
      name: features[0].name,
      start: 0,
      end: Math.min(this.state.windowWidth, features[0].translation.length),
    };

    this.setState({features, sequence, selectedPhase});
  }

  selectPhase(phase) {
    var selectedPhase = {
      name: phase.name,
      start: 0,
      end: Math.min(this.state.windowWidth, phase.translation.length),
    };
    this.setState({selectedPhase});
  }

  moveWindow(start, end) {
    var selectedPhase = Object.assign(this.state.selectedPhase, {start, end});
    this.setState({selectedPhase});
  }

  render() {
    var interactionProps = {
      selectPhase: this.selectPhase,
      moveWindow: this.moveWindow,
    };

    return (
      <div className="App">
        <Overview {...interactionProps} {...this.state}
          width={overviewWidth} height={overviewHeight} />
        <Model {...this.state} width={overviewWidth} height={overviewHeight} />
        <Detail {...interactionProps} {...this.state} />
      </div>
    );
  }
}

export default App;
