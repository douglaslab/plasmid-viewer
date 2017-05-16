import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';

var width = 500;
var height = 500;
var innerRadius = 120;
var innerCircleRadius = 110;
var fontSize = 24;
var arcPadding = 5;
var arc = d3.arc();
var colors = d3.scaleOrdinal(d3.schemeCategory20);

class Overview extends Component {

  componentDidMount() {
    this.svg = d3.select(this.refs.svg)
      .append('g').attr('transform', 'translate(' + [width / 2, height / 2] + ')');
      
    // def for text on circular path
    this.svg
      .append('defs')
      .append('path')
      .attr('id', 'textPath')
      .attr('d', 'M' + [0, 0] +
        ' A' + [innerCircleRadius, innerCircleRadius, 0, 1, 1, 0, 0.01])
      // for some reason SVG path arcs start at 180deg so rotate it 90deg to start at top
      .attr('transform', 'rotate(90)translate(' + [-innerCircleRadius, 0] + ')');
    // text path
    this.svg.append('text')
      .append('textPath')
      .attr('xlink:href', '#textPath')
      .attr('font-size', 1)
      .text(this.props.sequence);

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
      while (radiiSteps[stepIndex] && radiiSteps[stepIndex] > start) {
        stepIndex += 1;
      }
      // once we find right step, remember current end
      radiiSteps[stepIndex] = end;
      var startAngle = (start / sequenceLength) * 2 * Math.PI;
      var endAngle = (end / sequenceLength) * 2 * Math.PI;
      if (start > end) {
        startAngle = -((sequenceLength - start) / sequenceLength) * 2 * Math.PI;
      }
      var rotation = endAngle - (endAngle - startAngle) / 2;
      rotation = rotation * (180 / Math.PI);


      // now create the arc
      return {
        innerRadius: innerRadius + fontSize * stepIndex / 2,
        outerRadius: innerRadius + fontSize * stepIndex / 2 + fontSize,
        startAngle,
        endAngle,
        rotation,
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
      .attr('fill', d => colors(d.data.name))
      .attr('fill-opacity', 0.5);
    arcs.append('text')
      .attr('y', d => -d.innerRadius - fontSize / 2)
      .attr('transform', d => 'rotate(' + d.rotation + ')')
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
