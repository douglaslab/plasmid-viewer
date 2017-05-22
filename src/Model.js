import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';

var size = window.innerWidth < 500 ? window.innerWidth : 500;
class Model extends Component {
  render() {
    var style = {
      width: size,
      height: size,
      display: 'inline-block',
    };

    return (
      <div style={style} />
    );
  }
}

export default Model;
