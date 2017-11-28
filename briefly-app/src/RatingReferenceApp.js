import React, { Component } from 'react';
import {Button, Glyphicon, Panel} from 'react-bootstrap';
import update from 'immutability-helper';
import './EditingApp.css';
import Experiment from './Experiment.js'
import Document from './Document.js'
import LikertGroup from './LikertGroup.js'
import ExampleQuestionGroup from './ExampleQuestionGroup.js'

class App extends Experiment {
  constructor(props) {
    super(props);
    this.handleAnswersChanged = this.handleAnswersChanged.bind(this);
    this.updateInstruction = this.updateInstruction.bind(this);
  }

  title() {
    return (<p>Rate the short summary below</p>);
  }
  subtitle() {
    return null; //(<p><b>Correct grammatical errors, remove repeated text, etc.</b></p>);
  }

  updateInstruction(evt) {
    const value = evt;
    this.setState(state => update(state, {instructions: {$merge: value}}));
  }

  instructions() {
    return (
      <div>
      <p className="lead">
        <b>Before you proceed with the HIT, you will need to complete the tutorial below</b> (you only need to do this once though!).
      </p>

      <h3>General instructions</h3>
      <p>
        We'd like you to rate how good a short summary of a news article
        is by answering a few questions.
        <b>We explain each of these questions below with a brief quiz at
        the end of each section. You must correctly answer the quiz
        question to proceed.</b>
        In the actual task, we'll also provide a model summary for the
        same article to help provide reference for what should be a '5' on
        the questions.
      </p>

      <h3>Questions</h3>
      <ul>
        <li><b>How grammatical was the summary?</b>&nbsp;
          A good summary should have no spelling errors or obvious grammar
      errors (<i>"Bill Clinton was going to."</i>) that make the text
      difficult to read.&nbsp;
      <i>Rate a summary a <b>5</b> if it reads as fluently as something you might read in a newspaper.</i>&nbsp;
      <i>Rate it a <b>1</b> if you can not understand what is being said at all.</i>
      <ExampleQuestionGroup header="Examples/Quiz"
        name="ex-grammar"
        question="How grammatical was the summary?"
        entries={[
          ["Nine people tried to enter Syria illegally , according to local media .",
            4, "The sentence is 100% grammatical!"
          ], [
            "Yuka Ogata wanted to make make a point about the challenges working women face in Japan.",
            3, "Even though the sentence contains a repeated word that makes it ungrammatical, it's fairly easy to understand what it means.",
          ], ["Thousands of South Africans take to the streets of Durban to rally in Durban . # ▃ , # ▃ and # ▃ are some of the most popular . `` people listen to him , '' he says .",
            0, "We couldn't make any sense of this sentence either!",
          ]]}
        value={this.state.instructions}
        onChange={this.updateInstruction}
      />
        </li>
        <li><b>How redundant was the summary?</b>&nbsp;
          A good summary should not have any unnecessary repetition,
      which can arise if a sentence is repeated multiple times or uses
      full names (<i>"Bill Clinton"</i>) or long phrases (<i>"the Affordable Care Act"</i>) repeatedly instead of a
      pronoun (<i>"he"</i>) or short phrases (<i>"the law"</i>).&nbsp;
      <i>Rate a summary a <b>5</b> if it contains no repeated information even if it may be ungrammatical, etc.</i>&nbsp;
      <i>Rate it a <b>1</b> if it contains no information at all.</i>

        </li>
        <li><b>How often could you understand who/what was mentioned in the summary?</b>
          In a good summary, it should be easy to identify who or what
      pronouns (<i>"he"</i>) and noun phrases (<i>"the law"</i>) are referring to
      within the summary.
        </li>
        <li><b>How clear was the focus of the summary?</b>&nbsp;
          A good summary has a clear focus and sentences should only contain information that is related to the rest of the summary.
        </li>
        <li><b>How coherent was the summary?</b>&nbsp;
          A coherent summary should be well-structured in that it should
      not just be a heap of related information, but should build from
      sentence to sentence to a coherent body of information about a
      topic.
        </li>
      </ul>

      </div>
    );
  }

  initState(props) {
    let state = super.initState(props);
    state = update(state, {
      output: {$merge: {
        responses: {
          "grammar": undefined,
          "redundancy": undefined,
          "clarity": undefined,
          "focus": undefined,
          "coherence": undefined,
          },
        }},
    });
    state = update(state, {$merge: {instructions: {}}});

    return state;
  }

  handleAnswersChanged(evt) {
    const value = evt;
    this.setState(state => {
      state = update(state, {output: {responses: {$merge: value}}}); 
      if (Object.values(state.output.responses).every(x => x !== undefined)) {
        state = update(state, {canSubmit: {$set: true}});
      }
      return state;
    });
  }

  renderContents() {
    const questions = [
      ["grammar", 
          "How grammatical was the summary?",
          "Not at all",
          "Perfectly"],
      ["redundancy", 
        "How redunant was the summary?",
        "Very redundant",
        "Not redundant"],
      ["clarity", 
        "How often could you understand who/what was mentioned in the summary?",
        "Never",
        "Always"],
      ["focus", 
        "How clear was the focus of the summary?",
        "Not at all",
        "Perfectly"],
      ["coherence", 
        "How coherent was the summary?",
        "Not at all",
        "Perfectly"],
    ];

    return (<div>
        <div>
          <Document 
              id="text"
              title="Please read the summary below and rate it below"
              text={this.props.contents.text}
              editable={false}
              /> 
          <Document 
              id="text"
              title="Compare the above summary with this 'model' summary when answering the questions below"
              text={this.props.contents.reference}
              editable={false}
              /> 

        </div>
        <Panel header={<b>Please rate the above summary relative to the model summary on the following qualities</b>}>
          <LikertGroup name="responses" questions={questions} value={this.state.output.responses} onChange={this.handleAnswersChanged} />
        </Panel>
      </div>);
  }
}

App.defaultProps = {
  contents: {id:"", text: "This is a test sentence.", reference: "This is another sentence."},
  estimatedTime: 90,
  reward: 0.30,
}

export default App;
