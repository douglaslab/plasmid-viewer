import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';

var margin = {left: 60, right: 20, top: 20, bottom: 20};
var defaultWidth = 1000;
var width = window.innerWidth < defaultWidth ? window.innerWidth : defaultWidth;
var rectHeight = 20;
var fontSize = 14;
var numChars = Math.floor(width / (fontSize * 0.6) / 3);

class Detail extends Component {
  constructor(props) {
    super(props);

    this.state = {updateEverything: false, numChars: 20, colorBy: ''};
    this.onBrush = this.onBrush.bind(this);
  }

  componentWillMount() {
    this.setState({colorBy: this.props.colors[0].colors});
  }

  componentDidMount() {
    // define scales
    var maxLength = d3.max(this.props.features, feature =>
      feature.translation.length || (feature.sequence.length / 3));
    this.phasesScale = d3.scaleLinear()
      .domain([0, maxLength])
      .range([0, width - margin.left - margin.right]);
    this.sequencesScale = d3.scaleLinear()
      .range([margin.left, width -  margin.right]);

    this.svg = d3.select(this.refs.svg);
    this.phases = this.svg.append('rect')
      .attr('transform', 'translate(' + [margin.left, 0] + ')');
    this.sequences = this.svg.append('g')
      .attr('transform', 'translate(' + [0, 1.5 * rectHeight] + ')');

    // and then add a brush
    this.brush = d3.brushX()
      .on('brush', this.onBrush);
    this.brushContainer = this.svg.append('g')
      .attr('transform', 'translate(' + [margin.left, 0] + ')')
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
      this.setupScaleAndBrush(this.state.numChars);
    }

    this.renderSequences();
  }

  setupScaleAndBrush() {
    var translationLength = this.feature.translation.length || (this.feature.sequence.length / 3);
    var seqLength = Math.min(translationLength, numChars);
    this.sequencesScale.domain([0, seqLength]);

    // when there's a new feature, make sure brush extent updates to that new feature length
    this.brush.extent([[0, 0], [this.phasesScale(translationLength), rectHeight]]);
    this.brushContainer.call(this.brush)
      .call(this.brush.move, [0, this.phasesScale(seqLength)]);;
    // make sure to remove brush handles so that user can't resize
    this.brushContainer.selectAll('.handle, .overlay').remove();
  }

  renderPhase() {
    var translationLength = this.feature.translation.length || (this.feature.sequence.length / 3);
    this.phases.attr('fill', this.feature.arcColor)
      .attr('width', this.phasesScale(translationLength))
      .attr('height', rectHeight)
  }

  renderSequences() {
    var {start, end} = this.props.selectedPhase;
    var proteinSeq = this.feature.translation &&
      this.feature.translation.slice(start, end).split('');
    var rnaSeq = this.feature.sequence.slice(3 * start, 3 * end)
      .replace(/T/g, 'U').match(/.{1,3}/g) || [];
    var dnaSeq = this.feature.sequence.slice(3 * start, 3 * end).match(/.{1,3}/g) || [];
    var data = [
      {label: 'Peptide', seq: proteinSeq},
      {label: 'RNA', seq: rnaSeq},
      {label: 'DNA', seq: dnaSeq},
    ];
    var sequences = this.sequences.selectAll('.sequence').data(data);

    sequences.exit().remove();

    var enter = sequences.enter().append('g')
      .classed('sequence', true);
    enter.append('text')
      .classed('label', true)
      .attr('x', margin.left - 2)
      .attr('text-anchor', 'end')
      .attr('dy', '.35em')
      .attr('font-weight', 600)
      .attr('fill', '#999')
      .attr('font-size', fontSize)
      .text(d => d.label);
    enter.append('g')
      .classed('seq', true);

    sequences = enter.merge(sequences)
      .attr('transform', (d, i) => 'translate(' + [0, (i + 0.5) * 1.5 * fontSize] + ')');

    var text = sequences.select('.seq')
      .selectAll('text').data(d => d.seq);
    var textWidth = this.sequencesScale(1) - this.sequencesScale(0);
    text.exit().remove();
    text.enter().append('text')
      .classed('monotype', true)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .style('font-size', fontSize - 2)
      .merge(text)
      .attr('fill', (d, i) => {
        if (!this.state.colorBy || !proteinSeq.length) return '#000';
        var peptide = proteinSeq[i];
        return this.state.colorBy[peptide] || '#000';
      }).attr('x', (d, i) => this.sequencesScale(i) + textWidth / 2)
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
      width: width,
      verticalAlign: 'top',
    };
    this.feature = _.find(this.props.features, feature => feature.name === this.props.selectedPhase.name);

    return (
      <div className="Detail" style={style}>
        <div style={{paddingLeft: margin.left, paddingRight: margin.right, paddingBottom: margin.bottom}}>
          <span style={{fontWeight: 600, fontSize: '1.2em', borderBottom: '1px solid'}}>
            {this.feature.name} {this.feature.product && ' (' + this.feature.product + ')'}
          </span> <span style={{fontStyle: 'italic'}}>{this.feature.description}</span>
        </div>
        <svg ref='svg' width={width} height={200} />
      </div>
    );
  }
}

export default Detail;
