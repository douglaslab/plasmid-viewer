import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';

var width = window.innerWidth < 500 ? window.innerWidth : 500;
var height = window.innerWidth < 500 ? window.innerWidth : 500;
var fontSize = 20;
var innerRadius = width * 0.33;
var strandRadii = [innerRadius - 15, innerRadius - 10];
// var arcPadding = 5;
var arc = d3.arc();
var drag = d3.drag();

class Overview extends Component {

  constructor(props) {
    super(props);
    this.moveWindow = this.moveWindow.bind(this);
    drag.on('drag', this.moveWindow);
  }

  componentWillMount() {
    // if there's feature list width, then subtract
    if (this.props.featureWidth) {
      width -= this.props.featureWidth;
    }
  }

  componentDidMount() {
    this.svg = d3.select(this.refs.svg)
      .append('g').attr('transform', 'translate(' + [width / 2, height / 2] + ')');

    this.renderStrands();
    this.updateStrandOpacity();
    this.calculateArcs();
    this.renderArcs();

    this.window = this.svg.append('path')
      .classed('window', true)
      // give it same styling as d3 brush
      .attr('fill', 'rgb(119, 119, 119)')
      .attr('fill-opacity', 0.3)
      .attr('stroke', '#fff')
      .style('cursor', 'move')
      .call(drag);
    this.updateWindow();
  }

  componentDidUpdate() {
    this.updateStrandOpacity();
    this.updateWindow();
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
    this.strands = this.svg.selectAll('.strand')
      .data(strandRadii).enter().append('circle')
      .classed('strand', true)
      .attr('r', d => d)
      .attr('fill', 'none')
      .attr('stroke', '#cfcfcf');
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
      .style('cursor', 'pointer')
      // only trigger click event if it has a "product" defined, and not already selected
      .on('click', d => this.props.selectedPhase.name !== d.data.name ?
        this.props.selectPhase(d.data) : null);

    this.svg.selectAll('.label')
      .data(this.arcs).enter().append('text')
      .classed('label', true)
      .attr('y', d => -d.labelRadius - fontSize / 2)
      .attr('transform', d => 'rotate(' + d.labelRotation + ')')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', fontSize - 2)
      .text(d => d.data.name)
      .style('cursor', 'pointer')
      .on('click', d => this.props.selectedPhase.name !== d.data.name ?
        this.props.selectPhase(d.data) : null);
  }

  updateWindow() {
    var {start, end, name} = this.props.selectedPhase;
    var {innerRadius, outerRadius, startAngle} = _.find(this.arcs, arc => arc.data.name === name);

    // multiply start and end by 3, bc that start and end is the amino acid start/end
    // and then convert it into radians
    var sequenceLength = this.props.sequence.length;
    start = (3 * start / sequenceLength) * 2 * Math.PI;
    end = (3 * end / sequenceLength) * 2 * Math.PI;

    var windowArc = {
      innerRadius,
      outerRadius,
      startAngle: startAngle + start,
      endAngle: startAngle + end,
    };
    this.window.attr('d', arc(windowArc));
  }

  moveWindow() {
    var {start, end, name} = this.props.selectedPhase;
    var diff = (end - start) * 3;
    var feature = _.find(this.props.features, feature => feature.name === name);

    var [x, y] = d3.mouse(this.svg.node());
    // multiply y by -1 bc currently it's the other way around
    var angle = Math.atan2(-1 * y, x) - Math.PI / 2;
    if (angle < 0) {
      // if angle is negative must be in the 3rd & 4th quadrants, turn it positive
      // because I want to go clockwise
      angle *= -1;
    } else {
      // otherwise, must be 1st & 2nd quadrant
      angle = 2 * Math.PI - angle;
    }
    var percent = angle / (2 * Math.PI);
    var seqLength = this.props.sequence.length;
    var middle = Math.floor(seqLength * percent);

    var move_start = middle - feature.start;
    if (feature.end < feature.start && move_start < 0 && percent < 0.5) {
      // if sequence wraps around to the beginning
      // and current start is negative BUT in the first 50% of the circle
      move_start = (seqLength - feature.start) + middle;
    }
    var move_end = move_start + diff;

    if (move_start >= 0 && move_end <= feature.sequence.length) {
      move_start = Math.floor(move_start / 3);
      move_end = Math.floor(move_end / 3);
    } else if (move_start < 0) {
      // if it's less than start, just keep it at start
      move_start = 0;
      move_end = diff / 3;
    } else {
      // and if dragged past sequence end, don't let it go past that
      move_end = Math.floor(feature.sequence.length / 3);
      move_start = move_end - (diff / 3);
    }

    // only update if new start isn't the same as old start
    if (move_start !== start) {
      this.props.moveWindow(move_start, move_end);
    }
  }

  render() {
    return (
      <svg ref='svg' width={width} height={height} />
    );
  }
}

export default Overview;
