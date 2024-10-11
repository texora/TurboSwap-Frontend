import { colors } from '@/theme/cssVariables'
import { Text, Flex, Img } from '@chakra-ui/react'

// export interface TokenSelectDialogProps {
//   onSelectValue: (token: TokenInfo) => void
//   isOpen: boolean
//   filterFn?: (token: TokenInfo) => boolean
//   onClose: () => void
// }

const eclipseTokenList = [
  {
    key: '2F5TprcNBqj2hXVr9oTssabKdf8Zbsf9xStqWjPm8yLo',
    value: {
      chainId: 101,
      address: '2F5TprcNBqj2hXVr9oTssabKdf8Zbsf9xStqWjPm8yLo',
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      decimals: 9,
      symbol: 'BTC',
      name: 'Bitcoin',
      logoURI: 'https://img-v1.raydium.io/icon/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E.png',
      tags: [],
      priority: 2,
      type: 'eclipse',
      extensions: {
        coingeckoId: 'solana'
      }
    }
  },
  {
    key: 'FjtvYfdfxjBdgtFdHX6AZEPbtowsMhiUF5D53jYxWUba',
    value: {
      chainId: 102,
      address: 'FjtvYfdfxjBdgtFdHX6AZEPbtowsMhiUF5D53jYxWUba',
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      decimals: 9,
      symbol: 'ETH',
      name: 'Ether',
      logoURI: 'https://img-v1.raydium.io/icon/2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk.png',
      tags: [],
      priority: 2,
      type: 'eclipse',
      extensions: {
        coingeckoId: 'solana'
      }
    }
  },
  {
    key: '5gFSyxjNsuQsZKn9g5L9Ky3cSUvJ6YXqWVuPzmSi8Trx',
    value: {
      chainId: 103,
      address: '5gFSyxjNsuQsZKn9g5L9Ky3cSUvJ6YXqWVuPzmSi8Trx',
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      decimals: 9,
      symbol: 'USDC',
      name: 'USD Coin',
      logoURI: 'https://img-v1.raydium.io/icon/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
      tags: [],
      priority: 2,
      type: 'eclipse',
      extensions: {
        coingeckoId: 'solana'
      }
    }
  }
]

const handleClick = (item: typeof eclipseTokenList[0]) => {
  console.log(item.value) // Log the item value
}

export default function TokenItem() {
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
          onClick={() => handleClick(item)} // Pass the item correctly
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
