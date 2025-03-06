/**
 * Internal dependencies.
 */
import { Button } from "@next-pms/design-system/components";
import { ButtonProps } from "../type";

const FormDialogButton = ({ label, disabled, Icon, onClick, variant }: ButtonProps) => {
  return (
    <Button disabled={disabled} onClick={onClick} variant={variant}>
      {Icon && <Icon />}
      {label}
    </Button>
  );
};

export { FormDialogButton };
