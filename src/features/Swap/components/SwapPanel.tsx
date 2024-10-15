import ConnectedButton from '@/components/ConnectedButton'
import { QuestionToolTip } from '@/components/QuestionToolTip'
import TokenInput, { DEFAULT_SOL_RESERVER } from '@/components/TokenInput'
import { useEvent } from '@/hooks/useEvent'
import { useHover } from '@/hooks/useHover'
import { useAppStore, useTokenAccountStore, useTokenStore } from '@/store'
import { colors } from '@/theme/cssVariables'
import { Box, Button, Collapse, Flex, HStack, SimpleGrid, Text, useDisclosure, CircularProgress } from '@chakra-ui/react'
import { ApiV3Token, RAYMint, SOL_INFO, TokenInfo } from '@raydium-io/raydium-sdk-v2'
import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import shallow from 'zustand/shallow'
import CircleInfo from '@/icons/misc/CircleInfo'
import { getSwapPairCache, setSwapPairCache } from '../util'
import { urlToMint, mintToUrl, isSolWSol, getMintPriority } from '@/utils/token'
import { SwapInfoBoard } from './SwapInfoBoard'
import SwapButtonTwoTurnIcon from '@/icons/misc/SwapButtonTwoTurnIcon'
import SwapButtonOneTurnIcon from '@/icons/misc/SwapButtonOneTurnIcon'
import useSwap from '../useSwap'
import { ApiSwapV1OutSuccess } from '../type'
import { useSwapStore } from '../useSwapStore'
import Decimal from 'decimal.js'
import HighRiskAlert from './HighRiskAlert'
import { useRouteQuery, setUrlQuery } from '@/utils/routeTools'
import WarningIcon from '@/icons/misc/WarningIcon'
import dayjs from 'dayjs'
import { getAccount, getOrCreateAssociatedTokenAccount, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Trans } from 'react-i18next'
import { formatToRawLocaleStr } from '@/utils/numberish/formatter'
import useTokenInfo from '@/hooks/token/useTokenInfo'
import { debounce } from '@/utils/functionMethods'
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program, AnchorProvider, BN, utils } from '@project-serum/anchor';
import { IDL } from '@/idl/raydium_cp_swap'
import { getAmmConfigAddress, getAuthAddress, getPoolAddress, getPoolLpMintAddress, getPoolVaultAddress, getOrcleAccountAddress } from '@/utils/pda'
import { NATIVE_MINT } from '@solana/spl-token'
import { toastSubject } from '@/hooks/toast/useGlobalToast'
import ExternalLink from '@/icons/misc/ExternalLink'

