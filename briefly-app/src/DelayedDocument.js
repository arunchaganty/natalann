import React, { Component } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Panel } from 'react-bootstrap';
import Document from './Document';
import './DelayedDocument.css';

/***
 * Renders a document slowly.
 */
const Fade = ({children, ...props}) => (
  <CSSTransition
    {...props}
    timeout={800}
    classNames="fade"
  >
  {children}
  </CSSTransition>
);

class DelayedDocument extends Component {
  constructor(props) {
    super(props);

    this.state = {
      revealed: 0,
    };
    this.intervalId = undefined;
    this.updateTime = this.updateTime.bind(this);
  }

  componentDidMount() {
    this.intervalId = window.setInterval(this.updateTime, 400);
  }

  componentWillUnmount() {
    window.clearInterval(this.intervalId);
  }

  updateTime(evt) {
    this.setState((state, props) => ({"revealed": state.revealed + 1}));
  }

  render() {
    const title = (<h3><b>{this.props.title}</b></h3>);
    const ix = this.state.revealed;
    const tokens = this.props.tokens.slice(0, ix);
    return (
      <Panel className="document" id={this.props.id} header={title} bsStyle={this.props.bsStyle}>
        <TransitionGroup className="example" id="document-contents">
          {tokens.map((item, i) => (
            <Fade key={i}>
              <span className="token">{item}</span>
            </Fade>
          ))}
        </TransitionGroup>
      </Panel>
    );
  }
}

DelayedDocument.defaultProps = {
  id: "#document",
  title: "Title",
  tokens: "America in in Hirsi somali-born the 45 after threats Netherlands emigrated facing Ali death . to 2006 , , member faith been She had for after renouncing and and her an parliament . target a a extremists of becoming atheist championed that that in in Hirsi has said as the the the the the the the best world and Ali fact . country law law U.S. U.S.".split(' '),
  bsStyle: "primary",
}

export default DelayedDocument;
