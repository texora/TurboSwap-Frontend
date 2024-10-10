import {
  Box,
  BoxProps,
  Grid,
  GridItem,
  HStack,
  InputGroup,
  Spacer,
  StackProps,
  SystemStyleObject,
  Text,
  useColorMode,
  useDisclosure,
  Input
} from '@chakra-ui/react'
import { ApiV3Token, TokenInfo, SOL_INFO } from '@raydium-io/raydium-sdk-v2'
import Decimal from 'decimal.js'
import React, { ReactNode, useEffect, useState, useRef } from 'react'
import useTokenPrice from '@/hooks/token/useTokenPrice'
import { useEvent } from '@/hooks/useEvent'
import { toastSubject } from '@/hooks/toast/useGlobalToast'
import BalanceWalletIcon from '@/icons/misc/BalanceWalletIcon'
import ChevronDownIcon from '@/icons/misc/ChevronDownIcon'
import { useAppStore, useTokenAccountStore, useTokenStore } from '@/store'
import { colors } from '@/theme/cssVariables'
import { trimTrailZero, formatCurrency, formatToRawLocaleStr, detectedSeparator } from '@/utils/numberish/formatter'

import { t } from 'i18next'
import { getOrCreateAssociatedTokenAccount, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

export const epsGetPoolInfo = async () => {
  const epsWallet = useWallet();
  const epsPoolAddress = ["A6fVkHYNEtfBcMdUo9rVg92SAA5AhePwvNe1sqLsc7pQ"];


}


export const poolinfo = {
  "type": "Standard",
  "programId": "8PzREVMxRooeR2wbihZdp2DDTQMZkX9MVzfa8ZV615KW",
  "id": "A6fVkHYNEtfBcMdUo9rVg92SAA5AhePwvNe1sqLsc7pQ",
  "mintA": {
    "chainId": 101,
    "address": "5gFSyxjNsuQsZKn9g5L9Ky3cSUvJ6YXqWVuPzmSi8Trx",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "logoURI": "https://img-v1.raydium.io/icon/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png",
    "symbol": "USDC",
    "name": "Wrapped SOL",
    "decimals": 9,
    "tags": [],
    "extensions": {}
  },
  "mintB": {
    "chainId": 102,
    "address": "FjtvYfdfxjBdgtFdHX6AZEPbtowsMhiUF5D53jYxWUba",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "logoURI": "https://img-v1.raydium.io/icon/2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk.png",
    "symbol": "ETH",
    "name": "eth",
    "decimals": 9,
    "tags": [],
    "extensions": {}
  },
  "price": 21467.500178514427,
  "mintAmountA": 1318.73611189,
  "mintAmountB": 28309967.717412,
  "feeRate": 0.0025,
  "openTime": "0",
  "tvl": 364090.9,
  "day": {
    "volume": 16003268.799198171,
    "volumeQuote": 7003025684.0527525,
    "volumeFee": 40008.17199799543,
    "apr": 4010.81,
    "feeApr": 4010.81,
    "priceMin": 10756.752204545455,
    "priceMax": 38603507.47044753,
    "rewardApr": []
  },
  "week": {
    "volume": 31841158.76864387,
    "volumeQuote": 24198561909.19259,
    "volumeFee": 79602.89692160966,
    "apr": 655.9,
    "feeApr": 655.9,
    "priceMin": 10756.752204545455,
    "priceMax": 38603507.47044753,
    "rewardApr": []
  },
  "month": {
    "volume": 31841158.76864387,
    "volumeQuote": 24198561909.19259,
    "volumeFee": 79602.89692160966,
    "apr": 262.36,
    "feeApr": 262.36,
    "priceMin": 10756.752204545455,
    "priceMax": 38603507.47044753,
    "rewardApr": []
  },
  "pooltype": [
    "OpenBookMarket"
  ],
  "rewardDefaultInfos": [],
  "farmUpcomingCount": 0,
  "farmOngoingCount": 0,
  "farmFinishedCount": 0,
  "marketId": "AeA48gMU1H2D1c1uRwa9yS2TrCsPYvgmUEPF4fR3L8tk",
  "lpMint": {
    "chainId": 101,
    "address": "3q9Pt2RRFTc8wU8QBBn3Ymg69J51hUPsDEuJtMzBvVGk",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "logoURI": "",
    "symbol": "",
    "name": "",
    "decimals": 9,
    "tags": [],
    "extensions": {}
  },
  "lpPrice": 88.51377889682935,
  "lpAmount": 4113.381070308,
  "burnPercent": 98.29,
  "poolName": "USDC - ETH",
  "poolDecimals": 9,
  "isOpenBook": true,
  "weeklyRewards": [],
  "allApr": {
    "day": [
      {
        "apr": 4010.81,
        "percent": 100,
        "isTradingFee": true
      }
    ],
    "week": [
      {
        "apr": 655.9,
        "percent": 100,
        "isTradingFee": true
      }
    ],
    "month": [
      {
        "apr": 262.36,
        "percent": 100,
        "isTradingFee": true
      }
    ]
  },
  "totalApr": {
    "day": 4010.81,
    "week": 655.9,
    "month": 262.36
  },
  "formattedRewardInfos": [],
  "isRewardEnded": true
}
