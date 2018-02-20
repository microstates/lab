import React from 'react';
import AriaModal from 'react-aria-modal';
import propTypes from 'prop-types';

export default function NameInput({
  onAbandon,
  position,
  value,
  onChange,
  onSave
}) {
  let { x, y } = position;
  return (
    <AriaModal
      titleText="Name"
      onExit={onAbandon}
      initialFocus="#name-input"
      underlayStyle={{ background: 'none' }}
    >
      <div
        style={{
          position: 'absolute',
          top: y,
          left: x
        }}
      >
        <input
          placeholder={value}
          required={true}
          id="name-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyUp={e => e.key === 'Enter' && onSave()}
        />
      </div>
    </AriaModal>
  );
}

NameInput.propTypes = {
  onAbandon: propTypes.func.isRequired,
  onSave: propTypes.func.isRequired,
  position: propTypes.shape({
    x: propTypes.number.isRequired,
    y: propTypes.number.isRequired
  }),
  value: propTypes.string.isRequired,
  onChange: propTypes.func.isRequired
};
