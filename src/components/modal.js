import React, { PureComponent } from 'react';
import AriaModal from 'react-aria-modal';

export default class Modal extends PureComponent {
  state = {
    isOpen: false,
    value: '',
    x: 0,
    y: 0
  };

  close = () => this.setState({ isOpen: false });

  show = ({ x, y, text = '' }) => {
    return new Promise(resolve => {
      this.setState({
        isOpen: true,
        value: text,
        left: x,
        top: y,
        onClose: () => {
          this.close();
          resolve({ x, y, text: this.state.value });
        }
      });
    });
  };

  onKeyUp = e => {
    if (e.key === 'Enter') {
      this.state.onClose();
    }
  };

  render() {
    let { children } = this.props;

    return (
      <div>
        {children(this.show)}
        {this.state.isOpen && (
          <AriaModal
            titleText="State name"
            onExit={this.state.onClose}
            initialFocus="#name-input"
            underlayStyle={{ background: 'none' }}
          >
            <div
              style={{
                position: 'absolute',
                top: this.state.top,
                left: this.state.left
              }}
            >
              <input
                id="name-input"
                value={this.state.value}
                onChange={e => this.setState({ value: e.target.value })}
                onKeyUp={this.onKeyUp}
              />
            </div>
          </AriaModal>
        )}
      </div>
    );
  }
}
