'use client';
import { useId } from 'react';
import { Button, Modal } from 'react-bootstrap';

interface Props {
  show: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  show, title = 'Konfirmo', message, confirmLabel = 'Fshi', cancelLabel = 'Anulo', busy, onConfirm, onCancel,
}: Props) {
  const id = useId();
  return (
    <Modal show={show} onHide={onCancel} centered aria-labelledby={id}>
      <Modal.Header closeButton><Modal.Title id={id}>{title}</Modal.Title></Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
      </Modal.Footer>
    </Modal>
  );
}
