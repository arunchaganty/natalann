import React, { Component } from 'react';
import {Button, Glyphicon, Panel} from 'react-bootstrap';
import update from 'immutability-helper';
import './EditingApp.css';
import RatingApp from './RatingApp.js'
import Document from './Document.js'
import LikertGroup from './LikertGroup.js'
import Tutorial from './Tutorial.js'
import Instructions from './Instructions.js'

class App extends RatingApp {
  constructor(props) {
    super(props);
  }

  instructions() {
    let lede;
    if (this.instructionsIsComplete()) {
      lede = undefined;
    } else {
      lede = (<p className="lead">
        <b>Before you proceed with the HIT, you will need to complete the tutorial below</b> (you only need to do this once though!).
        The tutorial should take about <i>5-6 minutes to complete</i> and you will get <b>a (one-time) $0.75 bonus</b> for completing it.
      </p>);
    }
    return (<div>
      {lede}

      <h3>General instructions</h3>
      <p>
        We'd like you to rate how good a short summary of a news article
        is by answering a few questions.&nbsp;
        <b>We will explain each of these questions below with a brief quiz at
        the end of each section. You must correctly answer the quiz
        question to proceed.</b>&nbsp;
        In the actual task, we'll also provide a model summary for the
        same article to help provide reference for what a '5' should
      look like.
      </p>

      <h3>Question definitions (and quiz!)</h3>
      <Tutorial
          contents={RatingApp.tutorial}
          value={this.state.instructionAnswers}
          onChange={this.updateInstructionAnswers}
      />

      <h3>Other details</h3>
      <ul>
        <li><b>Rejection policy:</b>&nbsp;
          We understand that this is a subjective task and that it's
          possible to have a different opinion that those of other
          annotators. However, if we find your answers to consistently
          differ from the consensus opinion or fail attention checks, we will
          manually review your responses and make our best judgement of whether or
          not to reject your work.
        </li>
      </ul>
    </div>);
  }

  renderContents() {
    return (<div>
        <div>
          <Document 
              bsStyle="primary"
              id="text"
              title="Please read the summary below and rate it below"
              text={this.props.contents[this.state.currentIdx].text}
              editable={false}
              /> 
          <Document 
              id="text"
              title="Compare the above summary with this 'model' summary when answering the questions below"
              text={this.props.contents[this.state.currentIdx].reference}
              editable={false}
              /> 

        </div>
        <Panel header={<b>Please rate the above summary relative to the model summary on the following qualities</b>}>
          <LikertGroup name="responses" questions={RatingApp.questions} value={this.state.output.responses[this.state.currentIdx]} onChange={this.handleAnswersChanged} />
        </Panel>
      </div>);
  }
}

App.defaultProps = {
  contents: [
    {id:"", text: "This is test sentence 1.", reference: "This is another sentence 1."},
    {id:"", text: "This is test sentence 2.", reference: "This is another sentence 2."},
    {id:"", text: "This is test sentence 3.", reference: "This is another sentence 3."},
  ],
  estimatedTime: 300,
  reward: 1.25,
}

export default App;
