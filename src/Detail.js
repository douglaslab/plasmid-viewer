import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import isMobile from 'ismobilejs';

var margin = {left: 60, right: 20, top: 20, bottom: 20};
var defaultWidth = 1000;
var width = window.innerWidth < defaultWidth ? window.innerWidth : defaultWidth;
var rectHeight = 20;
var fontSize = 14;
var numChars = Math.floor(width / (fontSize * 0.6) / 3);

class Detail extends Component {
  constructor(props) {
    super(props);

    this.state = {updateEverything: false, numChars: 20};
    this.onBrush = this.onBrush.bind(this);
    this.windowResize = this.windowResize.bind(this);
  }

  componentDidMount() {
    // define scales
    var maxLength = d3.max(this.props.features, feature =>
      feature.translation.length || (feature.sequence.length / 3));
    this.phasesScale = d3.scaleLinear()
      .domain([0, maxLength])
      .range([0, width - margin.left - margin.right]);
    this.sequencesScale = d3.scaleLinear()
      .range([margin.left, width - margin.right]);

    this.svg = d3.select(this.refs.svg);
    this.phases = this.svg.append('rect')
      .attr('transform', 'translate(' + [margin.left, 0] + ')');
    this.sequences = this.svg.append('g')
      .attr('transform', 'translate(' + [0, 1.5 * rectHeight] + ')');
    this.annotations = this.svg.append('g')
      .attr('transform', 'translate(' + [0, 1.5 * rectHeight + 5 * fontSize] + ')')
      .attr('clip-path', 'url(#clip-rect)');
    this.annotationClip = this.annotations.append('defs')
      .append('clipPath').attr('id', 'clip-rect')
      .append('rect').attr('x', margin.left)
      .attr('width', width - margin.left - margin.right);

    // and then add a brush
    this.brush = d3.brushX()
      .on('brush', this.onBrush);
    this.brushContainer = this.svg.append('g')
      .attr('transform', 'translate(' + [margin.left, 0] + ')')
      .classed('brush', true);

    this.setupScaleAndBrush();
    this.renderPhase();
    this.renderSequences();
    this.renderAnnotations();

    window.addEventListener('resize', this.windowResize)
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
    var [x1, x2] = d3.brushSelection(this.brushContainer.node());
    var {start, end} = this.props.selectedPhase;
    var brushStart = Math.floor(this.phasesScale.invert(x1));
    var brushEnd = Math.floor(this.phasesScale.invert(x2));
    if (brushStart !== start || brushEnd !== end) {
      // if a brush in another component is being dragged
      // make sure that the brush in Detail is updated accordingly
      this.programmaticallyBrush = true;
      this.brushContainer
        .call(this.brush.move, [this.phasesScale(start), this.phasesScale(end)]);
    }

    this.renderSequences();
    this.renderAnnotations();
  }

  setupScaleAndBrush() {
    var translationLength = this.feature.sequence.length / 3;
    var seqLength = Math.min(translationLength, numChars);
    this.sequencesScale.domain([0, numChars]);

    // when there's a new feature, make sure brush extent updates to that new feature length
    this.brush.extent([[0, 0], [this.phasesScale(translationLength), rectHeight]]);
    this.brushContainer.call(this.brush)
      .call(this.brush.move, [0, this.phasesScale(seqLength)]);
    // make sure to remove brush handles so that user can't resize
    this.brushContainer.selectAll('.handle, .overlay').remove();
  }

  renderPhase() {
    var translationLength = this.feature.sequence.length / 3;
    this.phases.attr('fill', this.feature.arcColor)
      .attr('width', this.phasesScale(translationLength))
      .attr('height', rectHeight)
  }

  renderSequences() {
    var {start, end} = this.props.selectedPhase;

    var translationLength = this.feature.sequence.length / 3;
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
      .attr('font-size', fontSize - 2)
      .merge(text)
      .attr('fill', (d, i) => {
        if (!this.props.colorBy) return '#000';
        // if it's color by position, then pass in index out of total length to colors
        if (this.props.colorBy.name === 'position')
          return this.props.colorBy.colors((start + i) / translationLength);
        // else it should be a peptide letter to color mapping
        var peptide = proteinSeq[i];
        return this.props.colorBy.colors[peptide] || '#000';
      }).attr('x', (d, i) => this.sequencesScale(i) + textWidth / 2)
      .text(d => d);
  }

