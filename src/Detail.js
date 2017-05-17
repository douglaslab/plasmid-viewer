import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';

var width = 800;
var fontSize = 24;
var markerStep = 50;
var textWidth;
var margin = {left: 20, top: 20};

class Detail extends Component {
  componentDidMount() {
    this.svg = d3.select(this.refs.svg);
    this.phases = this.svg.append('g')
      .attr('transform', 'translate(' + [0, margin.top] + ')');
    this.markers = this.svg.append('g')
      .attr('transform', 'translate(' + [0, margin.top] + ')');
    // and then add a brush
    this.onBrush = this.onBrush.bind(this);
    var brush = d3.brushX()
      .extent([[fontSize / 2, margin.top], [width - fontSize / 2, margin.top + fontSize]])
      .on('brush', this.onBrush);
    this.svg.append('g')
      .classed('brush', true)
      .call(brush)


    textWidth = d3.max(this.props.features, feature => feature.translation.length);
    textWidth = (width - 2 * fontSize) / textWidth;

    this.renderPhase();
    // this.renderMarkers();
  }

  componentDidUpdate() {
    this.renderPhase();
    // this.renderMarkers();
  }

  renderPhase() {
    var text = this.phases.selectAll('text')
      .data(this.feature.translation || []);

    text.exit().remove();

    text.enter().append('text')
      .classed('phase', true)
      .attr('text-anchor', 'middle')
      .style('font-size', fontSize)
      .attr('dy', '.35em')
      .merge(text)
      .attr('x', (d, i) => i * textWidth + fontSize)
      .attr('y', fontSize / 2)
      .attr('fill', this.feature.arcColor)
      .text(d => d);
  }

  renderMarkers() {
    var markerData = _.times(Math.floor(this.feature.translation.length / markerStep),
      i => this.feature.start + i * markerStep);

    var markers = this.markers.selectAll('text')
      .data(markerData);

    markers.exit().remove();

    markers.enter().append('text')
      .attr('text-anchor', 'middle')
      .style('font-size', 10)
      .merge(markers)
      .attr('x', (d, i) => i * markerStep * textWidth + fontSize)
      .text(d => d);
  }

  onBrush() {

  }

  render() {
    var style = {
      display: 'inline-block',
      width,
      verticalAlign: 'top',
    };
    this.feature = _.find(this.props.features, feature => feature.name === this.props.selectedPhase.name);
    var proteinSeq = this.feature.translation.slice(this.props.selectedPhase.start, this.props.selectedPhase.end);
    var dnaSeq = this.feature.sequence.slice(this.props.selectedPhase.start * 3, this.props.selectedPhase.end * 3);
    var rnaSeq = dnaSeq.replace('T', 'U');

    return (
      <div className="Detail" style={style}>
        <h3>{this.feature.name} {this.feature.product && '(' + this.feature.product + ')'}</h3>
        <svg ref='svg' width={width} />
        <div>{proteinSeq}</div>
        <div>{rnaSeq}</div>
        <div>{dnaSeq}</div>
      </div>
    );
  }
}

export default Detail;
