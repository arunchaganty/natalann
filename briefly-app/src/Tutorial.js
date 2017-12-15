import React, { Component } from 'react';
import {Panel, PanelGroup} from 'react-bootstrap';
import ExampleQuestionGroup from './ExampleQuestionGroup.js'

class Tutorial extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let panels = Object.entries(this.props.contents).map(keycat  => {
      let [key,cat] = keycat;
      return (
      <Panel key={key} header={<b>{cat.title}</b>} collapsible defaultExpanded={true} eventKey={key}>
        {cat.definition}
        <p><b>Rate {this.props.scale} if</b> {cat.exampleMax}</p>
        <p><b>Rate 1 if</b> {cat.exampleMin}</p>

        <ExampleQuestionGroup header="Examples/Quiz"
          name={"ex-" + key}
          question={cat.title}
          entries={cat.questions}
          value={this.props.value}
          onChange={this.props.onChange}
          scale={this.props.scale}
        />
      </Panel>)});;


   return (<PanelGroup>
      {panels}
     </PanelGroup>);
  }
}
Tutorial.defaultProps = {
  contents: {category: {
    title: "Title.",
    definition: "A defintion",
    exampleMax: "Rate 5 if ...",
    exampleMin: "Rate 1 if ...",
    scale: 5,
    questions: [
      ["prompt", 4, "explanation"],
    ],
  }},
  value: {category: undefined,},
  onChange: (value) => {},
}

export default Tutorial;
