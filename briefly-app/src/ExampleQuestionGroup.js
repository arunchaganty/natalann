import React, { Component } from 'react';
import {Panel, PanelGroup, Glyphicon} from 'react-bootstrap';
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
    let elems = this.props.entries.map((pex, i) =>
      <ExampleQuestion
              key={i}
              name={this.props.name + "-" + i}
              prompt={pex[0]}
              question={this.props.question}
              value={this.props.value}
              expected={pex[1]}
              explanation={pex[2]}
              scale={this.props.scale}
              onChange={this.props.onChange}
            />
    );

    let answers = this.props.entries.map((_, i) => this.props.value && this.props.value[this.props.name + "-" + i]);

    let glyph, bsStyle;
    if (answers.some((e, i) => e === undefined)) {
      bsStyle = "warning";
      glyph = <Glyphicon glyph="question-sign" />;
    } else if (answers.some((e, i) => e !== this.props.entries[i][1])) {
      bsStyle = "danger";
      glyph = <Glyphicon glyph="remove-sign" />;
    } else {
      bsStyle = "success";
      glyph = <Glyphicon glyph="ok-sign" />;
    }

    return (<PanelGroup>
      <Panel collapsible header={(<span>{glyph} {this.props.header}</span>)} bsStyle={bsStyle} eventKey="1" defaultExpanded={true}>
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
