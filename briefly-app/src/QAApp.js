import React, { Component } from 'react';
import {Label, Button, ButtonGroup, Table, Glyphicon, Panel, Well} from 'react-bootstrap';
import update from 'immutability-helper';
import Experiment from './Experiment.js'
import NaryAnswer from './NaryAnswer.js'
import QAPrompt from './QAPrompt.js'
import SegmentList from './SegmentList';

import './QAApp.css';

const BONUS_VALUE = '0.75';

class App extends Experiment {
  constructor(props) {
    super(props);
    this.handleAnswersChanged = this.handleAnswersChanged.bind(this);
  }

  title() {
    return (<p>Check answers to commonly asked questions</p>);
  }
  subtitle() {
    return null; //(<p><b>Correct grammatical errors, remove repeated text, etc.</b></p>);
  }

  instructionsVersion() {
    return '20180124';
  }

  instructions() {
    return (<InstructionContents
      bonus={BONUS_VALUE}
      isFirstTime={this.state.firstView}
      editable={!this.state.instructionsComplete}
      onValueChanged={(val) => this.setState({instructionsComplete: val})}
      />);
  }

  initState(props) {
    let state = super.initState(props);
    state = update(state, {
      output: {$merge: {
        response: QAPrompt.initialValue(props.contents.passages),
        PayBonus: state.firstView ? BONUS_VALUE : 0,
      }},
    });

    if (props._output) {
      state = update(state, {
        output: {$merge: props._output},
        canSubmit: {$set: this._canSubmit(props._output.response)},
      });
    }

    return state;
  }

  _canSubmit(response) {
    return !response.plausibility || response.passages.every((_,i) => QAPrompt.getStatus(response, i) === "complete");
  }

