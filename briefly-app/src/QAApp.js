import React, { Component } from 'react';
import {Button, ButtonGroup, Table, Glyphicon, Panel} from 'react-bootstrap';
import update from 'immutability-helper';
import './App.css';
import './QAApp.css';
import Experiment from './Experiment.js'
import Instructions from './Instructions.js'
import NaryAnswer from './NaryAnswer.js'
import QAPrompt from './QAPrompt.js'
import Example from './QAExample.js'

class App extends Experiment {
  constructor(props) {
    super(props);
    this.handleAnswersChanged = this.handleAnswersChanged.bind(this);
    this.updateInstructionAnswers = this.updateInstructionAnswers.bind(this);
  }

  title() {
    return (<p>Check answers to commonly asked questions</p>);
  }
  subtitle() {
    return null; //(<p><b>Correct grammatical errors, remove repeated text, etc.</b></p>);
  }

  updateInstructionAnswers(evt) {
    const value = evt;
    this.setState(state => update(state, {instructionAnswers: {$merge: value}}));
  }

  //instructionsVersion() {
  //  return '20180108';
  //}
  instructionsComplete() {
    return false;
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
        We'd like you to read a <dfn>response</dfn> that was given to a question
      asked online and judge if (a) it could be a <b>plausible</b> answer to
      the question and (b) if one of several excerpts provide <b>evidence that it is a correct answer</b>.
      </p>

      <h3>Judging plausibility</h3>
      <p>
      First, we'd like you identify if the response even makes sense for the question.
      For example, for the question <b>who said the quote by any means necessary</b>,
      &nbsp;<i>Malcom X</i> or <i>King Louis XVII</i> are both plausible
      answers, while <i>the pancreatic tissue</i> or <i>the Sun</i> are
      not. Now, try these examples:
      </p>

      <Example
        title="1. Judging plausibility"
        query="where are the submandibular lymph nodes located"
        answer="below the jaw"
        expected={({plausibility:true})}
        />

      <Example
        title="2. Judging plausibility"
        query="where are the submandibular lymph nodes located"
        answer="It is responsible for lymphatic drainage of the tongue, submaxillary (salivary) gland, lips, mouth, and conjunctiva."
        expected={({plausibility:false})}
        />

      <Example
        title="3. Judging plausibility"
        query="can you use a deactivated sim card again"
        answer="Once a SIM card retires, it can not be used again."
        expected={({plausibility:true})}
        />

      <h3>Evaluating evidence for the response</h3>
      <p>
      If the response is a plausible answer, we would like you to
      check whether or not it is a <i>correct answer</i> according to
      a few excerpted paragraphs.
      For each paragraph, we would like you to indicate if it provides
      evidence that the response is correct (<Glyphicon glyph="ok" />),
      incorrect (<Glyphicon glyph="remove" />), or that the paragraph
      isn't sufficient to tell us either which way (<Glyphicon glyph="minus" />).
      </p>

      <p>
      Here's an example for the question, <b>who said the quote by any means necessary</b> and response, <b>Malcom X</b>.
      The following paragraph tells us Malcom X is a <b>correct answer</b>:
      </p>
      <blockquote>
        <Glyphicon glyph="ok" />&nbsp;
        It entered the popular culture through a speech given by Malcolm X in the last year of his life.
        "We declare our right on this earth to be a man, ..., in this day, which we intend to bring into existence by any means necessary."
      </blockquote>

      <p>
      On the other hand, this paragraph doesn't tell us either which way (i.e. it is <b>neutral</b>):
      </p>
      <blockquote>
        <Glyphicon glyph="minus" />&nbsp;
        Malcolm X’s life changed dramatically in the first six months of 1964. In May he toured West Africa and made a pilgrimage to Mecca, returning as El Hajj Malik El-Shabazz.
      </blockquote>

      <p>
      Finally, this (fictional) paragraph tells us the response is a <b>wrong</b> answer:
      </p>
      <blockquote>
        <Glyphicon glyph="remove" />&nbsp;
        Though commonly attributed to Malcom X, the quote "By any means necessary" actually comes from a speech by Martin Luther King Jr.
      </blockquote>

      <p>
      Now you try:
      </p>
      <Example
        title="4. Evaluating evidence"
        query="where are the submandibular lymph nodes located"
        answer="below the jaw"
        passages={[
          {"passage_text": "Secondary infection of salivary glands from adjacent lymph nodes also occurs. These lymph nodes are the glands in the upper neck which often become tender during a common sore throat. Many of these lymph nodes are actually located on, within, and deep in the substance of the parotid gland, near the submandibular glands."},
          {"passage_text": "Submandibular lymph nodes are glands that are a part of the immune system and are located below the jaw. Submandibular lymph nodes consist of lymphatic tissues enclosed by a fibrous capsule."},
          {"passage_text": "When these lymph nodes enlarge through infection, you may have a red, painful swelling in the area of the parotid or submandibular glands. Lymph nodes also enlarge due to tumors and inflammation."},
        ]}
        expected={({plausibility:true, passages: [0, 1, 0]})}
        />

      <Example
        title="5. Evaluating evidence"
        query="can you use a deactivated sim card again"
        answer="yes"
        passages={[
          {"passage_text": "I got the same question, how can I have my prepaid sim card reactivated. I haven't used or recharged this sim card for about more than six months. I just bought a new mobile phone and when I turned it on it said the sim card needs to be activated. I hope I can use this sim card again. Thank you."},
          {"passage_text": "What is BAN? When I try to activate an used SIM, but deactivated, on the SAME account, it works."},
          {"passage_text": "Once a SIM card is deactivated it is dead. You will have to get a new SIM."},
        ]}
        expected={({plausibility:true, passages: [0, 1, -1]})}
        />

    </div>);
  }

  instructionsIsComplete() {
    return false;
  }

  initState(props) {
    let state = super.initState(props);
    state = update(state, {
      output: {$merge: {
        response: {
          plausibility: undefined,
          passages: props.contents.passages.map(_ => undefined),
          idx: 0,
        }
      }},
      instructionAnswers: {$set: []},
    });
    return state;
  }

  handleAnswersChanged(evt) {
    const valueChange = evt;
    this.setState(state => {
      state = update(state, {output: {response: QAPrompt.handleValueChanged(state.output.response, valueChange)}});
      const canSubmit = (state.output.response.plausibility === false) || (!state.output.response.passages.includes(undefined))
      if (state.canSubmit !== canSubmit) {
        state = update(state, {canSubmit: {$set: canSubmit}});
      }
      return state;
    });
  }

  renderContents() {
    return (<Panel id="content" header={<b>Please evaluate the <u>answer</u> to the following question</b>}>
      <QAPrompt 
        query={this.props.contents.query}
        answer={this.props.contents.answer}
        passages={this.props.contents.passages}
        value={this.state.output.response}
        onValueChanged={this.handleAnswersChanged}
      />
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
}

export default App;