import React, { Component } from 'react';
import {Button, ButtonGroup, Table, Glyphicon, Panel} from 'react-bootstrap';
import update from 'immutability-helper';
import './App.css';
import './QAApp.css';
import Experiment from './Experiment.js'
import Document from './Document.js'
import LikertGroup from './LikertGroup.js'
import Tutorial from './Tutorial.js'
import Instructions from './Instructions.js'
import BinaryAnswer from './BinaryAnswer.js'
import NaryAnswer from './NaryAnswer.js'

const PlausibilityOptions = [{
    style: "success",
    glyph: "ok",
    tooltip: "The answer seems reasonable for the question.",
    value: true},{
    style: "danger",
    glyph: "remove",
    tooltip: "The answer doesn't even make sense for the question (e.g. 'umbrella' for 'Who founded General Motors?')",
    value: false}
];

const EntailmentOptions = [{
    style: "success",
    glyph: "ok",
    tooltip: "The answer is correct according to this passage.",
    value: 1},{
    style: "warning",
    glyph: "minus",
    tooltip: "The passage doesn't help answer the question",
    value: 0},{
    style: "danger",
    glyph: "remove",
    tooltip: "The answer is incorrect according to this passage.",
    value: -1}];

class App extends Experiment {
  constructor(props) {
    super(props);
    this.handleAnswersChanged = this.handleAnswersChanged.bind(this);
    //this.updateInstructionAnswers = this.updateInstructionAnswers.bind(this);
  }

  title() {
    return (<p>Check answers to commonly asked questions</p>);
  }
  subtitle() {
    return null; //(<p><b>Correct grammatical errors, remove repeated text, etc.</b></p>);
  }

  instructions() {
    return (<div>Instructions</div>);
    // let lede;
    // if (this.instructionsIsComplete()) {
    //   lede = undefined;
    // } else {
    //   lede = (<p className="lead">
    //     <b>Before you proceed with the HIT, you will need to complete the tutorial below</b> (you only need to do this once though!).
    //     The tutorial should take about <i>5-6 minutes to complete</i> and you will get <b>a (one-time) $0.75 bonus</b> for completing it.
    //   </p>);
    // }
    // return (<div>
    //   {lede}

    //   <h3>General instructions</h3>
    //   <p>
    //     We'd like you to rate how good a short summary of a news article
    //     is by answering a few questions.&nbsp;
    //     <b>We will explain each of these questions below with a brief quiz at
    //     the end of each section. You must correctly answer the quiz
    //     question to proceed.</b>&nbsp;
    //   </p>

    //   <h3>Question definitions (and quiz!)</h3>
    //   <Tutorial
    //       contents={App.tutorial}
    //       value={this.state.instructionAnswers}
    //       onChange={this.updateInstructionAnswers}
    //       scale={3}
    //   />

    //   <h3>Other details</h3>
    //   <ul>
    //     <li><b>Rejection policy:</b>&nbsp;
    //       We understand that this is a subjective task and that it's
    //       possible to have a different opinion that those of other
    //       annotators. Unfortunately, we have found a lot of spam answers
    //       on this task and we will manually check a random sample of
    //       your responses before we decide whether or
    //       not to reject your work.
    //     </li>
    //   </ul>
    // </div>);
  }

  initState(props) {
    let state = super.initState(props);
    state = update(state, {
      output: {$merge: {
        response: {
          plausibility: undefined,
          passages: props.contents.passages.map(_ => undefined)
        }
      }},
      passageIdx: {$set: 0},
    });
    return state;
  }

  handleAnswersChanged(evt) {
    if (evt.plausibility !== undefined) {
      const value = evt.plausibility;
      this.setState(state => update(state, {
        output: {response: {plausibility: {$set: value}}},
        canSubmit: {$set: value === false},
      }));
    } else if (evt.passageIdx !== undefined) {
      const idx = evt.passageIdx;
      const value = evt.response;
      this.setState((state, props) => {
          const nextIdx = state.output.response.passages.findIndex((v, i) => i !== state.passageIdx && v === undefined);
          return update(state, {
          output: {response: {passages: {$splice: [[idx, 1, value]]}}},
          passageIdx: {$set: (nextIdx === -1) ? state.passageIdx : nextIdx },
          canSubmit: {$set: nextIdx === -1},
        })
      });
    } else if (evt.moveTo !== undefined) {
      const value = evt.moveTo;
      this.setState(state => update(state, {passageIdx: {$set: value}}));
    } else {
      console.assert("Invalid event for handleAnswersChanged.");
    }
  }

  _answerProgress() {
    const self = this;
    const styles = new Map([[1, "success"], [0, "warning"], [-1, "danger"]]);
    const glyphs = new Map([[1, "ok-sign"], [0, "minus-sign"], [-1, "remove-sign"]]);
    let buttons = this.state.output.response.passages.map((p, i) => {
      const active = (self.state.passageIdx === i);
      return (<Button key={i} onClick={() => self.handleAnswersChanged({moveTo: i})} bsStyle={styles.get(p)} active={active}><Glyphicon glyph={glyphs.get(p)} /></Button>)
    });

    return (<ButtonGroup className="answers">
      {buttons}
      </ButtonGroup>);
  }

