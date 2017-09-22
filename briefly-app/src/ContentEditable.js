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
      contentEditable
      dangerouslySetInnerHTML={{__html: this.props.html}}
      ref={(input) => {this.domNode = input;}} ></div>);
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.html !== this.domNode.innerHTML;
  }

  emitChange() {
    var html = this.domNode.innerHTML;
    if (this.props.onChange && html !== this.lastHtml) {
      this.props.onChange({
        target: {
          value: html
        }
      });
    }
    this.lastHtml = html;
  }
}

export default ContentEditable;
