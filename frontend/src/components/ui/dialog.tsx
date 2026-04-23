// Re-exports Dialog sub-components as named exports to avoid
// Vite production bundle tree-shaking issues with @chakra-ui/react
import { Dialog } from '@chakra-ui/react';

export const DialogRoot = Dialog.Root;
export const DialogContent = Dialog.Content;
export const DialogHeader = Dialog.Header;
export const DialogTitle = Dialog.Title;
export const DialogDescription = Dialog.Description;
export const DialogBody = Dialog.Body;
export const DialogFooter = Dialog.Footer;
export const DialogBackdrop = Dialog.Backdrop;
export const DialogPositioner = Dialog.Positioner;
export const DialogCloseTrigger = Dialog.CloseTrigger;
export const DialogActionTrigger = Dialog.ActionTrigger;
export const DialogTrigger = Dialog.Trigger;
