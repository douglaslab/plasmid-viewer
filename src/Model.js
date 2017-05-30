import React, { Component } from 'react';
// import * as d3 from 'd3';  // warning unused
import _ from 'lodash';

var size = window.innerWidth < 500 ? window.innerWidth : 500;
class Model extends Component {
  render() {
    var style = {
      width: size,
      height: size,
      display: 'inline-block',
      position: 'relative',
    };

    return (
      <div style={style} className='viewer_3Dmoljs'
        data-pdb='1GVP' data-backgroundcolor='0xffffff' data-style='cartoon:color=spectrum' />
    );
  }
}

export default Model;
