import React, { Component } from 'react';
import _ from 'lodash';
import isMobile from 'ismobilejs';

var size = isMobile.phone ? window.innerWidth : 500;
class Model extends Component {

  componentDidMount() {
    // 3Dmol relies on jQuery, which gets loaded into the global namespace
    // along with 3Dmol when we add the file in index.html
    var element = window['$'](this.refs.container);
    var config = { backgroundColor: '#fff' };
    // to access $3Dmol, which has been bound to the global window
    // have to access it as window['$3Dmol'] instead of just $3Dmol
    this.viewer = window['$3Dmol'].createViewer(element, config);
    this.loadModel();
  }

  shouldComponentUpdate(nextProps) {
    if (this.props.selectedPhase.name !== nextProps.selectedPhase.name) {
      // if selected feature has changed, reload the model
      this.loadModel(nextProps);
    }
    if (this.props.colorBy.name !== nextProps.colorBy.name) {
      this.updateColor(nextProps);
      this.viewer.render();
    }
    this.updateBrushSelection(nextProps);
    return true;
  }

  loadModel(props) {
    this.viewer.clear();

    props = props || this.props;
    var feature = _.find(props.features, feature =>
      feature.name === props.selectedPhase.name);
    if (!feature.pdbFile) return;

    var pdbFile = require('./data/' + feature.pdbFile);
    var viewer = this.viewer;

    window['$'].ajax(pdbFile, {
      success: (data) => {
        viewer.addModel(data, 'pdb');
        viewer.addSurface(1, {opacity:0.5, color:'white'});
        viewer.setViewStyle({style:"outline"});
        this.updateColor();

        viewer.zoomTo();
        viewer.render();
      },
      error: (hdr, status, err) => {
        console.error( "Failed to load PDB " + pdbFile + ": " + err );
      },
    });
  }

  updateColor(props) {
    // set style with color by option
    var colorBy = props ? props.colorBy : this.props.colorBy;
    if (colorBy.name === 'position') {
        this.viewer.setStyle({cartoon: {color:'spectrum'}});
    } else {
      this.viewer.setStyle({cartoon: {colorfunc: function(atom) {
        return colorBy.colors[atom.resn];
      }}});
    }
  }

  updateBrushSelection(props) {
    var {start, end} = (props || this.props).selectedPhase;
    start = Math.floor(start/3)+1;  // resi start
    end = Math.floor(end/3)+1;  // resi end
    this.updateColor(props);
    this.viewer.setStyle({resi:_.range(start, end)}, {cartoon: {color: 'white'}});
    this.viewer.render();
  }

  render() {
    var style = {
      width: size,
      height: size,
      display: 'inline-block',
      position: 'relative',
    };
    var messageStyle = {
      position: 'absolute',
      margin: 'auto',
      width: 200,
      left: 0,
      right: 0,
      top: size / 2,
      textAlign: 'center',
    };
    var feature = _.find(this.props.features, feature =>
      feature.name === this.props.selectedPhase.name);

    return (
      <div style={style}>
        <div ref='container' style={style} />
        <div style={messageStyle}>
          {feature.pdbFile ? '' : 'No data available'}
        </div>
      </div>
    );
  }
}

export default Model;
