import React, { Component } from 'react';
import {Radio} from 'react-bootstrap';

// A likert scale.
class Likert extends Component {
  render() {
    let entries = [];
    entries.push(<span key={0}>{this.props.min}</span>);
    for (let i = 0; i < this.props.scale; i++) {
        entries.push(<Radio name={this.props.name} key={i+1} value={i} inline>
                      {i+1} 
                     </Radio>);
    }
    entries.push(<span key={this.props.scale+1}>{this.props.max}</span>);
    return (<div>
      {entries}
      </div>
    );
  }
}

Likert.defaultProps = {
  "min": "Terrible",
  "max": "Amazing",
  "scale": 5,
  "name": "radio-group",
}

export default Likert;