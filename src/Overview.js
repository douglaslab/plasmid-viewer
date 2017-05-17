import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';

var width = 400;
var height = 400;
var innerRadius = 150;
var strandRadii = [135, 140];
var fontSize = 20;
var arcPadding = 5;
var arc = d3.arc();

class Overview extends Component {

  componentDidMount() {
    this.svg = d3.select(this.refs.svg)
      .append('g').attr('transform', 'translate(' + [width / 2, height / 2] + ')');

    this.renderStrands();
    this.updateStrandOpacity();
    this.calculateArcs();
    this.renderArcs();
  }

  componentDidUpdate() {
    this.updateStrandOpacity();
  }

  // calculate arcs for each feature, and if the start of one arc overlaps
  // with the end of the previous arc, then go up a step for the inner radius of that arc
  calculateArcs() {
    var radiiSteps = [];
    var sequenceLength = this.props.sequence.length;
    this.arcs = _.map(this.props.features, feature => {
      var {start, end} = feature;
      var stepIndex = feature.arcStep || 0;

      // if user-defined arcStep doesn't exist, then calculate stepIndex
      if (feature.arcStep === undefined) {
        // while the previous end is bigger than current end, keep going up step index
        while (radiiSteps[stepIndex] && radiiSteps[stepIndex] > start) {
          stepIndex += 1;
        }
      }
      // once we find right step, remember current end
      radiiSteps[stepIndex] = end;
      var labelStepIndex = feature.labelStep || stepIndex;

      var startAngle = (start / sequenceLength) * 2 * Math.PI;
      var endAngle = (end / sequenceLength) * 2 * Math.PI;
      if (start > end) {
        startAngle = -((sequenceLength - start) / sequenceLength) * 2 * Math.PI;
      }

      // now create the arc
      return {
        innerRadius: innerRadius + fontSize * stepIndex / 2,
        outerRadius: innerRadius + fontSize * stepIndex / 2 + fontSize,
        startAngle,
        endAngle,
        labelRadius: innerRadius + fontSize * labelStepIndex / 2,
        labelRotation: (startAngle + endAngle) / 2 * (180 / Math.PI),
        data: feature,
      }
    });
  }

  // DNA strands
  renderStrands() {
    // def for text on circular path
    var defs = this.svg.append('defs');
    defs.selectAll('path')
      .data(strandRadii).enter().append('path')
      .attr('id', (d, i) => 'textPath' + i)
      .attr('d', d => 'M' + [0, 0] + ' A' + [d, d, 0, 1, 1, 0, 0.01])
      // for some reason SVG path arcs start at 180deg so rotate it 90deg to start at top
      .attr('transform', d => 'rotate(90)translate(' + [-d, 0] + ')');

    this.strands = this.svg.selectAll('.strand')
      .data(strandRadii).enter().append('text')
      .classed('strand', true)
      .append('textPath')
      .attr('xlink:href', (d, i) => '#textPath' + i)
      .attr('font-size', 1)
      .text(this.props.sequence);
  }

  updateStrandOpacity() {
    this.strands.attr('opacity', (d, i) => {
        // if it's the 2nd strand, it should always show
        if (i) return 1;
        // if it's first strand, it should only show if strand props is "double"
        return this.props.strand === 'double' ? 1 : 0;
      });
  }

  renderArcs() {
    this.svg.selectAll('.arc')
      .data(this.arcs).enter().append('path')
      .classed('arc', true)
      .attr('d', arc)
      .attr('fill', d => d.data.arcColor)
      .attr('fill-opacity', 0.75)
      .on('click', d => this.props.selectPhase(d.data));

    this.svg.selectAll('.label')
      .data(this.arcs).enter().append('text')
      .classed('label', true)
      .attr('y', d => -d.labelRadius - fontSize / 2)
      .attr('transform', d => 'rotate(' + d.labelRotation + ')')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', fontSize - 2)
      .text(d => d.data.name);
  }

  render() {
    return (
      <svg ref='svg' width={width} height={height} />
    );
  }
}

export default Overview;
