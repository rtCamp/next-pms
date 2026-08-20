export interface CreateViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createView: (view: {
    name: string;
    label: string;
    icon: string;
    isPublic: boolean;
  }) => Promise<void>;
}

export interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}
