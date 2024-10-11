import { colors } from '@/theme/cssVariables'
import { Text, Flex, Img } from '@chakra-ui/react'
import { eclipseTokenList } from '@/utils/eclipseTokenList'

// export interface TokenSelectDialogProps {
//   onSelectValue: (token: TokenInfo) => void
//   isOpen: boolean
//   filterFn?: (token: TokenInfo) => boolean
//   onClose: () => void
// }

const handleClick = (item: typeof eclipseTokenList[0]) => {
  console.log(item.value) // Log the item value
}

export default function TokenItem(props: { chooseToken: Function }) {
  return (
    <Flex direction="column" className="iteams">
      {eclipseTokenList.map((item, index) => (
        <Flex
          alignItems="center"
          justifyContent="space-around"
          gap="10px"
          padding="6px 0"
          rounded="4px"
          cursor="pointer"
          key={index}
          onClick={() => { props.chooseToken(item.value) }} // Pass the item correctly
        >
          <Img src={item.value.logoURI} />
          <Flex direction="column" width="200px">
            <Text fontSize="sm">{item.value.symbol}</Text>
            <Text fontSize="xs" color={colors.textSecondary}>
              {item.value.name}
            </Text>
          </Flex>
        </Flex>
      ))}
    </Flex>
  )
}
