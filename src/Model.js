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
    // only update this component if the selected feature has changed
    return this.props.selectedPhase.name !== nextProps.selectedPhase.name;
  }

  // colorByChanged() {
  //   if (this.state.colorBy.name === 'position') {
  //     this.viewer.setStyle({cartoon:{style:'trace', color:'spectrum'}});
  //   } else {
  //     this.viewer.setStyle({cartoon:{colorfunc: colorResN }});
  //   }
  // }

  // brushSelectionChanged() {
  //   start = this.state.brushStart; // fixme
  //   end = this.state.brushEnd; // fixme
  //   colorByChanged(); // reset to current color scheme to fix unselected residues
  //   this.viewer.setStyle({resi:_.range(start,end)}, {cartoon:{color:'white'}});
  //   this.viewer.render();
  // }

  // colorResN(atom) {
  //   // should look up color of atom.resn in current colorBy mapping
  //   return this.state.colorBy.colors[atom.resn];
  // }

  componentDidUpdate() {
    this.loadModel();
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
        viewer.setStyle({cartoon:{style:'oval', color:feature.arcColor}});
        viewer.zoomTo();
        viewer.render();
      },
      error: (hdr, status, err) => {
        console.error( "Failed to load PDB " + pdbFile + ": " + err );
      },
    });
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