  renderAnnotations() {
    var maxStep = d3.max(this.feature.annotations, annotation => annotation.step) || 0;
    this.annotationClip.attr('height', (maxStep + 1) * (fontSize + 2));

    var {start, end} = this.props.selectedPhase;
    start = this.feature.start + start * 3;
    end = this.feature.start + end * 3;
    var annotationsData = _.filter(this.feature.annotations, annotation =>
      (start <= annotation.start && annotation.start <= end) ||
      (start <= annotation.end && annotation.start <= end));

    var annotations = this.annotations.selectAll('.annotation')
      .data(annotationsData);

    annotations.exit().remove();

    var enter = annotations.enter().append('g')
      .classed('annotation', true);

    enter.append('rect')
      .attr('height', fontSize + 2);
    enter.append('text')
      .classed('monotype', true)
      .attr('y', fontSize / 2 + 1)
      .attr('dy', '.35em')
      .attr('font-size', fontSize);

    annotations = enter.merge(annotations)
      .attr('transform', d => {
        // if annotation starts before window start, then just render at 0
        var x = Math.max((d.start - start) / 3, 0);
        x = this.sequencesScale(x);
        var y = d.step * (fontSize + 2);
        return 'translate(' + [x, y] + ')';
      });

    annotations.select('rect')
      .attr('fill', d => d.color || '#000')
      .attr('width', d => {
        // only draw width for within window (add 1 bc include end)
        var width = Math.min(d.end, end) + 1 - Math.max(d.start, start);
        d.width = this.sequencesScale(width / 3) - this.sequencesScale(0);
        return d.width;
      });
    annotations.select('text')
      .text(d => d.text)
      .attr('x', function(d) {
        var diff = d.width - this.getBoundingClientRect().width;
        if (d.start < start && diff < 0) {
          // if annotation start is off screen, align at end
          return diff - 2;
        }
        return 2;
      });
  }

  onBrush() {
    // if another component is programmatically setting brush
    // then don't update, only update if Detail's brush is being moved
    if (this.programmaticallyBrush) {
      this.programmaticallyBrush = false;
      return;
    }

    var [x1, x2] = d3.event.selection;
    var start = Math.floor(this.phasesScale.invert(x1));
    var end = Math.floor(this.phasesScale.invert(x2));

    this.props.moveWindow(start, end);
  }

  windowResize() {
    width = window.innerWidth < defaultWidth ? window.innerWidth : defaultWidth;
    numChars = Math.floor(width / (fontSize * 0.6) / 3);

    // update the scales
    this.phasesScale.range([0, width - margin.left - margin.right]);
    this.sequencesScale.domain([0, numChars]).range([margin.left, width - margin.right]);
    // technically should let it update in componentDidUpdate
    // but better to do it here since it's only applicable on window resize
    this.renderPhase();

    var {start} = this.props.selectedPhase;
    var end = start + numChars;

    this.props.moveWindow(start, end);
  }

  render() {
    var style = {
      display: 'inline-block',
      width: width,
      verticalAlign: 'top',
    };

    this.feature = _.find(this.props.features, feature =>
      feature.name === this.props.selectedPhase.name);

    var maxStep = d3.max(this.feature.annotations, annotation => annotation.step) || 0;
    var height = 1.5 * rectHeight + 6 * fontSize + (maxStep + 1) * (fontSize + 2);

    var colorMaps = _.map(this.props.colors, (color) => {
      var style = {
        marginRight: 5,
        borderBottom: color.name === this.props.colorBy.name ? '1px solid': 'none',
        cursor: 'pointer',
        display: 'inline-block',
        color: '#56A9F6',
      };
      return (
        <span key={color.name} style={style} onClick={() => this.props.updateColorBy(color)}>
          {color.name}
        </span>
      );
    });

    return (
      <div className="Detail" style={style}>
        <div style={{paddingLeft: margin.left, paddingRight: margin.right, paddingBottom: margin.bottom}}>
          <span style={{fontWeight: 600, fontSize: '1.2em', borderBottom: '1px solid'}}>
            {this.feature.name} {this.feature.product && ' (' + this.feature.product + ')'}
          </span> <span style={{fontStyle: 'italic'}}>{this.feature.description}</span>
          <br />
          color by: {colorMaps}
        </div>
        <svg ref='svg' width={width} height={height} />
      </div>
    );
  }
}

export default Detail;
