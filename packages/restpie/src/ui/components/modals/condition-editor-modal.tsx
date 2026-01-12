import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

import { Modal, type ModalHandle, ModalProps } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalFooter } from '../base/modal-footer';
import { ModalHeader } from '../base/modal-header';

interface ConditionEditorModalOptions {
  title: string;
  defaultValue: string;
  onSave: (value: string) => void;
  onClear: () => void;
}

export interface ConditionEditorModalHandle {
  show: (options: ConditionEditorModalOptions) => void;
  hide: () => void;
}

export const ConditionEditorModal = forwardRef<ConditionEditorModalHandle, ModalProps>((_, ref) => {
  const modalRef = useRef<ModalHandle>(null);
  const [state, setState] = useState<ConditionEditorModalOptions>({
    title: 'Condition',
    defaultValue: '',
    onSave: () => { },
    onClear: () => { },
  });
  const [value, setValue] = useState('');

  useImperativeHandle(ref, () => ({
    hide: () => {
      modalRef.current?.hide();
    },
    show: options => {
      setState(options);
      setValue(options.defaultValue || '');
      modalRef.current?.show();
    },
  }), []);

  const {
    title,
    onSave,
    onClear,
  } = state;

  return (
    <Modal ref={modalRef}>
      <ModalHeader>{title}</ModalHeader>
      <ModalBody className="pad">
        <div className="form-control form-control--outlined">
          <label>
            Include Condition
            <span className="faint txt-sm space-left">
              (JavaScript expression - include when TRUE)
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g., env === 'production' || includeAuth === true"
            value={value}
            onChange={e => setValue(e.target.value)}
            style={{ width: '100%', fontFamily: 'monospace' }}
          />
        </div>
        <p className="faint txt-sm pad-top-sm">
          You can reference variables from the currently selected environment, e.g. <code>includeAuth === true</code>
        </p>
      </ModalBody>
      <ModalFooter>
        <button
          className="btn btn--super-compact"
          onClick={() => {
            onClear();
            modalRef.current?.hide();
          }}
        >
          Clear Condition
        </button>
        <button
          className="btn"
          onClick={() => {
            onSave(value);
            modalRef.current?.hide();
          }}
        >
          Save
        </button>
      </ModalFooter>
    </Modal>
  );
});
ConditionEditorModal.displayName = 'ConditionEditorModal';
