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
      this.loadModel();
    }
    if (this.props.colorBy.name !== nextProps.colorBy.name) {
      this.updateColor(nextProps);
      this.viewer.render();
    }
    this.updateBrushSelection(nextProps);
    return false;
  }

  loadModel() {
    this.viewer.clear();
    var feature = _.find(this.props.features, feature =>
      feature.name === this.props.selectedPhase.name);
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
    if (colorBy === 'position') {
        this.viewer.setStyle({cartoon: {style:'trace', color:'spectrum'}});
    } else {
      this.viewer.setStyle({cartoon: {colorfunc: function(atom) {
        return colorBy.colors[atom.resn];
      }}});
    }
  }

  updateBrushSelection(props) {
    var {start, end} = (props || this.props).selectedPhase;
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

    return (
      <div ref='container' style={style} />
    );
  }
}

export default Model;
