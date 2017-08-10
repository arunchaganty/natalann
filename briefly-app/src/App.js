import React, { Component } from 'react';
import './App.css';
import Document from './Document.js'
import {Alert, Button, Glyphicon} from 'react-bootstrap';

class App extends Component {
  title = "Highlight the most important portions of this article";
  subtitle = "";
  articleTitle = "Please highlight between 100-200 words in the article below that you think capture its most important aspects.";

  constructor(props) {
    super(props);
    this.state = this.initState(props);
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  initState(props) {
    let ret = {
      "selections": [],
      "wordCount": 0,
    }

    ret.selections.push([]);
    for (let i = 0; i < props.contents.paragraphs.length; i++) {
      ret.selections.push([]);
    }
    return ret;
  }

  handleSelectionChange(selections) {
    console.log(selections);

    // get word count.
    let wordCount = 0;
    for (let i = 0; i < selections.length; i++) {
      if (selections[i].length > 0) {
        let txt = (i === 0) ? this.props.contents.title : this.props.contents.paragraphs[i-1];
        for (let j = 0; j < selections[i].length; j++) {
          let [start, end] = selections[i][j];
          let segment = txt.substring(start, end);
          let ix = 0; 
          while (ix !== -1) {
            wordCount++;
            ix = segment.indexOf(' ', ix+1);
          }
        }
      }
    }
    console.log(wordCount);

    this.setState({
      "selections": selections,
      "wordCount": wordCount,
    });
  }

  renderProgress() {
    console.log(this.state);
    let bsStyle;
    if (this.state.wordCount < this.props.minWordCount) {
      bsStyle = 'warning';
    } else if (this.state.wordCount < this.props.maxWordCount) {
      bsStyle = 'success';
    } else {
      bsStyle = 'danger';
    }

    return <Alert bsStyle={bsStyle}>{this.state.wordCount} words</Alert>;
  }

  renderInstructions() {
    return <Button bsSize="large" bsStyle="primary"><Glyphicon glyph="info-sign" /> Instructions</Button>;
  }

  renderSubmit() {
    let notDone = (this.state.wordCount < this.props.minWordCount) || (this.state.wordCount > this.props.maxWordCount);
    return <Button type='submit' disabled={notDone} bsSize="large" bsStyle="success"><Glyphicon glyph="ok"/> Submit</Button>
  }

  renderTime() {
    let minTime = this.props.estimatedTime * 0.6;
    let maxTime = this.props.estimatedTime * 1.4;
    let minMinutes = Math.floor(minTime/60);
    let maxMinutes = Math.floor(maxTime/60);
    return <Alert bsStyle="info"><b>Estimated time:</b> {minMinutes}:{minTime%60} - {maxMinutes}:{maxTime%60}</Alert>;
  }
  renderCost() {
    let price = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});
    return <Alert bsStyle="info"><b>Reward:</b> {price.format(this.props.reward)} </Alert>;
  }

  handleSubmit(evt) {
    console.log(evt);
    evt.preventDefault();
  }

  render() {
    return (
      <div className="App">
        <div className="container">
          <div className="row header">
              <h2>{this.title}</h2>
              <h2><small>{this.subtitle}</small></h2>
          </div>
          <div className="row">
            <form onSubmit={this.handleSubmit} method='post' action=''>
              <input type="hidden" name="selections" value={JSON.stringify(this.state.selections)} />
              <div className="flexbox">
                {this.renderInstructions()}
                {this.renderTime()}
                {this.renderCost()}
                {this.renderProgress()}
                {this.renderSubmit()}
              </div>
            </form>
          </div>
          <div className="row">
            <Document 
                id="document"
                title={this.articleTitle}
                contents={this.props.contents}
                selections={this.state.selections}
                onSelectionChanged={this.handleSelectionChange}
                /> 
          </div>
      </div>
      </div>
    );
  }
}

App.defaultProps = {
  contents: {title: "", paragraphs: []},
  estimatedTime: 60,
  reward: 0.70,
  minWordCount: 50,
  maxWordCount: 100,
}


export default App;