export function SwapPanel({
  onInputMintChange,
  onOutputMintChange,
  onDirectionNeedReverse
}: {
  onInputMintChange?: (mint: string) => void
  onOutputMintChange?: (mint: string) => void
  onDirectionNeedReverse?(): void
}) {
  const wallet = useWallet();
  const query = useRouteQuery<{ inputMint: string; outputMint: string }>()
  const [urlInputMint, urlOutputMint] = [urlToMint(query.inputMint), urlToMint(query.outputMint)]
  const { inputMint: cacheInput, outputMint: cacheOutput } = getSwapPairCache()
  const [defaultInput, defaultOutput] = [urlInputMint || cacheInput, urlOutputMint || cacheOutput]

  const { t, i18n } = useTranslation()
  const { swap: swapDisabled } = useAppStore().featureDisabled
  const swapTokenAct = useSwapStore((s) => s.swapTokenAct)
  const unWrapSolAct = useSwapStore((s) => s.unWrapSolAct)
  const tokenMap = useTokenStore((s) => s.tokenMap)
  const [getTokenBalanceUiAmount, fetchTokenAccountAct, refreshTokenAccTime] = useTokenAccountStore(
    (s) => [s.getTokenBalanceUiAmount, s.fetchTokenAccountAct, s.refreshTokenAccTime],
    shallow
  )
  const { isOpen: isSending, onOpen: onSending, onClose: offSending } = useDisclosure()
  const { isOpen: isUnWrapping, onOpen: onUnWrapping, onClose: offUnWrapping } = useDisclosure()
  const { isOpen: isHightRiskOpen, onOpen: onHightRiskOpen, onClose: offHightRiskOpen } = useDisclosure()
  const sendingResult = useRef<ApiSwapV1OutSuccess | undefined>()
  const wsolBalance = getTokenBalanceUiAmount({ mint: NATIVE_MINT.toBase58(), decimals: SOL_INFO.decimals })

  // const [inputMint, setInputMint] = useState<string>(PublicKey.default.toBase58())
  const [inputMint, setInputMint] = useState<string>(defaultInput)
  const [swapType, setSwapType] = useState<'BaseIn' | 'BaseOut'>('BaseIn')

  // const [outputMint, setOutputMint] = useState<string>(RAYMint.toBase58())
  const [outputMint, setOutputMint] = useState<string>(defaultOutput)
  // const [tokenInput, tokenOutput] = [tokenMap.get(inputMint), tokenMap.get(outputMint)]
  const [tokenInput, setTokenInput] = useState<TokenInfo | ApiV3Token | undefined>(undefined)
  const [tokenOutput, setTokenOutput] = useState<TokenInfo | ApiV3Token | undefined>(undefined)
  const [cacheLoaded, setCacheLoaded] = useState(false)
  const isTokenLoaded = tokenMap.size > 0
  const { tokenInfo: unknownTokenA } = useTokenInfo({
    mint: isTokenLoaded && !tokenInput && inputMint ? inputMint : undefined
  })
  const { tokenInfo: unknownTokenB } = useTokenInfo({
    mint: isTokenLoaded && !tokenOutput && outputMint ? outputMint : undefined
  })
  const [balance, setBalance] = useState({ balance1: 0, balance2: 0 })

  useEffect(() => {
    if (defaultInput) setInputMint(defaultInput)
    if (defaultOutput && defaultOutput !== defaultInput) setOutputMint(defaultOutput)
    setCacheLoaded(true)
  }, [defaultInput, defaultOutput])

  useEffect(() => {
    if (!cacheLoaded) return
    onInputMintChange?.(inputMint)
    onOutputMintChange?.(outputMint)
    setUrlQuery({ inputMint: mintToUrl(inputMint), outputMint: mintToUrl(outputMint) })
  }, [inputMint, outputMint, cacheLoaded])

  const [amountIn, setAmountIn] = useState<string>('')
  const [needPriceUpdatedAlert, setNeedPriceUpdatedAlert] = useState(false)
  const [hasValidAmountOut, setHasValidAmountOut] = useState(false)

  const handleUnwrap = useEvent(() => {
    onUnWrapping()
    unWrapSolAct({
      amount: wsolBalance.rawAmount.toFixed(0),
      onSent: offUnWrapping,
      onClose: offUnWrapping,
      onError: offUnWrapping
    })
  })

  const isSwapBaseIn = swapType === 'BaseIn'
  const { response, data, isLoading, isValidating, error, openTime, mutate } = useSwap({
    inputMint,
    outputMint,
    amount: new Decimal(amountIn || 0)
      .mul(10 ** ((isSwapBaseIn ? tokenInput?.decimals : tokenOutput?.decimals) || 0))
      .toFixed(0, Decimal.ROUND_FLOOR),
    swapType,
    refreshInterval: isSending || isHightRiskOpen ? 3 * 60 * 1000 : 1000 * 30
  })

  const onPriceUpdatedConfirm = useEvent(() => {
    setNeedPriceUpdatedAlert(false)
    sendingResult.current = response as ApiSwapV1OutSuccess
  })

  const computeResult = needPriceUpdatedAlert ? sendingResult.current?.data : data
  const isComputing = isLoading || isValidating
  const isHighRiskTx = (computeResult?.priceImpactPct || 0) > 5

  // const inputAmount =
  //   computeResult && tokenInput
  //     ? new Decimal(computeResult.inputAmount).div(10 ** tokenInput?.decimals).toFixed(tokenInput?.decimals)
  //     : computeResult?.inputAmount || ''
  const [inputAmount, setInputAmount] = useState("")

  const [outputAmount, setOutputAmount] = useState("");
  //   const outputAmount =
  // amountIn
  //   ? ""
  //   : ''

  useEffect(() => {
    if (!cacheLoaded) return
    const [inputMint, outputMint] = [urlToMint(query.inputMint), urlToMint(query.outputMint)]
    if (inputMint && tokenMap.get(inputMint)) {
      setInputMint(inputMint)
      setSwapPairCache({
        inputMint
      })
    }
    if (outputMint && tokenMap.get(outputMint)) {
      setOutputMint(outputMint)
      setSwapPairCache({
        outputMint
      })
    }
  }, [tokenMap, cacheLoaded])

  useEffect(() => {
    if (isSending && response && response.data?.outputAmount !== sendingResult.current?.data.outputAmount) {
      setNeedPriceUpdatedAlert(true)
    }
  }, [response?.id, isSending])

  const debounceUpdate = useCallback(
    debounce(({ outputAmount, isComputing }) => {
      setHasValidAmountOut(Number(outputAmount) !== 0 || isComputing)
    }, 150),
    []
  )

  useEffect(() => {
    debounceUpdate({ outputAmount, isComputing })
  }, [outputAmount, isComputing])

  const handleInputChange = useCallback((val: string) => {
    setSwapType('BaseIn')
    setAmountIn(val)
    fetchAmount()
  }, [])

  const handleInput2Change = useCallback((val: string) => {
    setSwapType('BaseOut')
    setAmountIn(val)
    fetchAmount()
  }, [])

  const handleSelectToken = useCallback(
    (token: TokenInfo | ApiV3Token, side?: 'input' | 'output') => {
      if (side === 'input') {
        if (getMintPriority(token.address) > getMintPriority(outputMint)) {
          onDirectionNeedReverse?.()
        }
        setInputMint(token.address)
        setTokenInput(token);
        setOutputMint((mint) => (token.address === mint ? '' : mint))
      }
      if (side === 'output') {
        if (getMintPriority(inputMint) > getMintPriority(token.address)) {
          onDirectionNeedReverse?.()
        }
        setTokenOutput(token)
        setOutputMint(token.address)
        setInputMint((mint) => {
          if (token.address === mint) {
            return ''
          }
          return mint
        })
      }
    },
    [inputMint, outputMint]
  )

  const handleChangeSide = useEvent(() => {
    setInputMint(outputMint)
    setOutputMint(inputMint)
    setSwapPairCache({
      inputMint: outputMint,
      outputMint: inputMint
    })
  })

  const balanceAmount = getTokenBalanceUiAmount({ mint: inputMint, decimals: tokenInput?.decimals }).amount
  const balanceNotEnough = balanceAmount.lt(inputAmount || 0) ? t('error.balance_not_enough') : undefined
  const isSolFeeNotEnough = inputAmount && isSolWSol(inputMint || '') && balanceAmount.sub(inputAmount || 0).lt(DEFAULT_SOL_RESERVER)
  const swapError = (error && i18n.exists(`swap.error_${error}`) ? t(`swap.error_${error}`) : error) || balanceNotEnough
  const isPoolNotOpenError = !!swapError && !!openTime

  const handleHighRiskConfirm = useEvent(() => {
    offHightRiskOpen()
    handleClickSwap()
  })

  const anchorWallet = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) return null;
    return {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction.bind(wallet),
      signAllTransactions: wallet.signAllTransactions.bind(wallet),
    };
  }, [wallet]);

  useEffect(() => {
    fetchAmount();
  }, [inputMint, outputMint])

  const fetchAmount = async () => {
    console.log("aaaaaaaa")
    console.log(`${inputMint} ---- ${outputMint}`)
    if (!inputMint || !outputMint) return;
    console.log("bbbbbbbbbbbbbbbbbbbb")
    try {
      const connection = new Connection("https://testnet.dev2.eclipsenetwork.xyz", 'confirmed');
      const programId = new PublicKey('tmcnqP66JdK5UwnfGWJCy66K9BaJjnCqvoGNYEn9VJv');

      // 
      const inputToken = new PublicKey(inputMint);
      const outputToken = new PublicKey(outputMint);

      let config_index = 0;

      const [address, _] = await getAmmConfigAddress(
        config_index,
        programId
      );
      const configAddress = address;

      const [poolAddress] = await getPoolAddress(
        configAddress,
        inputToken,
        outputToken,
        programId
      );

      const [inputVault] = await getPoolVaultAddress(
        poolAddress,
        inputToken,
        programId
      );
      const [outputVault] = await getPoolVaultAddress(
        poolAddress,
        outputToken,
        programId
      );

      let balance1 = await connection.getTokenAccountBalance(inputVault)
      let balance2 = await connection.getTokenAccountBalance(outputVault)
      console.log(balance1.value.uiAmount)
      console.log(balance2.value.uiAmount)

      if (balance2.value.uiAmount && balance1.value.uiAmount) {
        setBalance({
          balance1: balance1.value.uiAmount,
          balance2: balance2.value.uiAmount
        });
        if (amountIn !== "") {
          if (swapType === "BaseIn")
            setOutputAmount((balance.balance2 * parseFloat(amountIn) / balance.balance1 * 0.08).toString())
          else
            setInputAmount((balance.balance1 * parseFloat(amountIn) / balance.balance2 * 0.08).toString())
        }
      }

    } catch (error) {
      console.log(error)
    }

  }

  // useEffect(() => {

  // }, [balance.balance1, balance.balance2])

  useEffect(() => {
    console.log(balance.balance1 + "    " + balance.balance2 + "      " + amountIn)
    if (balance.balance1 !== 0 && balance.balance2 !== 0 && amountIn !== "") {
      if (swapType === "BaseIn")
        setOutputAmount((balance.balance2 * parseFloat(amountIn) / balance.balance1 * 0.08).toString())
      else
        setInputAmount((balance.balance1 * parseFloat(amountIn) / balance.balance2 * 0.08).toString())
    }
  }, [amountIn])


  const handleClickSwap = async () => {
    try {

      // if (!response) return
      // sendingResult.current = response as ApiSwapV1OutSuccess
      if (!anchorWallet) return;
      if (!inputMint || !outputMint) return;

      onSending()

      const connection = new Connection("https://testnet.dev2.eclipsenetwork.xyz", 'confirmed');
      const provider = new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions());
      const programId = new PublicKey('tmcnqP66JdK5UwnfGWJCy66K9BaJjnCqvoGNYEn9VJv');
      const program = new Program(IDL, programId, provider);

      // 
      const inputToken = new PublicKey(inputMint);
      const outputToken = new PublicKey(outputMint);
      const inputTokenProgram = TOKEN_PROGRAM_ID;
      const outputTokenProgram = TOKEN_PROGRAM_ID;
      const inputTokenAccountAddr = getAssociatedTokenAddressSync(
        inputToken,
        anchorWallet.publicKey,
        false,
        inputTokenProgram
      );
      const inputTokenAccountBefore = await getAccount(
        connection,
        inputTokenAccountAddr,
        "processed",
        inputTokenProgram
      );

      //
      let amount_in = isSwapBaseIn ? new BN(parseFloat(amountIn) * 100_000_000) : new BN(parseFloat(inputAmount) * 100_000_000);
      // let amount_out = isSwapBaseIn ? new BN(parseFloat(outputAmount) * 100_000_000) : new BN(parseFloat(amountIn) * 100_000_000);

      let config_index = 0;

      const [address, _] = await getAmmConfigAddress(
        config_index,
        program.programId
      );
      const configAddress = address;

      const [auth] = await getAuthAddress(program.programId);
      const [poolAddress] = await getPoolAddress(
        configAddress,
        inputToken,
        outputToken,
        program.programId
      );
      console.log(poolAddress.toString())

      const [inputVault] = await getPoolVaultAddress(
        poolAddress,
        inputToken,
        program.programId
      );
      const [outputVault] = await getPoolVaultAddress(
        poolAddress,
        outputToken,
        program.programId
      );

      let balance1 = await connection.getTokenAccountBalance(inputVault)
      let balance2 = await connection.getTokenAccountBalance(outputVault)

      console.log(inputVault.toString())
      console.log(outputVault.toString())
      console.log(balance1)
      console.log(balance2)

      const inputTokenAccount = getAssociatedTokenAddressSync(
        inputToken,
        anchorWallet.publicKey,
        false,
        inputTokenProgram
      );
      const outputTokenAccount = getAssociatedTokenAddressSync(
        outputToken,
        anchorWallet.publicKey,
        false,
        outputTokenProgram
      );
      const [observationAddress] = await getOrcleAccountAddress(
        poolAddress,
        program.programId
      );

      const tx = await program.methods
        .swapBaseInput(amount_in, new BN(0))
        .accounts({
          payer: anchorWallet.publicKey,
          authority: auth,
          ammConfig: configAddress,
          poolState: poolAddress,
          inputTokenAccount,
          outputTokenAccount,
          inputVault,
          outputVault,
          inputTokenProgram: inputTokenProgram,
          outputTokenProgram: outputTokenProgram,
          inputTokenMint: inputToken,
          outputTokenMint: outputToken,
          observationState: observationAddress,
        })
        .rpc();

      toastSubject.next({
        title: 'Swap completed!',
        description: (
          <Box>
            You swapped successfully
          </Box>
        ),
        detail: (
          <Flex align="center" gap={1} opacity={0.5} onClick={() => { window.open(`https://solscan.io/tx/${tx}?cluster=custom&customUrl=https://testnet.dev2.eclipsenetwork.xyz`) }} >
            View transaction details <ExternalLink />
          </Flex>
        ),
        status: 'success',
        isClosable: false,
        duration: 5000
      })

      const inputTokenAccountAfter = await getAccount(
        connection,
        inputTokenAccountAddr,
        "processed",
        inputTokenProgram
      );

      offSending()

      // swapTokenAct({
      //   swapResponse: response as ApiSwapV1OutSuccess,
      //   wrapSol: tokenInput?.address === PublicKey.default.toString(),
      //   unwrapSol: tokenOutput?.address === PublicKey.default.toString(),
      //   onCloseToast: offSending,
      //   onConfirmed: () => {
      //     setAmountIn('')
      //     setNeedPriceUpdatedAlert(false)
      //     offSending()
      //   },
      //   onError: () => {
      //     offSending()
      //     mutate()
      //   }
      // })
    } catch (error) {
      console.log(error)
      offSending();
    }

  }

  const getCtrSx = (type: 'BaseIn' | 'BaseOut') => {
    if (!new Decimal(amountIn || 0).isZero() && swapType === type) {
      return {
        border: `1px solid ${colors.semanticFocus}`,
        boxShadow: `0px 0px 12px 6px ${colors.semanticFocusShadow}`
      }
    }
    return { border: '1px solid transparent' }
  }

  const handleRefresh = useEvent(() => {
    if (isSending || isHightRiskOpen) return
    mutate()
    if (Date.now() - refreshTokenAccTime < 10 * 1000) return
    fetchTokenAccountAct({})
  })

  const outputFilterFn = useEvent((token: TokenInfo) => {
    if (isSolWSol(tokenInput?.address) && isSolWSol(token.address)) return false
    return true
  })
  const inputFilterFn = useEvent((token: TokenInfo) => {
    if (isSolWSol(tokenOutput?.address) && isSolWSol(token.address)) return false
    return true
  })

  return (
    <>
      <Flex mb={[4, 5]} direction="column">
        {/* input */}
        <TokenInput
          name="swap"
          topLeftLabel={t('swap.from_label')}
          ctrSx={getCtrSx('BaseIn')}
          token={tokenInput}
          value={isSwapBaseIn ? amountIn : inputAmount}
          readonly={swapDisabled || (!isSwapBaseIn && isComputing)}
          disableClickBalance={swapDisabled}
          onChange={(v) => handleInputChange(v)}
          filterFn={inputFilterFn}
          onTokenChange={(token) => handleSelectToken(token, 'input')}
          defaultUnknownToken={unknownTokenA}
        />
        <SwapIcon onClick={handleChangeSide} />
        {/* output */}
        <TokenInput
          name="swap"
          topLeftLabel={t('swap.to_label')}
          ctrSx={getCtrSx('BaseOut')}
          token={tokenOutput}
          value={isSwapBaseIn ? outputAmount : amountIn}
          readonly={swapDisabled || (isSwapBaseIn && isComputing)}
          onChange={handleInput2Change}
          filterFn={outputFilterFn}
          onTokenChange={(token) => handleSelectToken(token, 'output')}
          defaultUnknownToken={unknownTokenB}
        />
      </Flex>
      {/* swap info */}
      {/* <Collapse in={hasValidAmountOut} animateOpacity>
        <Box mb={[4, 5]}>
          <SwapInfoBoard
            amountIn={amountIn}
            tokenInput={tokenInput}
            tokenOutput={tokenOutput}
            isComputing={isComputing && !isSending}
            computedSwapResult={computeResult}
            onRefresh={handleRefresh}
          />
        </Box>
      </Collapse> */}

      <Collapse in={needPriceUpdatedAlert}>
        <Box pb={[4, 5]}>
          <SwapPriceUpdatedAlert onConfirm={onPriceUpdatedConfirm} />
        </Box>
      </Collapse>
      {isSolFeeNotEnough ? (
        <Flex
          rounded="xl"
          p="2"
          mt="-2"
          mb="3"
          fontSize="sm"
          bg={'rgba(255, 78, 163,0.1)'}
          color={colors.semanticError}
          alignItems="start"
          justifyContent="center"
        >
          <WarningIcon style={{ marginTop: '2px', marginRight: '4px' }} stroke={colors.semanticError} />
          <Text>{t('swap.error_sol_fee_not_insufficient', { amount: formatToRawLocaleStr(DEFAULT_SOL_RESERVER) })}</Text>
        </Flex>
      ) : null}
      {wsolBalance.isZero ? null : (
        <Flex
          rounded="md"
          mt="-2"
          mb="3"
          fontSize="xs"
          fontWeight={400}
          bg={colors.backgroundTransparent07}
          alignItems="center"
          px="4"
          py="2"
          gap="1"
          color={colors.textSecondary}
        >
          <CircleInfo />
          <Trans
            i18nKey={'swap.unwrap_wsol_info'}
            values={{
              amount: wsolBalance.text
            }}
            components={{
              sub: isUnWrapping ? <Progress /> : <Text cursor="pointer" color={colors.textLink} onClick={handleUnwrap} />
            }}
          />
        </Flex>
      )}
      <ConnectedButton
        // isDisabled={new Decimal(amountIn || 0).isZero() || !!swapError || needPriceUpdatedAlert || swapDisabled}
        isLoading={isComputing || isSending}
        loadingText={<div>{isSending ? t('transaction.transaction_initiating') : isComputing ? t('swap.computing') : ''}</div>}
        onClick={isHighRiskTx ? onHightRiskOpen : handleClickSwap}
      >
        <Text>
          Swap
          {/* {swapDisabled ? t('common.disabled') : swapError || t('swap.title')} */}
          {/* {isPoolNotOpenError ? ` ${dayjs(Number(openTime) * 1000).format('YYYY/M/D HH:mm:ss')}` : null} */}
        </Text>
      </ConnectedButton>
      <HighRiskAlert
        isOpen={isHightRiskOpen}
        onClose={offHightRiskOpen}
        onConfirm={handleHighRiskConfirm}
        percent={computeResult?.priceImpactPct ?? 0}
      />
    </>
  )
}

