import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';

var size = window.innerWidth < 500 ? window.innerWidth : 500;
var fontSize = 20;
var innerRadius = 150;
var strandRadii = [135, 140];
// var arcPadding = 5;
var arc = d3.arc();
var drag = d3.drag();

class Overview extends Component {

  constructor(props) {
    super(props);
    this.moveWindow = this.moveWindow.bind(this);
    drag.on('drag', this.moveWindow);
  }

  componentDidMount() {
    this.svg = d3.select(this.refs.svg)
      .append('g').attr('transform', 'translate(' + [size / 2, size / 2] + ')');

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
    var percent = Math.atan2(y, x) + Math.PI / 2;
    percent = percent / (2 * Math.PI);
    var seqLength = this.props.sequence.length;

    var middle = seqLength * percent;
    if (middle < 0) {
      middle = seqLength - middle;
    }
    middle = Math.floor(middle);
    var move_start = middle - feature.start;
    // console.log(feature.start, middle, start)
    // if (middle < feature.start) {
    //   // if it loops around, start should be total - start + middle
    //   start = (seqLength - feature.start) + middle;
    // }
    var move_end = move_start + diff;

    if (move_start >= 0 && move_end <= feature.sequence.length) {
      move_start = Math.floor(move_start / 3);
      move_end = Math.floor(move_end / 3);
      this.props.moveWindow(move_start, end);
    }
  }

  render() {
    return (
      <svg ref='svg' width={size} height={size} />
    );
  }
}

export default Overview;
