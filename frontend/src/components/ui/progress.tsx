import { Progress as ChakraProgress } from "@chakra-ui/react"
import * as React from "react"

export interface ProgressBarProps extends ChakraProgress.RootProps {
    value?: number
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
    function ProgressBar(props, ref) {
        const { children, value, ...rest } = props
        return (
            <ChakraProgress.Root ref={ref} value={value} {...rest}>
                {children && <ChakraProgress.Label>{children}</ChakraProgress.Label>}
                <ChakraProgress.Track>
                    <ChakraProgress.Range />
                </ChakraProgress.Track>
            </ChakraProgress.Root>
        )
    },
)

export const ProgressRoot = ChakraProgress.Root
export const ProgressValueText = ChakraProgress.ValueText
