import React, { Component } from 'react';
import {FormGroup, ControlLabel, FormControl, Panel, Radio} from 'react-bootstrap';
//import Likert from './Likert.js'
import LikertRow from './LikertRow.js'
import './LikertGroup.css'

class LikertGroup extends Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.value !== this.props.value;
  }

  renderLikert(key, min, max) {
    let entries = [];
    entries.push(<td key={0}>{min}</td>);
    for (let i = 0; i < this.props.scale; i++) {
      let update = {}; update[key] = i;
      entries.push(<td key={i+1}><Radio name={this.props.name + "-" + key} value={i} checked={i === this.props.value[key]} onChange={() => this.props.onChange(update)} inline>
                    {i+1} 
                   </Radio></td>);
    }
    entries.push(<td key={this.props.scale+1}>{max}</td>);
    return entries;
  }

  render() {
    let rows = [];
    for (let i = 0; i < this.props.questions.length; i++) {
      let [key, question, min, max] = this.props.questions[i];
      rows.push((<tr key={key}>
        <td>{question}</td>
        {this.renderLikert(key, min, max)}
        </tr>));
    }

    return (
      <table className="likert-group" width="100%">
        <tbody>
        {rows}
        </tbody>
      </table>
    );
  }
}

LikertGroup.defaultProps = {
  name: "likert-group", // used as a prefix
  questions: [],
  scale: 5,
  value: {},
  onChange: () => {}
}

export default LikertGroup;
