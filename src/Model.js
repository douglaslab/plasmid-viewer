import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';

class Model extends Component {
  render() {
    return (
      <div width={this.props.width} height={this.props.height} />
    );
  }
}

export default Model;
