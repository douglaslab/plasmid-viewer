import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';

var width = 500;
var height = 500;
var innerRadius = 120;
var fontSize = 24;
var arcPadding = 5;
var arc = d3.arc();
var colors = d3.scaleOrdinal(d3.schemeCategory20);

class Overview extends Component {

  componentDidMount() {
    this.svg = d3.select(this.refs.svg)
      .append('g').attr('transform', 'translate(' + [width / 2, height / 2] + ')');

    this.calculateArcs();
    this.renderArcs();
  }

  // calculate arcs for each feature, and if the start of one arc overlaps
  // with the end of the previous arc, then go up a step for the inner radius of that arc
  calculateArcs() {
    var radiiSteps = [];
    var sequenceLength = this.props.sequence.length;
    this.arcs = _.map(this.props.features, feature => {
      var {start, end} = feature;
      var stepIndex = 0;
      // while the previous end is bigger than current end, keep going up step index
      while (radiiSteps[stepIndex] > start) {
        stepIndex += 1;
      }
      // once we find right step, remember current end
      radiiSteps[stepIndex] = end;

      // now create the arcs

      return {
        innerRadius: innerRadius + (fontSize + arcPadding) * stepIndex,
        outerRadius: innerRadius + (fontSize + arcPadding) * stepIndex + fontSize,
        startAngle: (start / sequenceLength) * 2 * Math.PI,
        endAngle: (end / sequenceLength) * 2 * Math.PI,
        startDegree: (start / sequenceLength) * 360,
        endDegree: (end / sequenceLength) * 360,
        data: feature,
      }
    });
  }

  renderArcs() {
    var arcs = this.svg.selectAll('.arc')
      .data(this.arcs).enter().append('g')
      .classed('arc', true);

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => colors(d.data.name));
    arcs.append('text')
      .attr('y', d => -d.innerRadius - fontSize / 2)
      .attr('transform', d => 'rotate(' + ((d.startDegree + d.endDegree) / 2) + ')')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .text(d => d.data.name);

  }

  render() {
    return (
      <svg ref='svg' width={width} height={height} />
    );
  }
}

export default Overview;
