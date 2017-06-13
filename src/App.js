import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import isMobile from 'ismobilejs';

import Overview from './Overview';
import Model from './Model';
import Detail from './Detail';
import data from './data/data.json';
import colors from './data/colors.json';

class App extends Component {
  constructor(props) {
    super(props);

    // since color by position is a gradient, programmatically add it
    colors.push({
      name: 'position',
      colors: (hue) => {
        var r = Math.sin(Math.PI * hue);
        var g = Math.sin(Math.PI * (hue + 1/3));
        var b = Math.sin(Math.PI * (hue + 2/3));
        return 'rgb(' + [r, g, b].map(channel => Math.floor(255 * (channel * channel))) + ')';
      },
    });
    this.state = {
      colors,
      colorBy: colors[0],
      features: [],
      sequence: '',
      strand: 'double', // can be single or double
      selectedPhase: {},
    };

    this.selectPhase = this.selectPhase.bind(this);
    this.moveWindow = this.moveWindow.bind(this);
    this.updateColorBy = this.updateColorBy.bind(this);
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
      name: features[6].name,
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

  updateColorBy(colorBy) {
    this.setState({colorBy});
  }

  render() {
    var featureWidth = 50;
    var style = {
      overflowX: 'hidden',
    };
    var props = {
      selectPhase: this.selectPhase,
      moveWindow: this.moveWindow,
      updateColorBy: this.updateColorBy,
      featureWidth,
    };

    var featureListStyle = {
      display:'inline-block',
      marginTop: isMobile.phone ? 20 : 110,
      // need to pass feature width into Overview
      // so it knows how much space to leave for feature list
      maxWidth: featureWidth,
      verticalAlign:'top'
    };

    // a list of selectable features
    var features = _.chain(this.state.features)
      .sortBy(feature => feature.listorder)
      .map(feature => {
        var style = {
          fontSize: '1em',
          marginRight: 20,
          borderBottom: this.state.selectedPhase.name === feature.name ? '1px solid': 'none',
          cursor: 'pointer',
          display: 'inline-block',
          color: feature.arcColor,
        };
        return (
          <span key={feature.name} style={style} onClick={() => this.selectPhase(feature)}>
            {feature.name}
          </span>
        );
      }).value();

    // only include 3Dmol if not phone
    var model = isMobile.phone ? null : (<Model {...this.state} />);

    return (
      <div className="App" style={style}>
        <Overview {...props} {...this.state} />
        <div style={featureListStyle}>
          {features}
        </div>
        {model}
        <br />
        <Detail {...props} {...this.state} />
      </div>
    );
  }
}

export default App;
