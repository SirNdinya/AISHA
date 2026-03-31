import { Avatar as ChakraAvatar, Group } from "@chakra-ui/react"
import * as React from "react"

export interface AvatarProps extends ChakraAvatar.RootProps {
    src?: string
    srcSet?: string
    name?: string
    fallback?: React.ReactNode
    portrayedIcon?: React.ReactElement
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
    function Avatar(props, ref) {
        const { src, srcSet, name, portrayedIcon, fallback, ...rest } = props
        return (
            <ChakraAvatar.Root ref={ref} {...rest}>
                <ChakraAvatar.Fallback name={name}>
                    {fallback || portrayedIcon}
                </ChakraAvatar.Fallback>
                <ChakraAvatar.Image src={src} srcSet={srcSet} />
            </ChakraAvatar.Root>
        )
    },
)

export const AvatarGroup = Group
