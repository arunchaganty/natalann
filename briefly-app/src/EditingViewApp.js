import React, { Component } from 'react';
import {Alert, Button, Glyphicon, FormGroup, FormControl} from 'react-bootstrap';
import axios from 'axios';
import './EditingApp.css';
import Document from './Document.js'
import EditableDocument from './EditableDocument.js'
import Instructions from './Instructions.js'
import Feedback from './Feedback.js'

class App extends Component {

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
    this.state = {
      id:"",
      display: {
        title: "",
        paragraphs: [],
      },
      time: 0.0,
      comments: [],
    },
    this.componentWillReceiveProps(props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.match) {
      let path = this.props.match.params.path;
      axios.get("/" + path)
        .then(res => {
          this.setState(res.data);
        });
    } else if (nextProps.contents) {
      this.setState(nextProps.contents);
    }
  }


  renderUndo() {
    return <Button bsSize="large" bsStyle="warning" ><Glyphicon glyph="backward"/> Undo</Button>;
  }

  renderSubmit() {
    return <Button type='submit' bsSize="large" bsStyle="success"><Glyphicon glyph="ok"/> Submit</Button>
  }

  renderTime() {
    let minTime = this.props.estimatedTime * 0.6;
    let maxTime = this.props.estimatedTime * 1.4;
    let minMinutes = Math.floor(minTime/60);
    let maxMinutes = Math.floor(maxTime/60);
    return <Alert bsStyle="info"><b>Estimated time:</b> {minMinutes}:{Math.floor(minTime%60)} - {maxMinutes}:{Math.floor(maxTime%60)}</Alert>;
  }
  renderCost() {
    let price = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});
    return <Alert bsStyle="info"><b>Reward:</b> {price.format(this.props.reward)} </Alert>;
  }

  renderFeedback() {
    let commentsLi = [];
    for (let i = 0; i < this.state.comments.length; i++) {
      let suggestion = this.state.comments[i];
      commentsLi.push(<li key={i}>{suggestion}</li>);
    }
    return (<ul>
              <li>Average time: {this.state.time} seconds</li>
      <li><b>Comments</b><ul>
                  {commentsLi}
        </ul></li>
      </ul>);
  }

  render() {
    const mutable = false;
    let selections = [[]];
    for (let i = 0; i < this.state.display.paragraphs.length; i++) selections.push([]);

    return (
      <div className="App" onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} >
        <div className="container">
          <div className="row header">
              <h2>{this.title()}</h2>
              <h2><small>{this.subtitle()}</small></h2>
          </div>
          <div className="row">
            <div className="flexbox">
              <Instructions contents={this.instructions()} />
              {this.renderTime()}
              {this.renderCost()}
              {this.renderUndo()}
              {this.renderSubmit()}
            </div>
          </div>
          <div className="row">
            <Document
                title="Please edit the text below to make it more readable"
                contents={this.state.display}
                selections={selections}
                /> 
          </div>
          <div className="row">
            {this.renderFeedback()}
          </div>
        </div>
      </div>);
  }
}

App.defaultProps = {
  contents: {id:"",
    display: {
      title: "",
      paragraphs: ["This is text.", "This is some text.", "This is a text."],
      selections: [[], [], [],]
    },
    time: 15.7,
    comments: [
      "Eh, ok.",
    ]
    },
  estimatedTime: 20,
  reward: 0.30,
}

export default App;
