import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';

var width = 800;
var fontSize = 24;
var markerStep = 50;
var margin = {left: 20, top: 20};

class Detail extends Component {
  constructor(props) {
    super(props);

    this.state = {updateEverything: false};
    this.onBrush = this.onBrush.bind(this);
  }

  componentDidMount() {
    // define scales
    var maxLength = d3.max(this.props.features, feature => feature.translation.length);
    this.phasesScale = d3.scaleLinear()
      .domain([0, maxLength])
      .range([0, width - 2 * margin.left]);
    this.sequencesScale = d3.scaleLinear()
      .range([margin.left, width - fontSize - margin.left]);

    this.svg = d3.select(this.refs.svg);
    this.phases = this.svg.append('rect')
      .attr('transform', 'translate(' + [margin.left, margin.top] + ')');
    this.sequences = this.svg.append('g')
      .attr('transform', 'translate(' + [0, margin.top + 2 * fontSize] + ')');

    // and then add a brush
    this.brush = d3.brushX()
      .on('brush', this.onBrush);
    this.brushContainer = this.svg.append('g')
      .attr('transform', 'translate(' + [margin.left, margin.top] + ')')
      .classed('brush', true);

    this.setupScaleAndBrush();
    this.renderPhase();
    this.renderSequences();
  }

  componentWillReceiveProps(nextProps) {
    // update everything if the phase has changed
    var updateEverything = nextProps.selectedPhase.name !== this.props.selectedPhase.name;
    this.setState({updateEverything});
  }

  componentDidUpdate() {
    if (this.state.updateEverything) {
      this.renderPhase();
      this.setupScaleAndBrush();
    }

    this.renderSequences();
  }

  setupScaleAndBrush() {
    var seqLength = this.props.selectedPhase.end - this.props.selectedPhase.start;
    this.sequencesScale.domain([0, seqLength]);

    // when there's a new feature, make sure brush extent updates to that new feature length
    this.brush.extent([[0, 0], [this.phasesScale(this.feature.translation.length), fontSize]]);
    this.brushContainer.call(this.brush)
      .call(this.brush.move, [0, this.phasesScale(seqLength)]);;
    // make sure to remove brush handles so that user can't resize
    this.brushContainer.selectAll('.handle, .overlay').remove();
  }

  renderPhase() {
    this.phases.attr('fill', this.feature.arcColor)
      .attr('width', this.phasesScale(this.feature.translation.length))
      .attr('height', fontSize)
  }

  renderSequences() {
    var {start, end} = this.props.selectedPhase;
    var proteinSeq = this.feature.translation.slice(start, end).split('');
    var rnaSeq = this.feature.sequence.slice(3 * start, 3 * end)
      .replace(/T/g, 'U').match(/.{1,3}/g) || [];
    var dnaSeq = this.feature.sequence.slice(3 * start, 3 * end).match(/.{1,3}/g) || [];
    var data = [proteinSeq, rnaSeq, dnaSeq];
    var sequences = this.sequences.selectAll('g').data(data);

    sequences.exit().remove();

    sequences = sequences.enter().append('g')
      .classed('sequence', true)
      .merge(sequences)
      .attr('transform', (d, i) => 'translate(' + [0, (i + 0.5) * 1.2 * fontSize] + ')');

    var text = sequences.selectAll('text').data(d => d);
    var textWidth = this.sequencesScale(1) - this.sequencesScale(0);
    text.exit().remove();
    text.enter().append('text')
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .style('font-size', fontSize - 2)
      .style('font-family', 'Courier New')
      .merge(text)
      .attr('x', (d, i) => this.sequencesScale(i) + textWidth / 2)
      .text(d => d);
  }

  onBrush() {
    var [x1, x2] = d3.event.selection;
    var start = Math.floor(this.phasesScale.invert(x1));
    var end = Math.floor(this.phasesScale.invert(x2));

    this.props.moveWindow(start, end);
  }

  render() {
    var style = {
      display: 'inline-block',
      width,
      verticalAlign: 'top',
    };
    this.feature = _.find(this.props.features, feature => feature.name === this.props.selectedPhase.name);

    return (
      <div className="Detail" style={style}>
        <h3>{this.feature.name} {this.feature.product && '(' + this.feature.product + ')'}</h3>
        <svg ref='svg' width={width} />
      </div>
    );
  }
}

export default Detail;
