
import { Checkbox as ChakraCheckbox } from "@chakra-ui/react"
import * as React from "react"

export interface CheckboxProps extends ChakraCheckbox.RootProps {
    icon?: React.ReactElement
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>
    rootRef?: React.Ref<HTMLLabelElement>
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    function Checkbox(props, ref) {
        const { children, inputProps, rootRef, ...rest } = props
        return (
            <ChakraCheckbox.Root ref={rootRef} {...rest}>
                <ChakraCheckbox.HiddenInput ref={ref} {...inputProps} />
                <ChakraCheckbox.Control>
                    <ChakraCheckbox.Indicator />
                </ChakraCheckbox.Control>
                {children && <ChakraCheckbox.Label>{children}</ChakraCheckbox.Label>}
            </ChakraCheckbox.Root>
        )
    },
)
