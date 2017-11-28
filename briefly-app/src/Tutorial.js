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
        <p><b>Rate 5 if</b> {cat.example5}</p>
        <p><b>Rate 1 if</b> {cat.example1}</p>

        <ExampleQuestionGroup header="Examples/Quiz"
          name={"ex-" + key}
          question={cat.title}
          entries={cat.questions}
          value={this.props.value}
          onChange={this.props.onChange}
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
    example5: "Rate 5 if ...",
    example1: "Rate 1 if ...",
    questions: [
      ["prompt", 4, "explanation"],
    ],
  }},
  value: {category: undefined,},
  onChange: (value) => {},
}

export default Tutorial;