function SwapPriceUpdatedAlert({ onConfirm }: { onConfirm: () => void }) {
  const { t } = useTranslation()
  return (
    <HStack bg={colors.backgroundDark} padding={'8px 16px'} rounded={'xl'} justify={'space-between'}>
      <HStack color={colors.textSecondary}>
        <Text fontSize={'sm'}>{t('swap.alert_price_updated')}</Text>
        <QuestionToolTip label={t('swap.alert_price_updated_tooltip')} />
      </HStack>
      <Button size={['sm', 'md']} onClick={onConfirm}>
        {t('swap.alert_price_updated_button')}
      </Button>
    </HStack>
  )
}

function SwapIcon(props: { onClick?: () => void }) {
  const targetElement = useRef<HTMLDivElement | null>(null)
  const isHover = useHover(targetElement)
  return (
    <SimpleGrid
      ref={targetElement}
      bg={isHover ? colors.semanticFocus : undefined}
      width="42px"
      height="42px"
      placeContent="center"
      rounded="full"
      cursor="pointer"
      my={-3}
      mx="auto"
      zIndex={2}
      onClick={props.onClick}
    >
      {isHover ? <SwapButtonTwoTurnIcon /> : <SwapButtonOneTurnIcon />}
    </SimpleGrid>
  )
}

function Progress() {
  return <CircularProgress isIndeterminate size="16px" />
}
