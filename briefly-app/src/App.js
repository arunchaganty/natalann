import React, { Component } from 'react';
import './App.css';
import Document from './Document.js'
import {Alert, Button, Glyphicon} from 'react-bootstrap';

class App extends Component {
  title = "Highlight the most important portions of this article";
  subtitle = "";

  constructor(props) {
    super(props);
    this.state = this.initState(props);
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    if (document.forms.length > 0) {
      let form = document.forms[0];
      form.addEventListener("onsubmit", this.handleSubmit);
    }
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

  getWordCount(selections) {
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
    return wordCount;
  }

  handleSelectionChange(selections) {
    this.setState({
      "selections": selections,
      "wordCount": this.getWordCount(selections),
    });
  }

  handleSubmit(evt) {
    let ret = JSON.parse(this._output.value);
    let wordCount = this.getWordCount(ret);
    console.assert(ret.length === this.props.contents.paragraphs.length+1);
    console.assert(wordCount >= this.props.minWordCount && wordCount <= this.props.maxWordCount);

    if (ret.length === this.props.contents.paragraphs.length+1 &&
          (wordCount >= this.props.minWordCount && wordCount <= this.props.maxWordCount)) {
      return true;
    } else {
      evt.preventDefault();
      return false;
    }
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

  render() {
    let articleTitle = "Please highlight between " + this.props.minWordCount + "-" + this.props.maxWordCount + " words in the article below that you think capture its most important aspects.";

    return (
      <div className="App">
        <div className="container">
          <div className="row header">
              <h2>{this.title}</h2>
              <h2><small>{this.subtitle}</small></h2>
          </div>
          <div className="row">
            <input ref={(elem) => {this._output = elem}} type="hidden" name="selections" value={JSON.stringify(this.state.selections)} />
            <div className="flexbox">
              {this.renderInstructions()}
              {this.renderTime()}
              {this.renderCost()}
              {this.renderProgress()}
              {this.renderSubmit()}
            </div>
          </div>
          <div className="row">
            <Document 
                id="document"
                title={articleTitle}
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
