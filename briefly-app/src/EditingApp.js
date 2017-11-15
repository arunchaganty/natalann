import React, { Component } from 'react';
import {Button, Glyphicon} from 'react-bootstrap';
import update from 'immutability-helper';
import './EditingApp.css';
import Experiment from './Experiment.js'
import EditableDocument from './EditableDocument.js'
import QuestionGroup from './QuestionGroup.js'

class App extends Experiment {
  title() {
    return (<p>Edit the short paragraph below</p>);
  }
  subtitle() {
    return (<p><b>Correct grammatical errors, remove repeated text, etc.</b></p>);
  }
  instructions() {
    return (
      <div>
      <p className="lead">We'd like you to edit a given paragraph to
      make it <u>grammatically correct</u>, <u>more readable</u>,
      while <u>preserving the original meaning and spirit</u> where
      possible.</p>

      <p>
      For example, the passage:
      <blockquote>
      A sheriff's deputy is accused of shooting a man in the bahamas for
      a family vacation. He is accused of shooting a man in the bahamas
      for a family vacation. He has apologized to the harris family.
      </blockquote>
      could be edited to remove the redundant second line:
      <blockquote>
      A sheriff's deputy is accused of shooting a man in the bahamas for
      a family vacation. He has apologized to the harris family.
      </blockquote>
      </p>

      <p>It's also possible that some parts of the text make no sense in the context of the sentence: you can delete these parts. For example,
        <blockquote>
        <s>"The Tonight Show starring Jimmy Fallon," was a guest on "The Tonight Show starring Jimmy Fallon hits hot 100 with 'ew!,' featuring will.i.am.</s>
        </blockquote>
      </p>


      <h3>General guidelines</h3>
      <ul>
        <li>
          It's possible that the given sentence is grammatical and does
        not need any edits in which case you can submit the text as is
        after a few seconds.
        </li>
        <li>If you want to undo your changes and return to the original text, click the <Button bsStyle="warning"><Glyphicon glyph="backward" /> Undo</Button> button.</li>
      </ul>
      </div>
    );
  }

  constructor(props) {
    super(props);

    this.templates = [
      "Can you make sense of the sentence above?",
      "Can you identify any clear, fixable errors?",
      "Ok, can you please correct these errors?",
      "Can you rate how significant your changes were?",
    ];
    this.state.questions.push(this.templates[0]);
    this.state.output.responses.push(undefined);

    this.updateSubmittable = this.updateSubmittable.bind(this);
    this.handleAnswersChanged = this.handleAnswersChanged.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
  }

  initState(props) {
    let state = super.initState(props);
    state = update(state, {output: {$merge: {
        text: props.contents.text || "",
        responses: [],
      }
    }});
    state = update(state, {$merge: {
      originalText: props.contents.text || "",
      questions: [],
      editable: false,
    }});

    return state;
  }

  componentDidMount() {
    super.componentDidMount();
    this.submittableId = window.setTimeout(this.updateSubmittable, 2000);
  }

  componentWillUnmount() {
    if (this.submittableId !== undefined) {
      window.clearInterval(this.submittableId);
      this.submittableId = undefined;
    }
  }

  updateSubmittable(evt) {
    this.setState({"canSubmit": true});
  }

  handleTextChange(evt) {
    const newText = evt.target.value; 
    this.setState(state => update(state, {output: {text: {$set: newText}}}));
  }

  handleAnswersChanged(evt) {
    const self = this;
    const questionIdx = evt.target;
    const answer = evt.value;
    this.setState(state => {
      // First, set the response.
      console.assert(questionIdx < state.output.responses.length);
      // Nothing changed, move on.
      if (state.output.responses[questionIdx] === answer) {
        return;
      }

      let newState = update(state, {output: {responses: {$splice:[[questionIdx, 1, answer]]}}});
      
      // Now, maybe we'll need to update the responses.
      if (questionIdx === 0) { // First question.
        if (state.questions.length === 1) { // Ah, add another question.
          newState = update(newState, {questions: {$push: [self.templates[1]]}});
          newState = update(newState, {output: {responses: {$push: [undefined]}}});
        }
      } else if (questionIdx === 1) { // First question.
        if (questionIdx) { // Ok, make sure that the questions is only 1 long.
          newState = update(newState, {editable: {$set: true}});
        } else { // Ah, add another question.
          newState = update(newState, {editable: {$set: false}});
          newState = update(newState, {output: {text: {$set: state.originalText}}});
        }
      }
      console.log(newState);
      return newState;
    });
  }

  renderContents() {
    const mutable = false;

    return (<div>
        <div>
          <EditableDocument 
              id="edit-document"
              title="Please read the text below and answer the questions below"
              text={this.state.output.text}
              onTextChange={this.handleTextChange}
              editable={this.state.editable}
              /> 
        </div>
        <div>
            <QuestionGroup 
              title="Please answer these questions"
              questions={this.state.questions}
              responses={this.state.output.responses}
              onChange={this.handleAnswersChanged}
            />
        </div>
      </div>);
  }
}

App.defaultProps = {
  contents: {id:"", text: "This is a test sentence."},
  estimatedTime: 20,
  reward: 0.30,
}

export default App;
