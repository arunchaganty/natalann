import React, { Component } from 'react';
import './EditableDocument.css';
import { Panel } from 'react-bootstrap';

class ContentEditable extends Component {
  constructor(props) {
    super(props);
    this.emitChange = this.emitChange.bind(this);
  }
  render() {
    return (<div 
      className={this.props.className}
      onInput={this.emitChange} 
      onBlur={this.emitChange} 
      contentEditable={this.props.editable}
      dangerouslySetInnerHTML={{__html: this.props.html}}
      ref={(input) => {this.domNode = input;}} ></div>);
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.editable !== this.props.editable || nextProps.html !== this.domNode.innerHTML;
  }

  componentDidUpdate() {
    if ( this.domNode && this.shouldComponentUpdate(this.props)) {
      // Perhaps React (whose VDOM gets outdated because we often prevent
      // rerendering) did not update the DOM. So we update it manually now.
      this.domNode.innerHTML = this.props.html;
    }
  }

  emitChange(evt) {
    var html = this.domNode.innerHTML;
    if (this.props.onChange && html !== this.props.html) {
      evt.target = {value: html};
      this.props.onChange(evt);
    } else {
      this.domNode.innerHTML = this.props.html; // Prevent edits if 
    }
  }
}

ContentEditable.defaultProps = {
  editable: true,
  html: "",
  onChange: () => {},
}


export default ContentEditable;