  renderContents() {

    let passageAnswer = null;
    if (this.state.output.response.plausibility === true) {
      const currentPassage = this.props.contents.passages[this.state.passageIdx].passage_text;
      const passageValue = this.state.output.response.passages[this.state.passageIdx];

      passageAnswer = (<tr>
        <td className="lead">Can you infer the answer to be (in)correct from the following passage?
          <hr/>
          {this._answerProgress()}
        </td>
        <td>
        <blockquote>
        {currentPassage}
        </blockquote>
        </td>
        <td>
        <NaryAnswer
        options={EntailmentOptions}
        value={passageValue}
        onValueChanged={resp => this.handleAnswersChanged({passageIdx: this.state.passageIdx, response: resp})}
        />
        </td>
      </tr>);
    }

    return (<Panel id="content" header={<b>Please evaluate the <u>answer</u> to the following question</b>}>
      <Table>
        <tbody>
      <tr>
      <td width="20%" className="lead">For the question,</td>
      <td width="65%">{this.props.contents.query}</td>
      <td width="15%"></td>
      </tr>
      <tr>
      <td className="lead">Is this a <dfn><abbr title="An implausible answer is often incompatible be the question, e.g. 'Cory Booker' is an implausible answer for 'What is the color of the sky?'.">plausible</abbr></dfn> answer to the question?</td>
      <td>{this.props.contents.answer}</td>
      <td>
        <NaryAnswer
          options={PlausibilityOptions}
          value={this.state.output.response.plausibility}
          onValueChanged={resp => this.handleAnswersChanged({plausibility:resp})}
        />
      </td>
      </tr>
      {passageAnswer}
        </tbody>
      </Table>
      </Panel>);
  }
}

App.defaultProps = {
  contents: {
    'query': 'who said the quote by any means necessary',
    'query_id': 18482,
    'query_type': 'person',
    'answers': ['Malcolm X'],
    'answer': 'Malcolm X',
    'passages': [{'is_selected': 0,
      'passage_text': "How meaningful were such charges when they came from whites who brought Malcolm's ancestors to America in chains, then beat and lynched them with impunity? Faced with such crimes, he felt black Americans were entitled to secure their rights by any means necessary -- up to and including the use of violence.",
      'url': 'http://www.pbs.org/wgbh/amex/malcolmx/sfeature/sf_means.html'},
      {'is_selected': 0,
        'passage_text': 'Malcolm X’s life changed dramatically in the first six months of 1964. On March 8, he left the Nation of Islam. In May he toured West Africa and made a pilgrimage to Mecca, returning as El Hajj Malik El-Shabazz. While in Ghana in May, he decided to form the Organization of Afro-American Unity (OAAU).',
        'url': 'http://www.blackpast.org/1964-malcolm-x-s-speech-founding-rally-organization-afro-american-unity'},
      {'is_selected': 0,
        'passage_text': 'By any means necessary is a translation of a phrase used by the French intellectual Jean-Paul Sartre in his play Dirty Hands. It entered the popular civil rights culture through a speech given by Malcolm X at the Organization of Afro-American Unity Founding Rally on June 28, 1964.',
        'url': 'https://en.wikipedia.org/wiki/By_any_means_necessary'},
      {'is_selected': 0,
        'passage_text': "Unknown quotes. On my grind, I'm out to get it by any means necessary. 3 up, 3 down. favorite. Malcolm X quotes. God quotes. The Negro revolution is controlled by foxy white liberals, by the Government itself. But the Black Revolution is controlled only by God.",
        'url': 'http://www.searchquotes.com/search/Malcolm_X_By_Any_Means_Necessary/'},
      {'is_selected': 0,
        'passage_text': "1 of 5 stars 2 of 5 stars 3 of 5 stars 4 of 5 stars 5 of 5 stars. By Any Means Necessary Quotes (showing 1-1 of 1). “You're not to be so blind with patriotism that you can't face reality. Wrong is wrong, no matter who does it or says it.”. ― Malcolm X, By Any Means Necessary.",
        'url': 'http://www.goodreads.com/work/quotes/180979-by-any-means-necessary'},
      {'is_selected': 1,
        'passage_text': '“By any means necessary.”. Malcolm X quotes (American black militant leader who articulated concepts of race pride and black nationalism in the early 1960s, 1925-1965).',
        'url': 'http://thinkexist.com/quotation/by-any-means-necessary/557539.html'},
      {'is_selected': 0,
        'passage_text': "There's a popular saying often repeated by Christians. It has found new life on Facebook and Twitter. Maybe you have even uttered these words, commonly at tributed to Francis of Assisi: Preach the gospel. Use words if necessary..",
        'url': 'http://www.christianpost.com/news/preach-the-gospel-and-since-its-necessary-use-words-77231/'}],
  },
  estimatedTime: 300,
  reward: 1.25,
  instructionsVersion: '20180107',
}

export default App;
