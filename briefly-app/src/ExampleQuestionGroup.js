import React, { Component } from 'react';
import {Panel, PanelGroup} from 'react-bootstrap';
import ExampleQuestion from './ExampleQuestion';

// A likert scale.
class ExampleQuestionGroup extends Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.value !== this.props.value;
  }
  constructor(props) {
    super(props)
  }

  render() {
    let elems = this.props.entries.map((pqe, i) =>
      <ExampleQuestion
              key={i}
              name={this.props.name + "-" + i}
              prompt={pqe[0]}
              question={pqe[1]}
              value={this.props.value}
              expected={pqe[2]}
              scale={this.props.scale}
              onChange={this.props.onChange}
            />
    );

    return (<PanelGroup>
      <Panel collapsible header={this.props.header} bsStyle="warning" eventKey="1" defaultExpanded={true}>
      {elems}
      </Panel>
    </PanelGroup>);
  }
}

ExampleQuestionGroup.defaultProps = {
  "entries": [
    ["This is the best question.", "How good is this question?",4,],
  ],
  "scale": 5,
  "value": undefined,
  "onChange": (value) => {},
  "name": "example",
}

export default ExampleQuestionGroup;
