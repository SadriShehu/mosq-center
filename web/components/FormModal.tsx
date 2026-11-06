'use client';
import type { FormEventHandler, ReactNode } from 'react';
import { useId } from 'react';
import { Button, Modal } from 'react-bootstrap';

interface Props {
  show: boolean;
  title: string;
  submitLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onHide: () => void;
  /** Pass the result of react-hook-form's handleSubmit(...). */
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
}

export function FormModal({
  show, title, submitLabel = 'Ruaj', cancelLabel = 'Mbyll', busy, onHide, onSubmit, children,
}: Props) {
  const id = useId();
  return (
    <Modal show={show} onHide={onHide} centered aria-labelledby={id}>
      <form onSubmit={onSubmit} noValidate>
        <Modal.Header closeButton><Modal.Title id={id}>{title}</Modal.Title></Modal.Header>
        <Modal.Body>{children}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>{cancelLabel}</Button>
          <Button type="submit" variant="primary" disabled={busy}>{submitLabel}</Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
