/**
 * Internal dependencies.
 */
import { Button } from "@next-pms/design-system/components";
import { ButtonProps } from "../type";

const FormDialogButton = ({ label, disabled, Icon, onClick, variant, type }: ButtonProps) => {
  if (type == "submit") {
    return (
      <Button disabled={disabled} type="submit" variant={variant}>
        {Icon && <Icon />}
        {label}
      </Button>
    );
  }

  return (
    <Button disabled={disabled} onClick={onClick} variant={variant}>
      {Icon && <Icon />}
      {label}
    </Button>
  );
};

export { FormDialogButton };