  handleAnswersChanged(evt) {
    const valueChange = evt;
    this.setState(state => {
      state = update(state, {output: {response: QAPrompt.handleValueChanged(state.output.response, valueChange)}});
      const canSubmit = this._canSubmit(state.output.response);
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
  estimatedTime: 120,
  reward: 0.40,
}

/***
 * Renders a document within a div.
 */
class Example extends Component {
  constructor(props) {
    super(props);

    this.state = (this.props.editable) ? QAPrompt.initialValue(props.passages)
      : {
        plausibility: this.props.expected.plausibility,
        passages: this.props.expected.passages || [],
        selections: this.props.expected.selections || [],
        confirmations: this.props.expected.confirmations || [],
        idx: 0,
      };

    this.handleValueChanged = this.handleValueChanged.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (this.props !== nextProps) || (this.state !== nextState);
  }

  handleValueChanged(evt) {
    const valueChange = evt;
    // Check here -- don't let them change if this is incorrect?
    if (this.props.editable || valueChange.moveTo !== undefined) {
      this.setState(state => update(state, QAPrompt.handleValueChanged(state, valueChange)),
        () => {
          let [status, idx] = this.checkAnswer();
          let ret = (status === "correct") ? true : (status === "wrong") ? false : undefined;
          this.props.onChanged(ret);
        }
      );
    }
  }

  checkAnswer() {
    const S = this.state;
    const E = this.props.expected;

    if (S.plausibility === undefined) {
      return ["incomplete", undefined];
    } else if (S.plausibility !== E.plausibility) {
      return ["wrong", undefined];
    } else if (S.passages.length > 0) { // passage-based checks.
      // Incorrect passage judgement.
      let idx;

      idx = S.passages.findIndex((p,i) => p !== undefined && p !== E.passages[i]);
      if (idx > -1) {
        return ["wrong-passage", idx]; // say things are false early.
      } 
      
      idx = S.selections.findIndex((p,i) => p !== undefined && S.passages[i] !== undefined && E.selections[i].length > 0 && p.length === 0)
      if (idx > -1) {
        return ["missing-highlight", idx];
      }
      
      idx = S.selections.findIndex((p,i) => p !== undefined && S.passages[i] !== undefined && E.selections[i].length > 0 && SegmentList.jaccard(p, E.selections[i]) < 0.01);
      if (idx > -1) {
        return ["wrong-highlight", idx];
      } 
      idx = S.selections.findIndex((p,i) => p !== undefined && S.passages[i] !== undefined && E.selections[i].length > 0 && SegmentList.jaccard(p, E.selections[i]) < 0.3);
      if (idx > -1) {
        return ["poor-highlight", idx];
      }

      idx = S.passages.findIndex((p,i) => p !== undefined && S.confirmations[i] !== E.confirmations[i]);
      if (idx > -1) {
        return ["missing-confirmation", idx]; // say things are false early.
      } 

      idx = S.passages.findIndex(p => p === undefined);
      if (idx > -1) {
        return ["incomplete", idx];
      }
    }

    return ["correct", undefined];
  }

  renderWell(status, idx) {
    // TODO: Report which should be fixed.
    const bsStyle = (status === "incomplete") ? "primary" : (status === "correct") ? "success" : "danger";
    let idxIndicator = (idx !== undefined) ? "passage number " + (idx+1) : "your plausibility response" 
    const well = 
      (status === "correct") ? (<span><b>That's right!</b> {this.props.successPrompt}</span>)
      : (status === "wrong") ? (<span><b>Hmm... something doesn't seem quite right with your plausibility response.</b> {this.props.wrongPrompt}</span>)
      : (status === "wrong-passage") ? (<span><b>Hmm... something doesn't seem quite right with how you rated {idxIndicator}.</b> {this.props.wrongPrompt}</span>)
      : (status === "wrong-highlight") ? (<span><b>Hmm... something doesn't seem quite right with your highlights for {idxIndicator}.</b> {this.props.wrongPrompt}</span>)
      : (status === "poor-highlight") ? (<span><b>Hmm... the highlighted region for {idxIndicator} could be improved.</b></span>)
      : (status === "missing-highlight") ? (<span><b>Please highlight a region in the text for {idxIndicator} that justifies your response.</b></span>)
      : (status === "missing-confirmation") ? (<span><b>Please confirm your response for {idxIndicator} to continue.</b></span>)
      : undefined;

    return well && (<Well bsStyle={bsStyle}>{well}</Well>);
  }

  render() {
    const title = this.props.title && (<h3><b>{this.props.title}</b></h3>);
    const [status, idx] = this.checkAnswer();
    const bsStyle = (status === "incomplete") ? "primary" : (status === "correct") ? "success" : "danger";

    return (
      <Panel header={title} bsStyle={bsStyle}>
        <p>{this.props.leadUp}</p>
        <QAPrompt
          query={this.props.query}
          answer={this.props.answer}
          passages={this.props.passages}
          value={this.state}
          onValueChanged={this.handleValueChanged}
          />
        {this.renderWell(status, idx)}
      </Panel>
    );
  }
}

Example.defaultProps = {
  id: "#example",
  title: "#. Description of example.",
  query: "where are the submandibular lymph nodes located",
  answer: "below the jaw",
  passages: [],
  selections: [],
  expected: {plausibility: true},
  editable: true,
  onChanged: () => {},
  successPrompt: "",
  wrongPrompt: "",
}

class InstructionContents extends Component {
  constructor(props) {
    super(props);

    this.state = this.initState(props);
    this.handleValueChanged = this.handleValueChanged.bind(this);
  }

  INSTRUCTION_KEY = {
    "plausibility-1": true, 
    "plausibility-2": true, 
    "plausibility-3": true, 
    "plausibility-4": true, 
    "plausibility-5": true, 
    "judgement-1": true, 
    "judgement-2": true, 
    "judgement-3": true, 
  };

  initState(props) {
    if (props.isFirstTime) {
      return {};
    } else  {
      return this.INSTRUCTION_KEY;
    }
  }

  handleValueChanged(update_) {
    this.setState(update_, () => Object.keys(this.INSTRUCTION_KEY).every(k => this.state[k]) && this.props.onValueChanged(true));
  }

  render() {
    let lede = (this.props.isFirstTime)
        ?  (<p>
          <b>Before you proceed with the HIT, you must complete the tutorial below</b> (you only need to do this once though!).
          The tutorial should take about <i>5 minutes to complete</i> and you will get <b>a (one-time) ${this.props.bonus} bonus</b> for completing it.
          </p>)
        : undefined;

  return (<div>
    <h3><Label bsStyle="primary">UPDATES</Label></h3>
    <ul>
    <li> <b>We've made it easier to pass the tutorial</b> and <b>added more specific feedback</b> to help guide you to the right answer this time. </li>
    <li>As you complete more HITs, <b>we will compare your work with those of your peers</b> and <b>notify you if we find that it disagrees a lot</b>.</li>
    <li><b>The most common mistake is reporting an answer to be not plausible when it is, so please read carefully!</b> </li>
    </ul>

      {lede}

      <h3>General instructions</h3>
      <p>
      We'd like you to read a <dfn>response</dfn> that was given to a question
      asked online and judge if (a) it could be a <b>plausible</b> answer to
      the question and (b) if one of several excerpts provide <b>evidence that it is a correct answer</b>.
      </p>

      <h3>Judging question plausibility</h3>
      <p>
      Sometimes <b>questions asked online are not staightforward</b>, so
      we'd first like you to <b>identify if you can understand the
      question</b>; a question like "<i>cost
      starwars toy</i>" isn't grammatical, but it's pretty evident
      what is being asked.
      On the other hand, "<i>green eggs and ham</i>" is more ambiguous
      but makes sense given the answer "<i>A children's book written by
      Dr. Seuss and first published in 1960</i>".
      Most questions are reasonable.
      </p>

      <Example
      title="1. Judging question plausibility"
      query="where are the submandibular lymph nodes located"
      answer="below the jaw"
      passages={[]}
      expected={({plausibility:true, passages:[]})}
      onChanged={(evt) => this.handleValueChanged({"plausibility-1": evt})}
      editable={this.props.editable}
      />

      <Example
      title="2. Judging question plausibility"
      query="psyllium husk fiber"
      answer="Psyllium is a soluble fiber used primarily as a gentle bulk-forming laxative in products such as Metamucil."
      passages={[]}
      expected={({plausibility:true, passages:[]})}
      onChanged={(evt) => this.handleValueChanged({"plausibility-2": evt})}
      editable={this.props.editable}
      successPrompt="Even though this question doesn't have a question word, it seems to be someone asking for the definition or explanation of what 'psyllium husk fiber' is."
      />

      <Example
      title="3. Judging question plausibility"
      query="metatarsal what causes"
      answer="The metatarsal bones, or metatarsus are a group of five long bones in the foot, located between the tarsal bones of the hind- and mid-foot and the phalanges of the toes."
      passages={[]}
      expected={({plausibility:false, passages:[]})}
      onChanged={(evt) => this.handleValueChanged({"plausibility-3": evt})}
      editable={this.props.editable}
      successPrompt="It's very unclear to use what this question even means because metatarsal is a type of bone and can't obviously cause anything."
      />

      <h3>Judging answer plausibility</h3>
      <p>
      We'd then like you to <b>check if the response even makes sense for the question</b>.
      For example, for the question <i>"who said the quote by any means necessary"</i>,
      &nbsp;<i>Malcom X</i> or <i>King Louis XVII</i> are both plausible
      answers, while <i>the pancreatic tissue</i> or <i>the Sun</i> are
      not. Now, try these examples:
      </p>

      <Example
      title="4. Judging answer plausibility"
      query="where are the submandibular lymph nodes located"
      answer="It is responsible for lymphatic drainage of the tongue, submaxillary (salivary) gland, lips, mouth, and conjunctiva."
      passages={[]}
      expected={({plausibility:false, passages:[]})}
      onChanged={(evt) => this.handleValueChanged({"plausibility-4": evt})}
      editable={this.props.editable}
      successPrompt="The answer seems to explain what these lymph nodes do, but not where they are."
      />

      <Example
      title="5. Judging answer plausibility"
      query="can you use a deactivated sim card again"
      answer="Once a SIM card retires, it can not be used again."
      passages={[]}
      expected={({plausibility:true, passages:[]})}
      onChanged={(evt) => this.handleValueChanged({"plausibility-5": evt})}
      editable={this.props.editable}
      successPrompt="Even though this is not a 'yes/no' response, it clearly answers the question."
      />

      <h3>Evaluating evidence for the response <Label bsStyle="primary">IMPORTANT: PLEASE READ!</Label></h3>
      <p>
      If the response is a plausible answer, we would like you to
      check whether or not it is a <i>correct answer</i> according to
      a few excerpted paragraphs.</p>
      <ol>
      <li>
      For each paragraph presented, first <b>read the paragraph</b> and
      indicate if the paragraph provides evidence that the response is correct (<Glyphicon glyph="ok" />),
      incorrect (<Glyphicon glyph="remove" />), or that the paragraph simply
      isn't sufficient to tell us either which way (<Glyphicon glyph="minus" />).&nbsp;
      <b>You only need to use commonsense knowledge and information contained
      within the question, answer or paragraph. You do not need
      to search online for further inormation.</b>
      </li>
      <li>
      If the paragraph provides evidence that the response is either
      correct (<Glyphicon glyph="ok" />) or incorrect (<Glyphicon
        glyph="remove" />), <b>highlight the regions of the text that you think justifies your decision</b>.
      <i>You can but do not have to highlight regions if the response is neutral (<Glyphicon
        glyph="minus" />)</i>.
      The highlighted regions don't need to be exact, but should help us understand why you are making your decision.
      </li>
      <li>
      <b>To remove a highlight, simply click on it.</b>
      </li>
      <li>
      If you judge the response to be correct (or incorrect), you will have to &nbsp;
      <b>confirm that the response is an answer (or not an answer) &nbsp;
      <u>for the question</u> according to your selected evidence</b>
      </li>
      <li>
      <b>Use the buttons on the lower right to move through the
    paragraphs.</b> You will need to make a decision on each paragraph
    to complete the task.
      </li>
      </ol>

      <p>
      Review the different paragraphs below by clicking
    on the icons in the lower right corner.
      </p>

      <Example
    title="Evaluating evidence (Example)"
    query="who said the quote by any means necessary"
    answer="Malcom X"
    passages={[
      {"passage_text": "It entered the popular culture through a speech given by Malcolm X in the last year of his life. \"We declare our right on this earth to be a man, ..., in this day, which we intend to bring into existence by any means necessary.\""},
      {"passage_text": "Though commonly attributed to Malcom X, the quote \"By any means necessary\" actually comes from a speech by Martin Luther King Jr. (Note: this is a fictional example.)"},
      {"passage_text": "Malcolm X’s life changed dramatically in the first six months of 1964. In May he toured West Africa and made a pilgrimage to Mecca, returning as El Hajj Malik El-Shabazz."},
    ]}
    expected={({plausibility:true, passages: [1, -1, 0], selections:[[[0, 66],[97,228]],[[40,130]],[]], confirmations: [true, true, undefined]})}
    editable={false}
      />

      <p>
      Now you try; if you made a mistake, simply click on the icons in the lower right corner to go back and correct your answer.
      </p>
      <Example
    title="6. Evaluating evidence"
    query="where are the submandibular lymph nodes located"
    answer="below the jaw"
    passages={[
      {"passage_text": "When these lymph nodes enlarge through infection, you may have a red, painful swelling in the area of the parotid or submandibular glands. Lymph nodes also enlarge due to tumors and inflammation."},
      {"passage_text": "Submandibular lymph nodes are glands that are a part of the immune system and are located below the jaw. Submandibular lymph nodes consist of lymphatic tissues enclosed by a fibrous capsule."},
      {"passage_text": "Secondary infection of salivary glands from adjacent lymph nodes also occurs. These lymph nodes are the glands in the upper neck which often become tender during a common sore throat. Many of these lymph nodes are actually located on, within, and deep in the substance of the parotid gland, near the submandibular glands."},
    ]}
    expected={({plausibility:true, passages: [0, 1, 1], selections:[[],[[0,104]],[[78,128]]], confirmations: [undefined, true, true]})}
      onChanged={(evt) => this.handleValueChanged({"judgement-1": evt})}
      editable={this.props.editable}
      successPrompt={<span>Note how "These lymph nodes are glands in the upper neck" was <i>not</i> selected because it was not specific enough for the answer, <u>below the jaw</u>, nor does it clearly contradict the answer as 'below the jaw' could also be in 'the upper neck'.</span>}
      />

      <Example
    title="7. Evaluating evidence"
    query="can you use a deactivated sim card again"
    answer="yes"
    passages={[
      {"passage_text": "I got the same question, how can I have my prepaid sim card reactivated. I haven't used or recharged this sim card for about more than six months. I just bought a new mobile phone and when I turned it on it said the sim card needs to be activated. I hope I can use this sim card again. Thank you."},
      {"passage_text": "What is BAN? When I try to activate an used SIM, but deactivated, on the SAME account, it works."},
      {"passage_text": "Once a SIM card is deactivated it is dead. You will have to get a new SIM."},
    ]}
    expected={({plausibility:true, passages: [0, 1, -1], selections:[[],[[14,98]],[[0,42]]], confirmations: [undefined, true, true]})}
      onChanged={(evt) => this.handleValueChanged({"judgement-2": evt})}
      editable={this.props.editable}
      />

      <Example
    title="8. Evaluating evidence (numerical answers don't have to be exact, but close enough)"
    query="how much do electricians charge"
    answer="$40 to $100 an hour"
    passages={[
      {"passage_text": "Although there are still a few low-cost areas where electricians work for $30-$50 an hour, typically they charge $50-$100 an hour or more depending on local rates and their qualifications."},
      {"passage_text": "Electricians typically charge between $65 and $110 an hour depending on their location and the type of work they do."},
      {"passage_text": "I haven't found a good electrician who charges less than $150 an hour."},
    ]}
    expected={({plausibility:true, passages: [1, 1, -1], selections:[[[52, 129]],[[0,58]],[[0, 70]]], confirmations: [true, true, true]})}
      onChanged={(evt) => this.handleValueChanged({"judgement-3": evt})}
      editable={this.props.editable}
      />

      </div>);
  }
}
InstructionContents.defaultProps = {
  bonus: 0.50,
  isFirstTime: false,
  editable: false,
  onValueChanged: () => {},
}


export default App;
